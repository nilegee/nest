# QA Checklist - RLS Policy Fix

## Pre-deployment Verification

### ✅ Code Review
- [ ] Migration file follows naming convention: `YYYYMMDDHHMMSS_fix_rls_column_references.sql`
- [ ] SQL syntax is valid (no semicolon missing, proper IF/END blocks)
- [ ] All table policies updated: profiles, events, posts, islamic_guidance, families
- [ ] Foreign key constraints reference correct columns
- [ ] DROP policies use `IF EXISTS` to avoid errors on re-run

### ✅ Testing in Development
- [ ] Migration runs without errors
- [ ] All RLS policies created successfully 
- [ ] Foreign key constraints applied correctly
- [ ] No existing data is affected

## Post-deployment Smoke Tests

### Authentication & Profile Access
- [ ] User can login with whitelisted email (nilezat@gmail.com)
- [ ] Profile data loads without 403 errors
- [ ] Family lookup works correctly
- [ ] No console errors during login process

### Core Functionality 
- [ ] **Dashboard**: Home view loads all family data
- [ ] **Events**: Can view, create, edit, delete events
- [ ] **Feed**: Can view posts and create new posts  
- [ ] **Islamic Guidance**: Daily guidance displays correctly
- [ ] **Profile**: User profile displays and can be updated

### Error Scenarios (Should NOT happen)
- [ ] ❌ No 403 errors for `profiles?user_id=eq.xxx`
- [ ] ❌ No 403 errors for `events?select=*`
- [ ] ❌ No 403 errors for `posts?select=*`
- [ ] ❌ No 403 errors for `islamic_guidance?select=*`
- [ ] ❌ No "No family found" errors during post/event creation
- [ ] ❌ No RLS policy violation errors in Supabase logs

### Performance & UX
- [ ] Page load times remain acceptable (< 3 seconds)
- [ ] No new JavaScript errors in browser console
- [ ] All interactive elements work (buttons, forms, navigation)
- [ ] Mobile responsiveness maintained

## Browser Testing Matrix

| Browser | Login | Dashboard | Feed | Events | Status |
|---------|-------|-----------|------|--------|--------|
| Chrome | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Firefox | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Safari | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Edge | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## Database Verification

### RLS Policy Check
```sql
-- Verify policies exist and reference correct columns
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname NOT LIKE '%whitelist%'
ORDER BY tablename, cmd;
```

### Foreign Key Check  
```sql
-- Verify foreign keys reference correct columns
SELECT 
  tc.constraint_name,
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public';
```

### Test Query Examples
```sql
-- These should work for authenticated family members:
SELECT family_id FROM profiles WHERE user_id = auth.uid();
SELECT * FROM events WHERE family_id = (SELECT family_id FROM profiles WHERE user_id = auth.uid());
SELECT * FROM posts WHERE family_id = (SELECT family_id FROM profiles WHERE user_id = auth.uid());
SELECT * FROM islamic_guidance WHERE family_id = (SELECT family_id FROM profiles WHERE user_id = auth.uid());
```

## Rollback Plan

If issues are discovered:

1. **Immediate**: Revert to previous migration state
2. **Emergency**: Apply whitelist policy temporarily:
   ```sql
   CREATE POLICY "emergency_access" ON public.profiles
   FOR ALL USING (auth.jwt() ->> 'email' IN ('nilezat@gmail.com', ...));
   ```
3. **Investigation**: Analyze logs and identify remaining issues
4. **Fix**: Create corrective migration with proper testing

## Sign-off

- [ ] **Developer**: Code reviewed and tested locally
- [ ] **QA**: All smoke tests pass  
- [ ] **Product**: Core user workflows verified
- [ ] **DevOps**: Migration deployed successfully

**Deployment Date**: ___________  
**Tested By**: ___________  
**Approved By**: ___________