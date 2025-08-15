# Database Workflow

## Overview

This repository uses a three-stage database workflow for safe and reliable schema management:

## Workflows

### 1. **Detect** (`db-detect.yml`)
- **Trigger**: Automatically runs on PR with migration changes
- **Purpose**: Detects changed migration files and enforces review process
- **Requirements**: Must add `db-migrations-ok` label after review to allow merge
- **Output**: Comments on PR with list of changed migration files

### 2. **Drift** (`db-drift.yml`) 
- **Trigger**: Runs on PR with migrations OR manual dispatch
- **Purpose**: Read-only check for schema drift between repo migrations and Supabase remote schema
- **Fork-safe**: Skips if `DATABASE_URL` secret is missing
- **Output**: Detects if remote database schema differs from committed migrations

### 3. **Deploy** (`db-deploy.yml`)
- **Trigger**: Manual-only via workflow dispatch
- **Purpose**: Apply migrations to Supabase database
- **Restrictions**: 
  - Only runs from `main` branch
  - Requires `DATABASE_URL` secret
- **Method**: Uses `supabase db reset` with migration directory

## Usage

### For Contributors
1. Create migration file in `supabase/migrations/`
2. Open PR - `db-detect` workflow runs automatically
3. Review migration changes
4. Add `db-migrations-ok` label to approve
5. Merge PR

### For Maintainers
1. After PR merge, manually run `db-deploy` workflow
2. Select `main` branch as deploy target
3. Workflow applies all migrations to production database

## Safety Features
- **Label enforcement**: PRs with migrations require review approval
- **Branch restriction**: Deployments only from `main`
- **Fork-safe**: Works in forks without database secrets
- **Read-only checks**: Drift detection doesn't modify database
- **Clear error messages**: Actionable feedback on failures