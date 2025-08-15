\set ON_ERROR_STOP on

-- Optional guard: \if ! :{?FAMILY_NAME} \echo 'FAMILY_NAME required' \quit 3 \endif

-- Upsert Family with VALUES (coalesce(NULLIF(:'FAMILY_NAME',''), 'G Family'))
INSERT INTO public.families(name) 
VALUES (coalesce(nullif(:'FAMILY_NAME',''), 'G Family'))
ON CONFLICT (name) DO NOTHING;

-- Make the whitelist column LOWER(email) unique and seed using lower(...) to be case-insensitive
-- Handle the existing email_whitelist table structure if it exists
DO $$
BEGIN
  -- Check if the table exists and what constraints it has
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema='public' AND table_name='email_whitelist') THEN
    
    -- If there's a primary key on email, we need to work around it
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_schema='public' 
               AND table_name='email_whitelist' 
               AND constraint_type='PRIMARY KEY'
               AND constraint_name='email_whitelist_pkey') THEN
      -- We can't easily change the primary key, so we'll work with what we have
      -- The existing primary key on email should handle uniqueness
      RAISE NOTICE 'email_whitelist table exists with primary key, using existing structure';
    ELSE
      -- Try to add unique constraint on LOWER(email) if no primary key exists
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                     WHERE table_schema='public' 
                     AND table_name='email_whitelist' 
                     AND constraint_name='email_whitelist_lower_email_unique') THEN
        ALTER TABLE public.email_whitelist 
        ADD CONSTRAINT email_whitelist_lower_email_unique UNIQUE (lower(email));
      END IF;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore constraint errors - table structure is managed by migrations
  RAISE NOTICE 'Could not modify email_whitelist constraints: %', SQLERRM;
END $$;

-- Parse comma‑separated :'WHITELISTED_EMAILS' via string_to_array, trim, and lower
-- Upsert into public.email_whitelist(email, role) using lower(...) for case-insensitive handling
WITH email_list AS (
  SELECT 
    trim(lower(value)) AS email
  FROM string_to_array(:'WHITELISTED_EMAILS', ',') AS value
  WHERE trim(value) <> ''
)
INSERT INTO public.email_whitelist(email, role)
SELECT 
  email, 
  'member' -- Default role for all emails from the list
FROM email_list
ON CONFLICT (email) 
DO UPDATE SET 
  role = COALESCE(public.email_whitelist.role, EXCLUDED.role);