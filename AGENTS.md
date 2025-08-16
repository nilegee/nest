🤖 AGENTS.md — FamilyNest Development Constitution

## Mission

FamilyNest is a zero-build, psychology-guided family hub where every feature must respect privacy, security, and delight in under 15 seconds.

## 🚫 Hard Fails (Automatic Rejection)

- **Changing Supabase URL/Anon, OAuth redirects, or env plumbing**
- **Using localStorage/cookies for auth** (sessions must remain memory-only)  
- **Weakening or bypassing RLS** (families must never see other families' data)
- **Shipping with console errors or Lighthouse < 90** (Perf / Accessibility / Best Practices)
- **Files > 300 lines** (target <200 lines, hard cap 300)

## Tech Stack (Frozen)

- **Lit 3** (CDN) - Web component framework
- **Iconify** (web component) - Icons only
- **Supabase JS v2** (CDN) - Database & auth
- **Hosted on GitHub Pages** (static only)

**No new frameworks, bundlers, or build tools allowed.**

## Security Principles

- **Anon key is public → RLS is the lock**
- **Memory-only sessions** (sessionStorage for OAuth callbacks only)
- **No secrets/service keys in client code**
- **Email whitelist enforcement** at both client and database level
- **RLS first-class** → always applied right after table creation

## App Architecture (Current State)

```
/index.html                  # Root with CDN dependencies + global styles
/src/fn-app.js              # Session guard + auth routing (196 lines)
/src/fn-landing.js          # Login view (Google OAuth + magic link)  
/src/fn-home.js             # Family Wall dashboard (300 lines)
/web/supabaseClient.js      # createClient with persistSession:false
/web/env.js                 # Generated config + whitelisted emails
/supabase/migrations/       # Single clean migration for Family Wall
  20250116000000_family_wall_init.sql  # Complete schema (157 lines)
```

## Core Features (Minimal Set)

1. **Authentication** - Google OAuth + email whitelist validation
2. **Family Wall** - Post creation, viewing, real-time updates
3. **Profile Management** - Auto-created profiles linked to families

**That's it.** No events, no cards, no extra features.

## Psychology Contracts

- **One Gentle Action** per view (no clutter, no paralysis)
- **Celebrate > Correct** - reward effort, never shame mistakes
- **Micro-moments (<15s)** - interactions resolve fast and end positive
- **Accessibility = dignity** - ARIA landmarks, labels, focus order, 44px targets

## Database Schema (Single Migration)

**Tables (3):**
- `families` - Family organization (default family for whitelisted users)
- `profiles` - User profiles (auto-created, linked to auth.users)
- `posts` - Family Wall posts with author relationship

**Security:**
- **RLS enabled** on all tables
- **Email whitelist function** - `is_whitelisted_email()`
- **Family-scoped policies** - users only see their family's data
- **Default family ID** - `00000000-0000-0000-0000-000000000001`

## Whitelisted Emails (Single Source)

```javascript
// web/env.js - Single source of truth
export const WHITELISTED_EMAILS = [
  'yazidgeemail@gmail.com',
  'yahyageemail@gmail.com', 
  'abdessamia.mariem@gmail.com',
  'nilezat@gmail.com'
];
```

## Code Quality Standards

- **Target <200 lines per file** (hard cap 300)
- **Modular, tree-shakable** components
- **No unused imports or dead code**
- **Consistent error handling**
- **Shadow DOM scoped styles or BEM**
- **Honor reduced motion preferences**

## Extension Pattern (Future)

When adding features:

1. **Create single-purpose component** (<200 lines)
2. **Add minimal table/columns** to existing migration OR create new timestamped migration
3. **Apply RLS policies** immediately after table creation
4. **Test with whitelist enforcement**
5. **Verify Lighthouse score ≥ 90**

## ✅ Do / ❌ Don't Quick List

**✅ Do:**
- Use Iconify icons, Lit templates, pure helpers
- Check session + whitelist before private UI
- Keep migrations incremental & RLS-first
- Use semantic HTML and ARIA labels
- Test on mobile and desktop
- Handle loading and error states gracefully

**❌ Don't:**
- Add new bundlers/frameworks
- Reference service keys or secrets in client code
- Persist auth in localStorage
- Create files > 300 lines
- Bypass RLS for "convenience"
- Ship with console errors

## Quick Reference Table

| Area | Rule of Thumb |
|------|---------------|
| **Auth** | Memory-only, whitelist enforced |
| **Data** | RLS always, no cross-family leaks |
| **UX** | One gentle action, celebrate not shame |
| **Performance** | Lighthouse ≥ 90, load < 3s |
| **Files** | Target <200 lines, hard cap 300 |
| **Migrations** | Incremental, timestamped, RLS after tables |
| **Styling** | Scoped (Shadow DOM/BEM), honor reduced motion |

## Migration Workflow

```bash
# For schema changes:
supabase db pull          # Get current state
# Edit migration file
supabase db push          # Deploy changes
```

**Never manual Supabase UI edits.** Always use migrations.

---

⚡ **This file is your constitution: follow it, and FamilyNest stays fast, private, and kind.**