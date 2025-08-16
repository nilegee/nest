# Supabase Database Auto-Update System

## Quick Answer

**Your Supabase database does NOT auto-update during a PR commit. It only updates AFTER the PR is merged to `main` AND only when migration files are changed.**

## How It Works

### 1. **During PR Development** 
- ❌ Database does NOT update automatically
- ✅ Change detection script validates if migrations are needed
- ✅ Optional drift detection can check for schema mismatches

### 2. **After PR Merge to Main**
- ✅ Database auto-updates ONLY if `supabase/migrations/` files were changed
- ✅ GitHub Actions workflow triggers automatically
- ✅ Uses `supabase db push` to apply changes

## Detailed Workflow

### Trigger Conditions
Your database will auto-update when:
```yaml
on:
  push:
    branches: [ main ]           # Only after merge to main
    paths:
      - "supabase/migrations/**" # Only when migration files change
```

### What Happens
1. **Automatic Trigger**: When migration files are pushed to `main`
2. **Environment Setup**: Installs PostgreSQL client and Supabase CLI
3. **Database Cleanup**: Clears prepared statements
4. **Migration Deployment**: Runs `supabase db push --db-url "$DATABASE_URL"`

### Safety Features

#### Change Detection (`scripts/db-change-detect.mjs`)
- Prevents database-affecting code changes without migrations
- Checks if files in `src/`, `web/`, `db/`, or `supabase/schema_inferred.sql` changed
- Requires corresponding migration file in `supabase/migrations/`

#### Single Migration Policy (from AGENTS.md)
- **ONE MIGRATION FILE**: Exactly one migration file at any time
- **ALL CHANGES IN ONE FILE**: All schema changes appended to single file
- **DELETE OLD MIGRATIONS**: Previous migration files deleted before new changes
- **COMMIT-AND-PUSH ONLY**: Triggers single automated workflow

## File Structure
```
/home/runner/work/nest/nest/
├── .github/workflows/
│   └── deploy-migrations.yml     # Auto-deployment workflow
├── scripts/
│   └── db-change-detect.mjs      # Change detection guard
├── supabase/migrations/
│   └── 20250816_init_schema.sql  # Current single migration file
└── docs/
    └── DATABASE_AUTO_UPDATE_GUIDE.md  # This guide
```

## Current Setup Status

### Migration File
- **Location**: `supabase/migrations/20250816_init_schema.sql`
- **Content**: Complete schema with families, profiles, events, posts, islamic_guidance tables
- **RLS**: All tables have Row Level Security policies
- **Status**: Single file policy enforced

### Workflow Configuration
- **File**: `.github/workflows/deploy-migrations.yml`
- **Trigger**: Push to main with migration changes OR manual dispatch
- **Database**: Uses `DATABASE_URL` secret
- **Method**: `supabase db push` command

## Manual Override

You can also trigger deployment manually:
```yaml
workflow_dispatch:  # Allows manual triggering from GitHub Actions UI
```

## Summary

- **During PR**: No database changes
- **After merge to main**: Auto-updates if migrations changed
- **Safety**: Change detection prevents missing migrations
- **Policy**: Single migration file, automated workflow
- **Manual**: Can be triggered manually if needed

Your database is safe and will only update when you explicitly add migration files and merge them to the main branch.