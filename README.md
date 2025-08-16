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
/index.html              # App entry point
/src/fn-app.js           # Main app component with session guard
/src/fn-landing.js       # Authentication/login view
/src/fn-home.js          # Dashboard with routing
/src/views/              # Feature views (events, feed)
/src/components/         # Reusable components
/src/cards/              # Dashboard card widgets
/web/env.js              # Environment configuration (centralized)
/web/supabaseClient.js   # Database client setup
/test/                   # Comprehensive test suite
/supabase/migrations/    # Incremental database migrations
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
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suite
npm run test:auth     # Auth flow tests
npm run test:ui       # UI contract tests
```

## 🗄️ Database Migrations

The database schema is managed through incremental migrations:

1. **01_extensions_and_types.sql** - PostgreSQL extensions and custom types
2. **02_core_tables.sql** - Families and profiles tables
3. **03_events_tables.sql** - Events system tables
4. **04_posts_tables.sql** - Posts and feed tables
5. **05_islamic_guidance_tables.sql** - Islamic guidance feature
6. **06_additional_tables.sql** - Supporting tables (acts, feedback, notes)
7. **07_rls_policies.sql** - Row Level Security policies
8. **08_indexes.sql** - Performance indexes

Each migration includes rollback instructions for safe schema management.

### Email Whitelist Configuration

The system uses centralized email whitelist configuration:

- **Client-side**: `web/env.js` exports `WHITELISTED_EMAILS` array
- **Database**: RLS policies use `public.is_whitelisted_email()` function
- **Environment**: Managed through `.env.local` and build scripts

## 🔒 Security

- **Row Level Security (RLS)** enforces data isolation between families
- **Email-based whitelist** controls access to the application
- **Memory-only sessions** - No localStorage for auth tokens
- **Supabase anon key** is public; RLS is the security boundary

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
