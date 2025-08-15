-- Whitelist All Tables Migration
-- Enables RLS and creates whitelist policies for specific emails on all BASE TABLEs

DO $$
DECLARE
    tbl TEXT;
    policy_exists BOOLEAN;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

        SELECT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = tbl
              AND policydef ILIKE '%yazidgeemail@gmail.com%'
        ) INTO policy_exists;

        IF NOT policy_exists THEN
            EXECUTE format('DROP POLICY IF EXISTS "%I full_access_whitelist" ON public.%I;', tbl, tbl);
            EXECUTE format($f$
                CREATE POLICY "%I full_access_whitelist" ON public.%I
                FOR ALL
                USING (
                    auth.jwt() ->> 'email' IN (
                        'yazidgeemail@gmail.com',
                        'yahyageemail@gmail.com',
                        'abdessamia.mariem@gmail.com',
                        'nilezat@gmail.com'
                    )
                )
                WITH CHECK (
                    auth.jwt() ->> 'email' IN (
                        'yazidgeemail@gmail.com',
                        'yahyageemail@gmail.com',
                        'abdessamia.mariem@gmail.com',
                        'nilezat@gmail.com'
                    )
                );
            $f$, tbl, tbl);
        END IF;
    END LOOP;
END $$;