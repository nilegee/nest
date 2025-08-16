# Alternative Migration Strategy: Incremental Approach

## Overview

This document provides a detailed guide for switching from the current single-file migration approach to the standard Supabase incremental migration strategy.

## Current State Analysis

**Current Approach**: Single migration file (`20250816000000_init_schema.sql`) with 397 lines
**Deployment Method**: `supabase db push --force` (bypasses migration tracking)
**Policy**: MigrationAgent SINGLE MIGRATION FILE POLICY

## Incremental Migration Strategy

### Step 1: Break Down the Single Migration

Split `20250816000000_init_schema.sql` into logical incremental migrations:

```bash
supabase/migrations/
├── 20250816000000_extensions_and_types.sql        # 15 lines
├── 20250816000100_core_tables.sql                 # 45 lines
├── 20250816000200_events_system.sql               # 38 lines
├── 20250816000300_posts_and_feed.sql              # 32 lines
├── 20250816000400_islamic_guidance.sql            # 28 lines
├── 20250816000500_supporting_tables.sql           # 42 lines
├── 20250816000600_rls_policies.sql                # 78 lines
├── 20250816000700_indexes_and_functions.sql       # 25 lines
└── rollback/                                       # Rollback scripts
    ├── 20250816000700_rollback.sql
    ├── 20250816000600_rollback.sql
    └── ...
```

### Step 2: Migration File Content Structure

Each migration file should follow this template:

```sql
-- ============================================
-- Migration: [DESCRIPTION]
-- Version: [TIMESTAMP]
-- Dependencies: [PREVIOUS_MIGRATIONS]
-- Rollback: rollback/[TIMESTAMP]_rollback.sql
-- ============================================

-- Migration content here...

-- ============================================
-- END OF MIGRATION: [DESCRIPTION]
-- ============================================
```

### Step 3: Update Deployment Workflow

Replace the current force deployment with proper migration tracking:

```yaml
name: Deploy Supabase Migrations
on:
  push:
    branches: [ main ]
    paths:
      - "supabase/migrations/**"
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      
      - name: Validate migration files
        run: |
          echo "Validating migration file naming and order..."
          ls -la supabase/migrations/
          
      - name: Deploy migrations incrementally
        run: |
          # Use standard migration deployment
          supabase db push --db-url "$DATABASE_URL" --debug
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          
      - name: Verify deployment
        run: |
          # Check migration status
          supabase migration list --db-url "$DATABASE_URL"
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Step 4: Update MigrationAgent Policy

Modify `AGENTS.md` to support incremental migrations:

```markdown
## MigrationAgent – Database Schema Standards

MigrationAgent ensures all future Supabase migrations follow these rules:  
- **INCREMENTAL MIGRATION POLICY**: Each schema change gets its own timestamped migration file
- **ORDERED MIGRATIONS**: Migration files must follow YYYYMMDDHHMMSS_description.sql naming
- **ROLLBACK SUPPORT**: Each migration must have a corresponding rollback script
- **DEPENDENCY TRACKING**: Migrations must declare their dependencies
- **ATOMIC CHANGES**: Each migration should contain related changes only
- **SELF-CONTAINED**: Each migration should be idempotent and safe to re-run
```

### Step 5: Implementation Script

Create a script to automatically split the current migration:

```bash
#!/bin/bash
# scripts/split-migration.sh

echo "Splitting single migration into incremental files..."

# Create migration directories
mkdir -p supabase/migrations/split
mkdir -p supabase/migrations/rollback

# Extract sections from current migration
SOURCE_FILE="supabase/migrations/20250816000000_init_schema.sql"

# Section 1: Extensions and Types
sed -n '/SECTION 1: Extensions/,/SECTION 2: Core Tables/p' "$SOURCE_FILE" | head -n -3 > \
  "supabase/migrations/split/20250816000000_extensions_and_types.sql"

# Section 2: Core Tables
sed -n '/SECTION 2: Core Tables/,/SECTION 3:/p' "$SOURCE_FILE" | head -n -3 > \
  "supabase/migrations/split/20250816000100_core_tables.sql"

# Continue for other sections...

echo "Migration split complete. Review files in supabase/migrations/split/"
echo "Manual verification required before replacing current migration."
```

## Migration Strategy Comparison

| Aspect | Single File (Current) | Incremental (Standard) |
|--------|----------------------|------------------------|
| **Complexity** | Low | Medium |
| **Rollback Granularity** | All-or-nothing | Per-migration |
| **Change Tracking** | Difficult | Clear history |
| **Team Collaboration** | Potential conflicts | Better isolation |
| **Deployment Safety** | Force override | Proper validation |
| **Supabase Alignment** | Non-standard | Best practice |
| **Maintenance** | Simple | More structured |

## Recommendation

**For immediate fixes**: Keep the current single-file approach with force deployment (already implemented)

**For future projects**: Consider incremental migrations for better alignment with Supabase best practices

**For this project**: The current fix resolves deployment issues while maintaining the established architecture. Switching to incremental migrations would be a larger architectural change that should be evaluated based on team needs and project complexity.

## Rollback Plan

If incremental migration is implemented but causes issues:

1. Consolidate all incremental migrations back into a single file
2. Update workflow to use force deployment
3. Revert MigrationAgent policy changes
4. Clear migration history and re-apply with force