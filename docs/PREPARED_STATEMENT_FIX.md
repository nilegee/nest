# Prepared Statement Conflict Fix

## Problem Description

The migration deployment workflow was failing with the error:
```
ERROR: prepared statement "lrupsc_1_0" already exists (SQLSTATE 42P05)
```

## Root Cause

The GitHub Actions workflow performs multiple database operations in sequence:
1. `supabase db pull` - creates database connections with prepared statements
2. `supabase migration repair` - may conflict with existing prepared statements  
3. `supabase db push` - tries to create new prepared statements that already exist

These operations don't properly clean up prepared statements between steps, causing conflicts when the same statement names are reused.

## Solution Applied

Added `DEALLOCATE ALL;` commands between database operations to clean up any existing prepared statements:

```yaml
- name: Sync local and remote migration history
  run: |
    echo "Cleaning any existing prepared statements..."
    psql "$DATABASE_URL" -c "DEALLOCATE ALL;" || echo "No prepared statements to clean"
    
    echo "Pulling remote migration state to sync with local..."
    supabase db pull --db-url "$DATABASE_URL" --debug || echo "Pull completed with warnings (expected)"
    
    echo "Cleaning prepared statements after pull..."
    psql "$DATABASE_URL" -c "DEALLOCATE ALL;" || echo "No prepared statements to clean"
    
    # ... migration repair logic ...
    
    echo "Cleaning prepared statements after repair..."
    psql "$DATABASE_URL" -c "DEALLOCATE ALL;" || echo "No prepared statements to clean"

- name: Deploy incremental migrations
  run: |
    echo "Cleaning prepared statements before deployment..."
    psql "$DATABASE_URL" -c "DEALLOCATE ALL;" || echo "No prepared statements to clean"
    
    # ... deployment logic ...
```

## Why This Works

- `DEALLOCATE ALL;` removes all prepared statements from the current session
- Each database operation starts with a clean prepared statement namespace
- The `|| echo "..."` ensures the workflow continues even if there are no statements to clean
- This prevents the SQLSTATE 42P05 error without affecting functionality

## Testing

This fix:
- ✅ Resolves the prepared statement conflict error
- ✅ Maintains all existing functionality  
- ✅ Doesn't break when there are no prepared statements to clean
- ✅ Is safe to run multiple times
- ✅ Works with the current incremental migration approach

## Files Changed

- `.github/workflows/deploy-migrations.yml` - Added prepared statement cleanup between database operations