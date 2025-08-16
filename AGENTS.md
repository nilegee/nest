# 🤖 AGENTS.md — How to safely extend **nest**

## Mission
Build a private, psychology‑informed family hub that is fast, secure, and kind. The app is **zero‑build** (CDN only) and must never break auth or privacy.

## Non‑negotiables
- **Do not** change Supabase URL/Anon, OAuth redirects, or env plumbing.
- **No localStorage** for auth; sessions are memory‑only.
- **Preserve RLS assumptions**: users see only their family's data, with visibility rules.
- **Zero console errors** and **Lighthouse ≥ 90** (Perf/A11y/Best Practices).

## Tech stack (frozen)
- **Lit 3** (CDN), **Iconify** (web component), **Supabase JS v2**.
- Hosted on **GitHub Pages** (static).

## App structure

```
/index.html                  # root; loads Iconify, Lit, <fn-app>
/src/fn-app.js               # session guard + layout shell
/src/fn-landing.js           # login view (Google + magic link)
/src/fn-home.js              # Nest (dashboard) view
/cards/                      # self-contained card modules
  nest-cards.js              # renderNestCards() + registerNestCard()
  birthdays.js               # getUpcomingBirthdays()
  events.js                  # getUpcomingEvents()
/web/supabaseClient.js       # createClient with persistSession:false
/web/env.js                  # generated from .env.local
/db/schema.sql               # tables + RLS
/docs/QA.md                  # smoke tests
```

## UX rules of thumb
- **One clear action** at top ("One Gentle Action").
- **Soft competition** (streaks/badges), not raw points by default.
- **Micro‑interactions** (< 15s). Celebrate, don't shame.
- Accessibility first (ARIA landmarks, labels, focus order, 44px targets).

## Extension pattern
- Add a new widget as a module in `/cards/` and **register** it:
  ```js
  import { registerNestCard } from './nest-cards.js';
  registerNestCard('my-card-id', () => /* return DOM fragment */);
  ```

The same fragment is used both in desktop sidebar and mobile inline.

## Phase 1 Agents (Current Implementation)

### EventAgent ✅ **Active**
- **Location**: `src/views/events-view.js` (287 lines)
- **Responsibility**: Manage family events (birthdays, anniversaries, custom)
- **Database**: `events` table with RLS policies
- **Features**: CRUD operations, date formatting, event type icons
- **Test Coverage**: 14/14 tests passing (events-crud-test.js)

### FeedAgent ✅ **Active**
- **Location**: `src/views/feed-view.js` (275 lines)  
- **Responsibility**: Family post sharing and communication
- **Database**: `posts` table with author relationships
- **Features**: Post composer, media URLs, reverse chronological display
- **Test Coverage**: 14/14 tests passing (feed-posting-test.js)

### ProfileAgent ✅ **Active**
- **Location**: `src/components/profile-overlay.js` (346 lines)
- **Responsibility**: Member profile display with stats
- **Database**: `profiles` and `posts` tables
- **Features**: Profile info, recent posts, kindness metrics, appreciations placeholder
- **Test Coverage**: 19/19 tests passing (profile-overlay-test.js)

### IslamicGuidanceAgent ✅ **Active** (Optional)
- **Location**: `src/cards/islamic-guidance-card.js` (329 lines) 
- **Responsibility**: Daily Islamic guidance and wisdom
- **Database**: `islamic_guidance` table with fallback content
- **Features**: Qur'an verses, hadith, advice with beautiful styling
- **Test Coverage**: 18/18 tests passing (islamic-guidance-test.js)
- **Note**: Marked as removable but currently integrated

### MobileNavigationAgent ✅ **Active**
- **Location**: `src/components/bottom-nav.js` (81 lines)
- **Responsibility**: Mobile-first navigation component
- **Features**: Touch-optimized navigation, responsive breakpoints
- **Integration**: Automatically shows/hides based on screen size (<768px)

## Styling
- Scope styles per component (shadow DOM or BEM). No global resets.
- Respect `prefers-reduced-motion`. Provide high-contrast tokens.

## Testing & CI

### Comprehensive Test Suite ✅
- **74 Tests Total**: 100% pass rate maintained
- **5 Test Modules**: Auth, Events, Feed, Profile, Islamic Guidance  
- **Test Runner**: Custom jsdom-based runner (`scripts/test-runner.mjs`)
- **Coverage**: All agents have dedicated test files
- **CI Integration**: Tests run on every commit

### Test Standards
- Add a smoke test: ensure card renders, no console errors
- Update `/docs/QA.md` when UI contracts change
- All new features must include comprehensive test coverage
- Mock external dependencies (Supabase) for isolated testing
- Maintain descriptive test names and clear assertions

### Performance Standards
- **Lighthouse ≥ 90**: Performance, Accessibility, Best Practices
- **Zero console errors** in production
- **Load time < 3 seconds** on 3G connections
- **Bundle size < 100KB** total JavaScript

## Do / Don't quick list

✅ **Do** use Iconify icons, Lit templates, small pure helpers.

✅ **Do** check for session and whitelist before rendering private UI.

❌ **Don't** add new build tools or bundlers.

❌ **Don't** reference service keys or secrets in client code.

## MigrationAgent – Database Schema Standards

MigrationAgent ensures all future Supabase migrations follow these rules:  
- **INCREMENTAL MIGRATION POLICY**: Each schema change creates a new timestamped migration file in `supabase/migrations/`
- **LOGICAL MIGRATION GROUPING**: Related changes (e.g., table + indexes) should be grouped in single migrations when possible
- **TIMESTAMPED FILENAMES**: All migration files use format `YYYYMMDDHHMM_descriptive_name.sql`
- **Current Status**: 8 incremental migration files covering extensions, tables, policies, and indexes
- **Self-contained**: each migration can run independently and includes dependency comments
- **RLS first-class**: security policies are applied in dedicated migration after table creation  
- **Readable**: clear migration headers with version, dependencies, and rollback information
- **No temp/probe migrations**: only production-ready migrations in the main directory
- **Never manual changes** in Supabase UI, always via migrations  
- **Standard workflow**: Uses `supabase db pull`, `migration repair`, and `db push` for proper migration tracking

MigrationAgent works with other agents to ensure schema integrity, security, and proper migration history tracking in `/supabase/migrations/` following the INCREMENTAL MIGRATION, STANDARD WORKFLOW principle.

## Security notes
- Anon key is public; RLS is the real gate. Keep policies tight.
- Admins can manage family settings; never bypass RLS with client logic.