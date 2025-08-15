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

## Phase 1 Agents

### EventAgent
- **Location**: `src/views/events-view.js`
- **Responsibility**: Manage family events (birthdays, anniversaries, custom)
- **Database**: `events` table with RLS policies
- **Features**: CRUD operations, date formatting, event type icons

### FeedAgent  
- **Location**: `src/views/feed-view.js`
- **Responsibility**: Family post sharing and communication
- **Database**: `posts` table with author relationships
- **Features**: Post composer, media URLs, reverse chronological display

### ProfileAgent
- **Location**: `src/components/profile-overlay.js`
- **Responsibility**: Member profile display with stats
- **Database**: `profiles` and `posts` tables
- **Features**: Profile info, recent posts, kindness metrics, appreciations placeholder

### IslamicGuidanceAgent
- **Location**: `src/cards/islamic-guidance-card.js` (removable)
- **Responsibility**: Daily Islamic guidance and wisdom
- **Database**: `islamic_guidance` table with fallback content
- **Features**: Qur'an verses, hadith, advice with beautiful styling

## Styling
- Scope styles per component (shadow DOM or BEM). No global resets.
- Respect `prefers-reduced-motion`. Provide high-contrast tokens.

## Testing & CI
- Add a smoke test: ensure card renders, no console errors.
- Update `/docs/QA.md` when UI contracts change.

## Do / Don't quick list

✅ **Do** use Iconify icons, Lit templates, small pure helpers.

✅ **Do** check for session and whitelist before rendering private UI.

❌ **Don't** add new build tools or bundlers.

❌ **Don't** reference service keys or secrets in client code.

## MigrationAgent – Database Schema Standards

MigrationAgent ensures all future Supabase migrations follow these rules:  
- **SINGLE MIGRATION FILE POLICY**: At any time, there must be exactly ONE migration file in `supabase/migrations/`
- **ALL CHANGES IN ONE FILE**: All schema changes must be appended to the single migration file, never split across multiple files
- **DELETE OLD MIGRATIONS**: Any previous migration files must be deleted before adding a new schema change
- **Self-contained**: create tables if not exist before altering  
- **RLS first-class**: every family-scoped table has RLS enabled and policies applied immediately  
- **Readable**: structured sections for create, alter, RLS, indexes  
- **No temp/probe migrations**  
- **Never manual changes** in Supabase UI, always via migrations  
- **Commit-and-push only**: All future schema updates must follow the "commit-and-push only" process to trigger the single automated workflow

MigrationAgent works with other agents to ensure schema integrity, security, and minimal clutter in `/supabase/migrations/` following the ONE MIGRATION FILE, ONE WORKFLOW principle.

## Security notes
- Anon key is public; RLS is the real gate. Keep policies tight.
- Admins can manage family settings; never bypass RLS with client logic.