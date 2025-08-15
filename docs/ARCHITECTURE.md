# FamilyNest Architecture

## Overview

FamilyNest is an autonomous, event-driven family hub built with Lit 3 and Supabase. The architecture prioritizes minimal dependencies, zero-build deployment, and autonomous operation.

## Core Principles

- **Zero-build**: CDN-only delivery with no bundlers or build steps
- **Event-driven**: Domain events coordinate all system components
- **Autonomous**: Self-managing with minimal manual intervention
- **Privacy-first**: Family-scoped data with RLS enforcement
- **Gentle UX**: Soft competition, micro-interactions, accessibility-first

## Architecture Layers

### 1. Presentation Layer (Lit 3 Components)

**Main Routes** (4-route mental model):
- `#nest` - Dashboard with family overview
- `#plan` - Planning view (events + goals merged)
- `#journal` - Journaling view (feed + notes merged)  
- `#profile` - User settings and preferences

**Legacy Routes** (preserved for embedded use):
- `#feed`, `#events`, `#goals`, `#notes`, `#insights`
- `#chores` (hidden by feature flag)

### 2. Service Layer

#### Event Bus (`src/services/event-bus.js`)
Central nervous system for domain events:

```javascript
// Domain Events
emit('ACT_LOGGED', { act })
emit('POST_CREATED', { post, userId, familyId })
emit('EVENT_SCHEDULED', { event, userId, familyId })
emit('GOAL_PROGRESS', { progress, userId, goal })
emit('NOTE_ADDED', { note, userId, familyId })
emit('APPRECIATION_GIVEN', { appreciation, recipientId, giverId })
emit('PREF_UPDATED', { userId })
emit('DB_OK', { label })
emit('DB_ERROR', { label, error })
```

#### Database Services

**DB Call Wrapper** (`src/services/db-call.js`):
- Consistent error handling across all database operations
- Automatic toast notifications for failures
- Domain event emission (DB_OK/DB_ERROR)

**Activity Logging** (`src/services/acts.js`):
- Logs all user activities to `acts` table
- Emits ACT_LOGGED domain event
- Provides audit trail for family interactions

**Context Store** (`src/services/context-store.js`):
- Derived state management with intelligent caching
- Selectors for common queries (upcoming events, stale goals, etc.)
- Delta refresh on domain events

#### Security & Rate Limiting

**Rate Limiting** (`src/services/rate-limit.js`):
- Token bucket algorithm per operation type
- Per-user rate limiting with configurable rules
- Prevents abuse while allowing normal usage

**Session Management**:
- 30-minute inactivity timeout
- Memory-only sessions (no localStorage persistence)
- Activity tracking for timeout reset

### 3. FamilyBot (Autonomous Agent)

FamilyBot is the autonomous intelligence layer that:

**Event Subscribers**:
- Listens to all domain events
- Triggers contextual nudges based on family activity
- Respects user preferences and quiet hours

**Nudge System**:
- 24-hour throttling per member per nudge type
- Multiple nudge categories: events, goals, appreciation, etc.
- Smart scheduling around quiet hours

**Nudge Types**:
- `event_reminder` - 24h before events  
- `goal_milestone` - Progress celebrations
- `goal_stale_check` - Gentle reminders for inactive goals
- `gratitude_thank_back` - Appreciation responses

**Throttling Rules**:
```javascript
// Per-kind daily limits
{
  'goal_milestone': 3,
  'event_reminder': 5, 
  'gratitude_thank_back': 2,
  'goal_stale_check': 1
}
```

### 4. Data Layer (Supabase)

**Row Level Security (RLS)**:
- Family-scoped data access enforced at database level
- 23+ policies across 11 tables
- Multi-tenant isolation with family_id

**Key Tables**:
- `profiles` - User data with family associations
- `posts` - Family feed content
- `events` - Family calendar events  
- `goals` - Shared family goals
- `acts` - Activity logging and gamification
- `notes` - Private user notes
- `nudges` - FamilyBot communication queue
- `preferences` - User customization settings

## Security Architecture

### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://esm.sh https://code.iconify.design;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
```

### Authentication Flow
1. Google OAuth or magic link authentication
2. Email whitelist validation (4 authorized family members)
3. Session storage in memory only (no persistence)
4. Automatic timeout after 30 minutes inactivity

### Data Protection
- All data scoped to family_id
- RLS policies prevent cross-family data access
- No sensitive data in client-side code
- Rate limiting prevents abuse

## Deployment & CI/CD

### Zero-Build Deployment
- Static hosting on GitHub Pages
- CDN delivery for all dependencies
- No build process required

### Auto DB Migrations
Workflow: `.github/workflows/db-migrations.yml`

**On Pull Request**:
- Validates migration syntax
- Checks for schema drift
- Runs verification scripts

**On Merge to Main**:
- Applies migrations to production
- Regenerates schema documentation
- Commits updated docs automatically

### Feature Flags
```javascript
// src/flags.js
export const FLAGS = {
  chores: false,      // Hide chores UI
  wishlist: false,    // Remove wishlist features
  feedback: false     // Remove feedback features
};
```

## Data Flow Examples

### Creating a Post
1. User writes post in feed composer
2. `feed-view.js` calls `dbCall()` wrapper
3. Rate limiting check via `checkRateLimit()`
4. Post inserted to database
5. `logAct()` records activity
6. `emit('POST_CREATED')` notifies system
7. FamilyBot may schedule engagement nudges
8. Context store refreshes feed data
9. UI updates with new post

### FamilyBot Nudge Flow
1. Domain event emitted (e.g., `EVENT_SCHEDULED`)
2. FamilyBot event handler triggered
3. `enqueueNudge()` checks throttling rules
4. Quiet hours and preferences validated
5. Nudge inserted into `nudges` table
6. Scheduler processes queue when appropriate
7. User receives contextual prompt

## Testing Strategy

### Unit Tests
- Event bus functionality
- Rate limiting logic
- Context store selectors
- Database call wrapper

### Integration Tests
- UI contract verification
- Component registration
- Card rendering system

### Smoke Tests
- Authentication flow
- Core user journeys
- FamilyBot nudge delivery

## Performance Considerations

### Bundle Size
- **Total**: ~590KB JavaScript (CDN cached)
- **Critical path**: <100KB initial load
- **Optimization**: Dynamic component loading

### Caching Strategy
- CDN caching for dependencies
- Context store for derived state
- Session-based preference caching

### Rate Limiting
- Prevents database overload
- Maintains responsive UX
- Protects against abuse

## Monitoring & Observability

### Activity Logging
All user actions logged to `acts` table:
- Action type and metadata
- Timestamp and user context
- Family association

### Error Handling
- Consistent toast notifications
- Domain event emission for errors
- Graceful degradation

### Performance Metrics
- First Contentful Paint: <1s
- Time to Interactive: <3s
- Session timeout: 30 minutes

## Future Enhancements

### Planned Features
- Service worker for offline support
- Push notifications for critical nudges
- Advanced analytics dashboard
- Family memory timeline

### Scalability Considerations
- Horizontal scaling via family sharding
- Read replica support for large families
- Event sourcing for activity history

## Development Guidelines

### Code Style
- Use existing libraries when possible
- Minimal comments (self-documenting code)
- Consistent error handling patterns
- Accessibility-first development

### Contribution Workflow
1. Feature flags for experimental features
2. Database migrations via PR process
3. Comprehensive testing requirements
4. Documentation updates mandatory

This architecture enables FamilyNest to operate autonomously while providing a gentle, psychology-informed experience for families.