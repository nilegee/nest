# OAuth Authentication Debugging Guide

## Testing the OAuth Fix

### Local Development Testing

1. **Start the local server:**
   ```bash
   npx serve . -p 3000
   ```

2. **Open browser console** and navigate to `http://localhost:3000`

3. **Check console logs** - you should see:
   ```
   Initializing auth... {url: "http://localhost:3000/", hash: "", search: ""}
   OAuth redirect URL: http://localhost:3000
   Initial session: No session
   No authenticated user, showing landing page
   ```

4. **Test OAuth redirect URL generation:**
   ```javascript
   // In browser console:
   function getRedirectUrl() {
     if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
       return window.location.origin;
     }
     return window.location.origin + window.location.pathname;
   }
   console.log('Redirect URL:', getRedirectUrl());
   // Should output: "Redirect URL: http://localhost:3000"
   ```

### GitHub Pages Testing

1. **Access the deployed app:** https://nilegee.github.io/nest/

2. **Check browser console** for logs similar to:
   ```
   Initializing auth... {url: "https://nilegee.github.io/nest/", hash: "", search: ""}
   OAuth redirect URL: https://nilegee.github.io/nest/
   Initial session: No session
   ```

3. **Test OAuth flow:**
   - Click "Continue with Google"
   - Should redirect to Google OAuth consent screen
   - After authorization, should redirect back to `https://nilegee.github.io/nest/`
   - Check console for OAuth callback handling

### OAuth Callback URL Simulation

To test OAuth callback handling without going through the full OAuth flow:

1. **Simulate successful OAuth callback:**
   Navigate to: `https://nilegee.github.io/nest/#access_token=dummy&token_type=bearer`

2. **Expected console output:**
   ```
   Initializing auth... {url: "...", hash: "#access_token=dummy&token_type=bearer", search: ""}
   ```

3. **Simulate OAuth error:**
   Navigate to: `https://nilegee.github.io/nest/?error=access_denied&error_description=User%20cancelled`

4. **Expected behavior:**
   - Should show error message: "Authentication failed: User cancelled"
   - Should not attempt to initialize session

### Common Issues and Solutions

#### Issue: "Blank page after OAuth redirect"
**Cause:** Session persistence was disabled, preventing OAuth token processing
**Solution:** ✅ Fixed with sessionStorage configuration

#### Issue: "OAuth redirects to wrong URL"
**Cause:** Hardcoded redirect URLs
**Solution:** ✅ Fixed with environment-aware `getRedirectUrl()` function

#### Issue: "Session not persisting"
**Expected behavior:** Sessions should only persist within browser tab, not across browser restarts
**Verification:** Close and reopen browser - should require re-authentication

### Session Storage Verification

Check that sessions are stored correctly:

```javascript
// In browser console after successful login:
console.log('Session storage keys:', Object.keys(sessionStorage));
console.log('Local storage keys:', Object.keys(localStorage));

// Should show session data in sessionStorage, not localStorage
```

### Supabase Dashboard Configuration

Ensure Supabase OAuth settings include the correct redirect URLs:

**Authentication → Settings → Site URL:**
- Development: `http://localhost:3000`
- Production: `https://nilegee.github.io/nest/`

**OAuth Redirect URLs should include:**
- `http://localhost:3000` (for development)
- `https://nilegee.github.io/nest/` (for production)

## Troubleshooting Steps

### Common Issues & Solutions

**Problem: Loading spinner shows indefinitely**
- Check browser console for JavaScript errors
- Verify CDN resources are loading (Lit, Supabase JS, Iconify)
- Test network connectivity and check for firewall blocks

**Problem: Authentication succeeds but no data loads**
- Verify user email is in the whitelist table
- Check that user has proper family_id assignment
- Confirm RLS policies allow user to read their family's data
- Look for database connection errors in console

**Problem: Events/Acts CRUD operations fail**
- Verify user has proper session and family_id
- Check RLS policies for insert/update/delete permissions
- Confirm all required fields are provided in forms
- Look for validation errors in console logs

**Problem: Toast notifications don't appear**
- Check if JavaScript errors are preventing toast helper loading
- Verify DOM is ready before showing toasts
- Check CSS z-index conflicts with other elements

**Problem: Keyboard navigation not working**
- Verify Tab key moves between interactive elements
- Check that focus indicators are visible
- Confirm Enter/Space keys activate links and buttons
- Test skip-to-content link functionality

### Database Debugging

1. **Check user profile setup:**
   ```sql
   SELECT * FROM profiles WHERE id = 'user-uuid-here';
   ```

2. **Verify family assignment:**
   ```sql
   SELECT p.*, f.name as family_name 
   FROM profiles p 
   JOIN families f ON p.family_id = f.id 
   WHERE p.id = 'user-uuid-here';
   ```

3. **Test RLS policies:**
   ```sql
   -- This should only return user's family data
   SELECT * FROM events ORDER BY starts_at;
   ```

### Browser Debugging

1. **Check browser console** for JavaScript errors
2. **Verify network requests** - CDN resources should load successfully
3. **Check session storage** - should contain Supabase auth data after login
4. **Test with different browsers** to rule out browser-specific issues
5. **Verify Supabase project configuration** in dashboard