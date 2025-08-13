# nest 🏠

**TL;DR**: Zero‑build private family hub with Landing (public login) and Home/Nest (private dashboard). Lit + Iconify + Supabase, hosted on GitHub Pages, email whitelist + strict RLS.

## Purpose

Private family hub with two views:
- **Landing**: Public login page (Google OAuth + Magic Link)
- **Home/Nest**: Private dashboard with family features

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
/db/schema.sql                 # Tables + RLS policies
/docs/QA.md                    # Smoke test procedures
```

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