# 🏠 FamilyNest - Private Family Hub

A private, psychology-informed family hub built with Lit 3, Supabase, and zero-build architecture.

## 🚀 Features

- **Zero-build CDN architecture** - No bundlers, just modern web standards
- **Private family spaces** - Email whitelist-based access control
- **Events management** - Family calendar with birthdays, anniversaries, and custom events
- **Family feed** - Share posts and updates within your family
- **Profile system** - Member profiles with stats and recent activity
- **Islamic guidance** (optional) - Daily verses, hadith, and family advice

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Lit 3 (CDN), Iconify web components
- **Backend**: Supabase (Database, Auth, RLS)
- **Hosting**: GitHub Pages (static)
- **Testing**: Custom test runner with jsdom

### Project Structure

```
/index.html              # App entry point (10.3KB, CDN dependencies)
/src/fn-app.js           # Main app component with session guard (Auth routing)
/src/fn-landing.js       # Authentication/login view (Google OAuth + magic link)
/src/fn-home.js          # Dashboard with routing and navigation shell
/src/views/              # Feature views (events, feed)
  events-view.js         # Events management (EventAgent)
  feed-view.js           # Family Wall posts (FeedAgent)
/src/components/         # Reusable components
  profile-overlay.js     # Profile display with stats (ProfileAgent)
  bottom-nav.js          # Mobile navigation component
/src/cards/              # Dashboard card widgets
  islamic-guidance-card.js # Islamic guidance widget (IslamicGuidanceAgent)
/src/utils/              # Utility functions
  profile-utils.js       # Profile data helpers
/web/env.js              # Environment configuration (auto-generated)
/web/supabaseClient.js   # Database client setup (session config)
/test/                   # Comprehensive test suite (74 tests, 100% pass rate)
/supabase/migrations/    # Incremental migration files (8 files)
```

## 🧪 Testing

The project includes a comprehensive test suite with 74 tests covering:

- **Auth flow tests** (9 tests) - Login, whitelist validation, OAuth
- **Events CRUD tests** (14 tests) - Create, read, update, delete operations
- **Feed posting tests** (14 tests) - Post creation, fetching, validation
- **Profile overlay tests** (19 tests) - User profiles, recent posts, stats
- **Islamic guidance tests** (18 tests) - Content fetching, fallback handling

### Running Tests

```bash
# Install test dependencies only (CDN app needs no build dependencies)
npm install

# Run comprehensive test suite (74 tests)
npm test

# Test breakdown by module
npm run test:auth     # Auth flow tests (9 tests)
npm run test:ui       # UI contract tests (74 tests total)

# Individual test modules available:
# - test/auth-flow-test.js (9 tests) 
# - test/events-crud-test.js (14 tests)
# - test/feed-posting-test.js (14 tests) 
# - test/profile-overlay-test.js (19 tests)
# - test/islamic-guidance-test.js (18 tests)
```

## 🗄️ Database Schema

The database schema is managed through a consolidated migration approach:

- **Single Migration File**: `supabase/migrations/20250816000000_init_schema.sql` (397 lines)
- **Complete Schema**: All tables, RLS policies, and indexes in one file
- **MigrationAgent Policy**: Following single migration file principle
- **7 Core Tables**: families, profiles, events, posts, islamic_guidance, acts, feedback, notes
- **RLS Enabled**: Row Level Security on all tables with email whitelist validation
- **Auto-Deploy**: GitHub Actions workflow triggers on migration changes

### Schema Highlights
- **Email Whitelist**: Centralized through `public.is_whitelisted_email()` function
- **Family Scoping**: All data isolated by family_id with proper RLS policies  
- **User Profiles**: Primary key `user_id` linked to auth.users
- **Foreign Keys**: Proper referential integrity across all relationships

### Email Whitelist Configuration

The system uses centralized email whitelist management:

- **Client-side**: `web/env.js` - Auto-generated from .env.local via `scripts/sync-env.mjs`
- **Database**: `public.is_whitelisted_email()` function with hardcoded emails  
- **Current Whitelist**: 4 authorized family emails
- **Environment**: Managed through GitHub secrets and build automation

## 🔒 Security

- **Row Level Security (RLS)** enforces data isolation between families
- **Email-based whitelist** controls access to the application
- **Memory-only sessions** - No localStorage for auth tokens
- **Supabase anon key** is public; RLS is the security boundary

## 🗄️ Database Migration Strategy

The project uses **incremental Supabase migrations** for proper change tracking and rollback capabilities.

### Migration Files Structure

```
supabase/migrations/
├── 20250816000000_extensions_and_types.sql    # Extensions and custom types
├── 20250816000100_core_tables.sql             # Families and profiles
├── 20250816000200_events_system.sql           # Events management
├── 20250816000300_posts_and_feed.sql          # Family wall/feed
├── 20250816000400_islamic_guidance.sql        # Islamic guidance content  
├── 20250816000500_supporting_tables.sql       # Acts, feedback, notes
├── 20250816000600_rls_policies.sql            # Row Level Security policies
└── 20250816000700_indexes_and_performance.sql # Database indexes
```

### Local Development Commands

```bash
# Sync with remote database state
supabase db pull --db-url "$DATABASE_URL"

# Repair migration history mismatches
supabase migration repair --status reverted <timestamp> --db-url "$DATABASE_URL"

# Apply migrations incrementally
supabase db push --db-url "$DATABASE_URL" --debug

# Check migration status
supabase migration list --db-url "$DATABASE_URL"
```

### CI/CD Deployment

The GitHub workflow automatically:
1. **Pulls** remote migration state to sync local/remote history
2. **Repairs** migration status to resolve any conflicts
3. **Pushes** incremental migrations using standard Supabase tooling
4. **Verifies** deployment success

This approach provides:
- ✅ **Granular rollback** capability per migration
- ✅ **Clear change history** for easier debugging
- ✅ **Better team collaboration** with isolated migrations
- ✅ **Standard Supabase practices** alignment

## 🎯 Development Guidelines

### Non-negotiables
- Preserve zero-build architecture (CDN only)
- Never break auth or privacy controls
- Maintain Lighthouse score ≥ 90
- Zero console errors in production

### Code Style
- Use existing libraries when possible
- Scope styles per component (shadow DOM or BEM)
- Respect `prefers-reduced-motion`
- 44px minimum touch targets for accessibility

### Testing Requirements
- All new features must include tests
- Tests should use mocking for external dependencies
- Maintain 100% test pass rate
- Update QA.md for UI contract changes

## 📖 Documentation

- **AGENTS.md** - Development guidelines and agent responsibilities
- **docs/QA.md** - Quality assurance checklist and smoke tests
- **APP_STATUS_REVIEW.txt** - Current application status and metrics

## 🤝 Contributing

1. Follow the guidelines in `AGENTS.md`
2. Add tests for new functionality
3. Ensure all tests pass with `npm test`
4. Update documentation for significant changes
5. Maintain the zero-build architecture
