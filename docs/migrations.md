# Database Migrations

## Migration Workflow

If 'Detect DB changes' fails, add the PR label **db-migrations-ok** after review.

Use **Actions → Deploy Database Migrations** to apply changes to production DB.

## Overview

This project uses Supabase for database management with a migration-based workflow for schema changes:

- **Location**: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- **Deployment**: Manual-only via GitHub Actions for safety
- **Rule**: Never apply manual database changes—commit and push only

## Workflows

### DB Change Detection (`db-detect.yml`)
- Triggers on PRs that modify `supabase/migrations/**`
- Comments on PR with detected migration files
- Requires `db-migrations-ok` label to proceed
- Ensures proper review process for database changes

### Drift Detection (`db-drift.yml`)
- Read-only check for schema drift between repo and remote DB
- Runs on PR changes to migrations or manually via workflow_dispatch
- Fork-safe: skips when DATABASE_URL secret unavailable
- Uses official Supabase CLI setup action

### Migration Deployment (`db-deploy.yml`)
- Manual deployment workflow (workflow_dispatch only)
- Restricted to main branch for safety
- Applies migrations from `supabase/migrations/` directory
- Protected by DATABASE_URL secret requirement

## Safety Features

- **Review Gate**: All migration changes require manual approval via label
- **Fork Safety**: Workflows skip when secrets unavailable (for forks)
- **Main Branch Only**: Deployments restricted to main branch
- **Read-only Drift**: Drift detection never modifies remote database