🤖 AGENTS.md — How to safely extend Nest
Mission

Nest is a zero-build, psychology-guided family hub where every feature must respect privacy, security, and delight in under 15 seconds.

🚫 Hard Fails

Any violation = automatic rejection.

Changing Supabase URL/Anon, OAuth redirects, or env plumbing

Using localStorage/cookies for auth (sessions must remain memory-only)

Weakening or bypassing RLS (families must never see other families’ data)

Shipping with console errors or Lighthouse < 90 (Perf / Accessibility / Best Practices)

Tech Stack (Frozen)

Lit 3 (CDN)

Iconify (web component)

Supabase JS v2 (CDN)

Hosted on GitHub Pages (static)

No new frameworks, bundlers, or build tools allowed.

Security Principles

Anon key is public → RLS is the lock.

Admins may have settings control, but must never bypass RLS in client code.

No secrets/service keys in client code.

All sessions are memory-only.

App Structure
/index.html                  # root; loads Iconify, Lit, <fn-app>
/src/fn-app.js               # session guard + layout shell
/src/fn-landing.js           # login view (Google + magic link)
 /src/fn-home.js              # dashboard view (Nest)
 /cards/                      # self-contained card modules
   nest-cards.js              # renderNestCards() + registerNestCard()
   birthdays.js               # getUpcomingBirthdays()
   events.js                  # getUpcomingEvents()
 /web/supabaseClient.js       # createClient with persistSession:false
 /web/env.js                  # generated from .env.local
 /db/schema.sql               # tables + RLS
 /docs/QA.md                  # smoke tests

Psychology Contracts

One Gentle Action per view (no clutter, no paralysis).

Celebrate > Correct: reward effort, never shame mistakes.

Soft competition only: badges, streaks — not leaderboards.

Micro-moments (<15s): interactions resolve fast and end positive.

Accessibility = dignity: ARIA landmarks, labels, focus order, 44px targets, keyboard flows.

Extension Pattern

All new widgets must be /cards/ modules and registered via registerNestCard:

import { registerNestCard } from './nest-cards.js';
registerNestCard('my-card-id', () => {
  // return Lit template or DOM fragment
});


Fragments auto-render in both desktop sidebar and mobile inline.

Phase 1 Agents (Current Implementation)
EventAgent ✅ Active

Location: src/views/events-view.js (287 lines)

Responsibility: Manage family events (birthdays, anniversaries, custom)

Database: events table (RLS enforced)

Features: CRUD ops, date formatting, event icons

Tests: 14/14 passing (events-crud-test.js)

Risks/TODO: No calendar view yet; birthday logic may deserve standalone widget

FeedAgent ✅ Active

Location: src/views/feed-view.js (275 lines)

Responsibility: Family post sharing and communication

Database: posts table with author relationships

Features: Composer, media URLs, reverse chronological feed

Tests: 14/14 passing (feed-posting-test.js)

Risks/TODO: Add file upload integration (Supabase storage)

ProfileAgent ✅ Active

Location: src/components/profile-overlay.js (346 lines)

Responsibility: Profile display + stats

Database: profiles, posts

Features: Info, recent posts, kindness metrics, appreciations placeholder

Tests: 19/19 passing (profile-overlay-test.js)

Risks/TODO: Accessibility gaps (focus management for modal)

IslamicGuidanceAgent ✅ Active (Optional)

Location: src/cards/islamic-guidance-card.js (329 lines)

Responsibility: Qur’an verses, hadith, advice

Database: islamic_guidance (read-only RLS)

Features: Styled display with fallbacks

Tests: 18/18 passing (islamic-guidance-test.js)

Risks/TODO: Marked removable, but still tightly coupled

MobileNavigationAgent ✅ Active

Location: src/components/bottom-nav.js (81 lines)

Responsibility: Mobile navigation

Features: Touch-optimized, auto show/hide under 768px

Integration: Works alongside sidebar on desktop

Risks/TODO: Browser history vs hash routing inconsistencies

Styling

Scope styles per component (Shadow DOM or BEM).

Respect prefers-reduced-motion.

Provide high-contrast tokens.

No global resets.

Testing & CI
Comprehensive Test Suite ✅

74 Tests Total, all passing

Modules: Auth, Events, Feed, Profile, Islamic Guidance

Runner: scripts/test-runner.mjs (jsdom)

Coverage: 100% per agent

CI: Runs on every commit

Test Standards

Smoke test every card (renders, no console errors)

Update /docs/QA.md with UI contract changes

Always mock Supabase for isolation

Descriptive test names + clear assertions

Performance Standards

Lighthouse ≥ 90 (Perf, A11y, Best Practices)

Zero console errors in production

Load < 3s on 3G

Total JS < 100KB gzipped

MigrationAgent — Database Schema Standards

MigrationAgent = history keeper. Every schema change must be reproducible, reviewable, and reversible.

Incremental migrations only → timestamped files in supabase/migrations/

Group logically → related changes (tables + indexes) together

Format → YYYYMMDDHHMM_descriptive_name.sql

Self-contained → each migration runs independently with rollback notes

RLS first-class → always applied right after table creation

Readable → headers with version, dependencies, rollback info

No temp/probe migrations in main branch

Never manual Supabase UI edits

Workflow: supabase db pull, migration repair, db push

✅ Do / ❌ Don’t Quick List

✅ Use Iconify icons, Lit templates, pure helpers
✅ Check session + whitelist before private UI
✅ Keep migrations incremental & RLS-first

❌ Add new bundlers/frameworks
❌ Reference service keys or secrets in client code
❌ Persist auth in localStorage

Quick Reference Table
Area	Rule of Thumb
Auth	Memory-only, whitelist enforced
Data	RLS always, no cross-family leaks
UX	One gentle action, celebrate not shame
Performance	Lighthouse ≥ 90, load < 3s
Migrations	Incremental, timestamped, RLS after tables
Styling	Scoped (Shadow DOM/BEM), honor reduced motion

⚡ This file is your constitution: follow it, and Nest stays fast, private, and kind.
