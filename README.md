# nest 🏠

[![CI Tests](https://github.com/nilegee/nest/actions/workflows/ci.yml/badge.svg)](https://github.com/nilegee/nest/actions/workflows/ci.yml)

**TL;DR**: Zero‑build private family hub with Landing (public login) and Home/Nest (private dashboard). Lit + Iconify + Supabase, hosted on GitHub Pages, email whitelist + strict RLS.

## ⚠️ DANGER: Manual Database Reset

This project includes a manual GitHub Action that **DESTROYS ALL PUBLIC DATA** and recreates the database from `db/schema.sql`.

> **⚡ Preferred**: Use the new migration workflow in `supabase/migrations/` for schema changes. This reset is only for emergencies.

### How to run safely

1. **Set repository secrets:**
   - `DATABASE_URL` → full Postgres URL from Supabase
   - `CONFIRM_DB_RESET` → set to `TRUE`

2. **Go to Actions → Manual DB Reset (Danger) → Run workflow**

3. **Enter `ERASE_AND_APPLY` in the confirm field and run.**

The workflow:
- Backs up the current DB with `pg_dump` (artifact)
- Applies `db/schema.sql`
- Verifies RLS and schema (fails on drift)

### Local apply (alternative)

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/verify-rls.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/verify-schema.sql
```

### Seeding

Seed statements remain commented because they require real `auth.users` UUIDs.

## Purpose

Private family hub implementing **Phase 1 Family OS** with psychology-informed and Islamic values-focused features:
- **Landing**: Public login page (Google OAuth + Magic Link)
- **Home/Nest**: Private dashboard with family features
- **Events**: Family event management and calendar
- **Family Wall**: Post sharing and communication
- **Profile Overlay**: Member insights with kindness tracking
- **Islamic Guidance**: Daily spiritual guidance and wisdom

### Modules Implemented

- **Events Module**: CRUD operations for family events (birthdays, anniversaries, custom)
- **Family Wall Module**: Post composer with media support and reverse chronological feed  
- **Profile Overlay Module**: Member profiles with activity stats and recent posts
- **Islamic Guidance Card Module**: Removable daily guidance with Qur'an verses and hadith

### Psychology & Islamic Values Vision

This family hub is built on principles of:
- **Positive Psychology**: Celebrating achievements, building streaks, gentle encouragement
- **Islamic Family Values**: Daily guidance, community support, gratitude practices
- **Soft Competition**: Badges and progress tracking that build up rather than compete
- **Micro-interactions**: Small, meaningful moments that strengthen family bonds

## Stack

- **Lit 3** (CDN): Web components framework
- **Iconify icons** (CDN): Web component icons
- **Supabase JS** (CDN): Memory‑only auth (no localStorage)
- **GitHub Pages**: Static hosting

## Features

- **Greeting**: Personalized welcome with current date
- **One Gentle Action**: Daily completion with celebration
- **Composer + feed placeholder**: Family post sharing area
- **Upcoming Events**: Family calendar integration
- **Birthdays & Celebrations**: Computed from date of birth
- **Family Goal**: Shared progress tracking
- **Do You Know?**: Tips and family knowledge
- **Quick Actions**: Desktop sidebar shortcuts
- **Responsive navigation**: Left nav (desktop) / bottom tabs (mobile)

## Security

- **Email whitelist**: Only specified emails can access
- **Strict RLS**: Row Level Security policies in Supabase
- **No secrets in repo**: Environment variables via .env.local
- **Anon key is client‑side by design**: Public key, security via RLS

## Environment Setup

Create `.env.local`:

```bash
SUPABASE_URL=https://zlhamcofzyozfyzcgcdg.supabase.co
SUPABASE_ANON_KEY=…(given)…
WHITELISTED_EMAILS=yazidgeemail@gmail.com,yahyageemail@gmail.com,abdessamia.mariem@gmail.com,nilezat@gmail.com
```

Generate `/web/env.js` (ES module):

```bash
node ./scripts/sync-env.mjs
```

**Note**: `.env.local` stays git‑ignored; `env.js` is committed.

## Auth/OAuth

- **Google & Magic Link** with `redirectTo: https://nilegee.github.io/nest/`
- On page load: call `getSession()` and swap Landing/Home views
- **Email validation**: If not whitelisted, show friendly error and sign out
- **Memory‑only sessions**: Uses Supabase sessionStorage, no localStorage

## Running Locally

```bash
npx serve .
```

Open `http://localhost:3000` (or shown port).

**No build step required** — serve static files directly.

## Deploy

1. **GitHub Pages** → Settings → Pages
2. **Source**: Deploy from a branch → `main` / `root`
3. **Live at**: `https://nilegee.github.io/nest/`

Ensure `.env.local` is configured and `node ./scripts/sync-env.mjs` has generated `web/env.js` before pushing.

## Accessibility & Performance

- **Landmarks**: `<nav>`, `<main>`, `<aside>` structure
- **Focus rings**: Visible on all interactive elements
- **Reduced motion**: Respects `prefers-reduced-motion`
- **Lighthouse ≥90**: Performance, Accessibility, Best Practices, SEO
- **Zero console errors**: Clean runtime environment

## Structure

```
/index.html                    # Root with CDN imports
/src/                          # Lit components
  fn-app.js                    # Session guard + layout shell
  fn-landing.js                # Login view (Google + magic link)
  fn-home.js                   # Nest (dashboard) view
  components/                  # Reusable UI components
/cards/                        # Self-contained card modules
  nest-cards.js                # renderNestCards() + registerNestCard()
  birthdays.js                 # getUpcomingBirthdays()
  events.js                    # getUpcomingEvents()
/web/                          # Environment and client setup
  supabaseClient.js            # createClient with persistSession:false
  env.js                       # Generated from .env.local
/db/schema.sql                 # Tables + RLS policies (legacy)
/supabase/                     # Migration-based schema management
  migrations/                  # Timestamped SQL migration files
  README.md                    # Migration workflow documentation
/docs/QA.md                    # Smoke test procedures
```

## Database Migrations

**New schema changes use the migration-based workflow:**

- **Location**: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- **Deployment**: Manual-only via GitHub Actions for safety
- **Rule**: Never apply manual database changes—commit and push only

### Adding Schema Changes

1. Create timestamped migration file:
   ```bash
   touch supabase/migrations/$(date -u +"%Y%m%d%H%M%S")_your_change.sql
   ```

2. Write your SQL migration:
   ```sql
   CREATE TABLE IF NOT EXISTS new_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. Commit and push:
   ```bash
   git add supabase/migrations/ && git commit -m "Add new table" && git push
   ```

4. **Deploy migrations manually**:
   - **How to run**: Actions tab → Deploy Database Migrations → Run workflow → select `main`
   - **Guardrails**: manual-only, concurrency protection, only for `main` branch
   - **Later**: Switch to auto-trigger by adding:
     ```yaml
     on:
       push:
         branches: [ main ]
         paths:
           - "supabase/migrations/**"
     ```

**Complete documentation**: See `supabase/README.md`

### Database schema workflow

- **PRs**: A check named "PR DB Change Watch" fails if files under supabase/migrations change; add label `db-migrations-ok` after review.
- **To initialize an empty DB**: Actions → "Bootstrap DB from Migrations (manual)" → Run.

## QA Checklist

**Login Success**:
- [ ] Google OAuth redirects correctly
- [ ] Magic link email received and works
- [ ] Whitelisted email accesses Home/Nest view
- [ ] Session persists within browser tab

**Whitelist Rejection**:
- [ ] Non-whitelisted email shows friendly error
- [ ] User automatically signed out
- [ ] Returns to Landing page

**Layout Consistency**:
- [ ] Same cards appear on desktop sidebar and mobile inline
- [ ] Desktop: left nav (76px collapsed, 240px expanded) + main + right sidebar (320px)
- [ ] Mobile: single column + bottom tabs (60px height)

**Sticky Sidebar**:
- [ ] Desktop right sidebar remains fixed during scroll
- [ ] Cards maintain position relative to viewport

**Birthdays Sorted**:
- [ ] Upcoming birthdays display in chronological order
- [ ] Birthday countdowns calculate correctly from DOB
- [ ] "Today" birthdays show celebration animation

**Console Cleanliness**:
- [ ] Zero JavaScript errors
- [ ] Zero 404 errors for resources
- [ ] Only expected informational logs

For complete QA procedures, see `docs/QA.md`.

---

**Made with ❤️ for families who want to stay connected.**

## Database schema workflow

**Secret:** In GitHub → Settings → Secrets and variables → Actions, set `DATABASE_URL` to your Supabase **Session Pooler** URI **including** `?sslmode=require`, for example:
`postgresql://<user>:<pass>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require`

### Daily routine
1. (Optional) Pull baseline from remote
   ```bash
   supabase db pull --db-url "$DATABASE_URL"
   ```