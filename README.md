# nest 🏠

[![CI Tests](https://github.com/nilegee/nest/actions/workflows/ci.yml/badge.svg)](https://github.com/nilegee/nest/actions/workflows/ci.yml)

**TL;DR**: Zero‑build private family hub with Landing (public login) and Home/Nest (private dashboard). Lit + Iconify + Supabase, hosted on GitHub Pages, email whitelist + strict RLS.

# nest 🏠

[![CI Tests](https://github.com/nilegee/nest/actions/workflows/ci.yml/badge.svg)](https://github.com/nilegee/nest/actions/workflows/ci.yml)

**FamilyNest**: Autonomous, event-driven family hub built with Lit 3 + Supabase. Zero-build deployment with auto-migrations, intelligent FamilyBot, and privacy-first architecture.

## 🏗️ Architecture Overview

**FamilyNest** is designed as an autonomous system that operates with minimal manual intervention:

- **4 Main Routes**: #nest (dashboard), #plan (events+goals), #journal (feed+notes), #profile
- **Event-Driven**: Domain events coordinate all system components automatically
- **FamilyBot**: Autonomous agent providing contextual nudges with smart throttling
- **Auto-Migrations**: Database changes apply automatically via PR workflow
- **Session Security**: 30-minute timeout, CSP headers, rate limiting protection

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Add your Supabase credentials
echo "SUPABASE_URL=your_project_url" >> .env.local
echo "SUPABASE_ANON_KEY=your_anon_key" >> .env.local
echo "WHITELISTED_EMAILS=email1@domain.com,email2@domain.com" >> .env.local

# Sync environment
node scripts/sync-env.mjs
```

### 2. Database Setup
Database migrations are **fully automated** via GitHub Actions:

- **New migrations**: Add `.sql` files to `supabase/migrations/`
- **On PR**: Migrations are validated automatically  
- **On merge**: Migrations apply to production automatically
- **Schema docs**: Regenerated and committed automatically

### 3. Deploy
Static hosting on GitHub Pages - **no build step required**:

```bash
# Development
npx http-server . -p 3000

# Production
# Just push to main - GitHub Pages deploys automatically
```

## 🧠 FamilyBot - Autonomous Intelligence

FamilyBot operates autonomously, providing contextual family engagement:

### Automatic Triggers
- **Event reminders**: 24h before scheduled events
- **Goal celebrations**: Progress milestones (25%, 50%, 75%, 100%)
- **Appreciation prompts**: Thank-back nudges after receiving appreciation
- **Stale goal checks**: Gentle reminders for inactive goals (7+ days)

### Smart Throttling
- **1 nudge per member per 24h per type**
- **Quiet hours**: Respects user-configured do-not-disturb times
- **Daily limits**: 3 goal milestones, 5 event reminders, 2 thank-backs, 1 stale check

### Rate Limiting
- **Token bucket algorithm** prevents abuse
- **Per-operation limits**: Posts (10/hour), events (20/30min), goals (50/10min)
- **Graceful degradation** with user-friendly messages

## 📊 Event-Driven Architecture

All system components communicate via domain events:

```javascript
// Core Domain Events
emit('POST_CREATED', { post, userId, familyId })
emit('EVENT_SCHEDULED', { event, userId, familyId })
emit('GOAL_PROGRESS', { progress, userId, goal })
emit('NOTE_ADDED', { note, userId, familyId })
emit('APPRECIATION_GIVEN', { appreciation, recipientId, giverId })
```

### Benefits
- **Autonomous operation**: Components react automatically to family activity
- **Loose coupling**: Features work independently and can be extended easily
- **Activity logging**: All user actions logged automatically for insights
- **Context awareness**: System adapts based on family behavior patterns

## 🔒 Security & Privacy

### Authentication
- **Email whitelist**: Only authorized family members can access
- **Session management**: Memory-only sessions with 30-minute timeout
- **OAuth + Magic Links**: Flexible authentication options

### Data Protection
- **Row Level Security (RLS)**: Family-scoped data access enforced at database level
- **23+ policies** across 11 tables ensure data isolation
- **Content Security Policy**: Strict CSP headers prevent XSS attacks
- **Rate limiting**: Protects against abuse and spam

### Session Security
- **Activity tracking**: Mouse, keyboard, touch events reset timeout
- **Automatic logout**: Idle sessions terminated with warning
- **Clean session storage**: No persistent auth data stored locally

## 🛣️ Routing & Navigation

### 4-Route Mental Model
```
#nest     → Family dashboard with overview cards
#plan     → Merged events + goals planning
#journal  → Merged family feed + personal notes  
#profile  → User settings and preferences
```

### Legacy Routes (Preserved)
- `#feed`, `#events`, `#goals`, `#notes` - Available for embedded use
- `#chores` - Hidden by feature flag (FLAGS.chores = false)
- `#insights` - Internal analytics (may be merged into #nest)

## 🔄 Auto-Migration Workflow

Database changes are **fully automated**:

### On Pull Request
1. **Syntax validation**: All migrations checked for valid SQL
2. **Drift detection**: Ensures migrations match expected schema
3. **Test application**: Migrations applied to test database

### On Merge to Main
1. **Production application**: Migrations applied automatically
2. **Schema regeneration**: Documentation updated from live database
3. **Auto-commit**: Updated docs committed back to repository

### Workflow File
`.github/workflows/db-migrations.yml` handles the entire process with:
- **Concurrency control**: Only one migration at a time
- **Error handling**: Fails fast on any issues
- **Audit trail**: Full logging of all migration steps

## 🧪 Testing

### Test Coverage
```bash
npm test  # Runs all tests
```

**Current Coverage**:
- ✅ Event bus functionality (3/3 tests)
- ✅ Database call wrapper (3/3 tests)  
- ✅ Context store operations (5/5 tests)
- ✅ Rate limiting logic (5/5 tests)
- ✅ UI contract validation (9/9 tests)
- ✅ Birthday calculations (7/7 tests)

### Smoke Testing
See `docs/QA.md` for comprehensive manual testing checklist including:
- Authentication flows
- Domain event emission
- FamilyBot nudge generation
- Session timeout behavior
- Route navigation
- Error handling

## 📁 Project Structure

```
├── src/
│   ├── services/           # Core autonomous services
│   │   ├── event-bus.js    # Domain event coordination
│   │   ├── acts.js         # Activity logging
│   │   ├── db-call.js      # Database wrapper
│   │   ├── context-store.js # Derived state management
│   │   └── rate-limit.js   # Abuse prevention
│   ├── views/              # Page components
│   │   ├── plan-view.js    # Events + goals merged
│   │   ├── journal-view.js # Feed + notes merged
│   │   └── nest-view.js    # Dashboard
│   ├── fn-family-bot.js    # Autonomous intelligence
│   ├── fn-app.js           # Session management
│   └── flags.js            # Feature toggles
├── supabase/migrations/    # Auto-applied DB changes
├── .github/workflows/      # CI/CD automation
├── docs/
│   ├── ARCHITECTURE.md     # System design details
│   └── QA.md              # Testing checklist
└── test/                   # Unit tests
```

## 🚩 Feature Flags

Control optional features via `src/flags.js`:

```javascript
export const FLAGS = {
  chores: false,      // Hide chores navigation
  wishlist: false,    // Remove wishlist features  
  feedback: false     // Remove feedback features
};
```

## 📈 Performance

### Bundle Analysis
- **Total JavaScript**: ~590KB (CDN cached)
- **Critical path**: <100KB initial load
- **Zero build process**: CDN-only delivery

### Performance Targets
- **First Contentful Paint**: <1s
- **Time to Interactive**: <3s  
- **Lighthouse Score**: ≥90 (Performance, Accessibility, Best Practices)

### Optimization Features
- **Context store caching**: Reduces redundant database queries
- **Delta refresh**: Only fetch changed data on events
- **Session-based preference caching**: Minimizes preference lookups
- **Skeleton loaders**: Perceived performance during data loads

## 🛠️ Development

### Local Development
```bash
# Install test dependencies
npm install

# Run development server
npx http-server . -p 3000

# Run tests
npm test
```

### Adding Features
1. **Event-driven design**: Emit domain events for new user actions
2. **Use service layer**: Wrap DB calls with `dbCall()`, log activities with `logAct()`
3. **Rate limiting**: Protect writes with `checkRateLimit()`
4. **FamilyBot integration**: Subscribe to relevant events for autonomous responses

### Migration Process
1. Create `.sql` file in `supabase/migrations/`
2. Open PR - validation runs automatically
3. Merge PR - migration applies automatically
4. Schema docs update automatically

## 🎯 Acceptance Criteria

The autonomous system meets these criteria:

- ✅ **4 visible routes**: nest/plan/journal/profile (chores hidden by flag)
- ✅ **Domain events**: Every write logs activity and emits events
- ✅ **FamilyBot operation**: 3+ nudge types with 24h throttling
- ✅ **Error handling**: All DB errors show toast & emit DB_ERROR
- ✅ **Session security**: Auto-logout after 30min idle
- ✅ **Security headers**: CSP active and rate-limits enforced
- ✅ **Auto-migrations**: Validated on PR, applied on merge, docs regenerated

## 📚 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Detailed system design
- **[QA.md](docs/QA.md)**: Comprehensive testing checklist  
- **[AGENTS.md](AGENTS.md)**: Development guidelines and constraints

## 🤝 Contributing

1. **Follow event-driven patterns**: Emit domain events for user actions
2. **Use existing services**: Database wrapper, rate limiting, activity logging
3. **Minimal changes**: Small, focused commits with clear intent
4. **Test coverage**: Add tests for new services and critical paths
5. **Migration-first**: Database changes via migration files only

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