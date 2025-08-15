# Console Error Fixes - Migration Guide

## Problem Summary

The console was showing multiple errors due to missing database schema elements and RLS policies:

1. **403 Forbidden on `me` view** - Users couldn't access their own profile via the `me` view
2. **400 Bad Request on profiles table** - Missing `dob` column caused queries to fail
3. **403 Forbidden on nudges table** - FamilyBot couldn't create nudges due to missing INSERT policy
4. **Missing family member access** - Users could only see their own profile, not family members

## Root Cause Analysis

The issues were caused by inconsistencies between different schema files:

- `supabase/migrations/20250814181857_me_view_and_profiles_policies.sql` was missing the `dob` column
- RLS policies were too restrictive, only allowing self-access instead of family-scoped access
- FamilyBot operations were failing due to missing INSERT policies

## Solution

Created migration `20250815000000_fix_console_errors.sql` that adds:

1. **Missing `dob` column** to profiles table (idempotent)
2. **Family-scoped RLS policy** for profiles table to allow family members to see each other
3. **INSERT policy for nudges** table to allow FamilyBot to create nudges
4. **INSERT policy for preferences** table for completeness

## Files Changed

### Migration
- `supabase/migrations/20250815000000_fix_console_errors.sql` - Main fix migration

### Tests
- `test/console-error-fixes.js` - Test that reproduces the original errors
- `test/console-fixes-verification.js` - Test that verifies fixes work
- `scripts/test-runner.mjs` - Updated to include console error tests

### Documentation
- `docs/QA.md` - Updated to document the fixes

## How to Apply

### For Supabase Projects

1. Apply the migration file to your Supabase project:
   ```sql
   -- Apply the migration via Supabase CLI or SQL editor
   \i supabase/migrations/20250815000000_fix_console_errors.sql
   ```

2. Verify the fixes by checking:
   - `SELECT * FROM public.me;` should work without errors
   - `SELECT user_id, full_name, dob, family_id FROM profiles WHERE user_id = auth.uid();` should work
   - Family members should be able to see each other's profiles
   - FamilyBot should be able to create nudges

## Testing

Run the console error tests to verify everything works:

```bash
npm test
```

The test suite now includes:
- Reproduction of original console errors
- Verification that fixes resolve the issues
- All existing functionality tests continue to pass

## Expected Behavior After Fix

- **No more 403 errors** when accessing user profiles
- **No more 400 errors** when querying profiles with dob column
- **FamilyBot can create nudges** without permission errors
- **Family members can see each other's profiles** while maintaining security
- **Zero console errors** in browser developer tools

## Security Notes

The changes maintain proper security:
- Users can only see profiles within their own family (family_id scoped)
- Users can only update their own profiles
- INSERT policies ensure data integrity and proper ownership
- All policies are family-scoped to maintain multi-tenant isolation