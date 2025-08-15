# Supabase Migrations

This directory contains database migration files that are automatically applied when changes are pushed to the `main` branch.

The frontend expects public.me (a current-user view) and RLS policies on profiles.
Run migrations before loading the app.

## Migration Workflow

### 🔄 Automatic Deployment
- **Trigger**: Push to `main` branch with changes in `supabase/migrations/`
- **Workflow**: `.github/workflows/deploy-migrations.yml`
- **Authentication**: Uses `DATABASE_URL` repository secret
- **Method**: Applies migrations in alphabetical order using `psql`

### 📁 File Structure
```
supabase/
├── migrations/
│   ├── YYYYMMDDHHMMSS_description.sql
│   ├── YYYYMMDDHHMMSS_another_change.sql
│   └── ...
└── README.md (this file)
```

## Adding New Schema Changes

### 🎯 The "Commit-and-Push-Only" Rule
**NEVER run manual database changes.** All schema updates must go through the migration pipeline.

### 📝 Creating a Migration

1. **Create a timestamped migration file:**
   ```bash
   # Use 14-digit UTC timestamp for consistent ordering
   touch supabase/migrations/$(date -u +"%Y%m%d%H%M%S")_your_description.sql
   ```

2. **Write your SQL changes:**
   ```sql
   -- Example: supabase/migrations/20250814153001_add_users_profile_index.sql
   CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
   ```

3. **Use safe SQL practices:**
   - Prefer `IF EXISTS` / `IF NOT EXISTS` where appropriate
   - Keep migrations backwards-compatible when possible
   - One logical change per migration file

4. **Commit and push:**
   ```bash
   git add supabase/migrations/
   git commit -m "Add profile index for better query performance"
   git push origin main  # This triggers the deployment pipeline
   ```

### 📋 Examples

**Adding a table:**
```sql
-- supabase/migrations/20250814153001_add_notifications_table.sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
```

**Adding a column:**
```sql
-- supabase/migrations/20250814153512_add_posts_published_at.sql
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
```

**Removing a column (be careful!):**
```sql
-- supabase/migrations/20250814154001_remove_posts_legacy_field.sql
-- WARNING: This is destructive - ensure no code depends on this column
ALTER TABLE posts DROP COLUMN IF EXISTS legacy_field;
```

## Migration Ordering

- **Timestamps**: Use 14-digit UTC format (`YYYYMMDDHHMMSS`)
- **Chronological order**: Files are applied in alphabetical order
- **Dependencies**: Ensure dependent migrations have later timestamps

## Validation

After each deployment, the pipeline automatically runs:
- `scripts/verify-schema.sql` - Validates table structure
- `scripts/verify-rls.sql` - Validates Row Level Security policies
- `scripts/verify-extensions.sql` - Validates required extensions

## Extensions

We use citext for case‑insensitive emails and pgcrypto for UUIDs. Enabling is handled by *_enable_extensions.sql and verified in CI.

Required extensions:
- **citext** - Case-insensitive text matching (used for email fields)
- **pgcrypto** - Cryptographic functions (provides `gen_random_uuid()`)

Extension management is automatic:
- Migration `*_enable_extensions.sql` ensures extensions are available first
- All migrations that use these features include safety nets
- CI verifies extensions are properly enabled after deployment

## Guardrails & Best Practices

### ✅ Do
- **Small, focused changes** - One logical change per migration
- **Backwards compatibility** - Avoid breaking existing reads/writes during deploy
- **Code review** - Require review for migrations touching critical tables
- **Test locally first** - Verify your SQL syntax before committing

### ❌ Don't
- **Skip the pipeline** - Never apply changes directly to the database
- **Bundle unrelated changes** - Keep migrations focused
- **Drop critical data** - Be extra careful with destructive operations
- **Rename + migrate data** - Split into separate releases for safety

### 🚨 Critical Tables
Require extra review for changes to:
- `profiles` (user data)
- `families` (core organization)
- `auth.*` (Supabase auth tables)

### 📋 Review Process
Use the **migration review checklist**: `docs/MIGRATION_REVIEW.md`

## Troubleshooting

### Pipeline Failures
1. **Check the GitHub Actions logs** for specific error messages
2. **SQL syntax errors** - Validate your SQL locally first
3. **Missing dependencies** - Ensure prerequisite tables/columns exist
4. **RLS policy conflicts** - Check if your changes affect existing policies

### Rolling Back
If a migration causes issues:
1. **Create a new migration** to fix the problem (don't edit the original)
2. **Follow the same workflow** - commit and push the fix
3. **Emergency only**: Use the manual DB reset workflow as last resort

## Secrets Configuration

The pipeline requires these repository secrets:
- `DATABASE_URL` - Full Postgres connection string from Supabase

## Alternative: Supabase CLI Method

If you prefer using the Supabase CLI for generating migrations:

```bash
# Generate a migration from schema diff (doesn't apply locally)
supabase db diff -f your_description

# This creates: supabase/migrations/YYYYMMDDHHMMSS_your_description.sql
# Commit and push to trigger deployment
```

**Note**: Do NOT run `supabase db push` locally - let the CI pipeline handle deployment.