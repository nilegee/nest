# Schema Mapping - Code to Database

This document maps JavaScript code to database schema based on codebase analysis.

## Summary of Changes

**New Tables**: 11 total tables (7 core + 4 FamilyBot)  
**Altered Tables**: None (new schema)  
**Added Indexes**: 15 performance indexes  
**RLS Notes**: Complete multi-tenant family isolation with 23 policies

## Core Tables

### `families` (Multi-tenant root)
- **Purpose**: Family organization and multi-tenancy
- **Code References**: 
  - Family-scoped queries throughout application
  - Referenced in all table foreign keys
- **Columns**: id, name, created_by, created_at, updated_at
- **RLS**: Users see only their own family

### `profiles` (User profiles)  
- **Purpose**: User profile data, 1:1 with auth.users
- **Code References**:
  - `src/fn-home.js:1280` - Profile loading
  - `src/fn-profile.js:292` - Profile management
  - `src/fn-chores.js:351` - User display names
- **Columns**: user_id (PK), full_name, dob, avatar_url, role, family_id
- **RLS**: Family members can see each other, users can update self

### `events` (Calendar/scheduling)
- **Purpose**: Family events and calendar
- **Code References**:
  - `src/fn-home.js:1341` - Event listing
  - `src/fn-home.js:1452` - Event creation
  - `src/fn-home.js:1490` - Event updates
  - `src/fn-home.js:1529` - Event deletion
- **Columns**: id, family_id, owner_id, title, location, starts_at, ends_at, meta
- **RLS**: Family members see all, owners can modify

### `posts` (Family feed)
- **Purpose**: Family announcements and social posts
- **Code References**:
  - `src/fn-home.js:1307` - Post listing
  - `src/fn-home.js:1417` - Post creation
  - `src/fn-family-bot.js:320` - Bot-generated posts
- **Columns**: id, family_id, author_id, body, visibility, audience
- **RLS**: Family members see family posts, authors can modify

### `acts` (Activity tracking)
- **Purpose**: Achievement tracking, kindness points, chores
- **Code References**:
  - `src/fn-chores.js:365` - Activity loading
  - `src/fn-chores.js:469` - Activity creation
  - `src/fn-home.js:1556` - Activity queries
  - `src/fn-home.js:1632` - Activity insertion
- **Columns**: id, family_id, user_id, kind, points, meta
- **Activity Types**: 'gentle_action', 'kindness', 'goal_contrib', 'chore_complete'
- **RLS**: Family members see all activities, users manage their own

### `feedback` (Insights/surveys)
- **Purpose**: Family feedback and mood tracking
- **Code References**: Limited usage in existing codebase
- **Columns**: id, family_id, about_id, by_id, answers
- **RLS**: Family members can see/give feedback, admins can delete

### `notes` (Journaling)
- **Purpose**: Family notes and journaling
- **Code References**:
  - `src/fn-notes.js:354` - Note listing
  - `src/fn-notes.js:409` - Note updates
  - `src/fn-notes.js:426` - Note creation
  - `src/fn-notes.js:461` - Note deletion
- **Columns**: id, family_id, author_id, body, checklist, meta
- **RLS**: Family members see all notes, authors can modify

## FamilyBot Tables

### `preferences` (Bot configuration)
- **Purpose**: Per-user FamilyBot settings and personalization
- **Code References**:
  - `src/fn-family-bot.js:83` - Preference loading
  - `src/fn-profile.js:335` - Preference management
  - Extensive use throughout profile component
- **Columns**: user_id (PK), family_id, bot_name, theme, language, message_pack, role_tag, interests, gaming_minutes_goal, quiet_hours_start/end, nudge_cap_per_day, muted_categories
- **RLS**: Users see/manage only their own preferences

### `wishlist` (Member wishlists)
- **Purpose**: Family member wishlist management
- **Code References**:
  - `src/fn-profile.js:318` - Wishlist loading
  - `src/fn-profile.js:406` - Wishlist item creation
  - `src/fn-profile.js:432` - Wishlist item deletion
  - `src/cards/birthdays.js:199` - Birthday wishlist integration
- **Columns**: id, family_id, user_id, title, description, priority, completed, completed_at
- **RLS**: Family sees wishlists, users manage their own

### `nudges` (Bot messaging)
- **Purpose**: Scheduled messages and reminders from FamilyBot
- **Code References**:
  - `src/fn-family-bot.js:170` - Nudge counting
  - `src/fn-family-bot.js:196` - Nudge creation
  - `src/fn-family-bot.js:268` - Nudge querying
  - `src/fn-family-bot.js:299` - Nudge status updates
- **Columns**: id, family_id, target_user_id, nudge_kind, message, scheduled_for, sent_at, responded_at, response_data, meta
- **RLS**: Family sees nudges, targets can respond

### `appreciations` (Gratitude system)
- **Purpose**: Family appreciation and gratitude tracking
- **Code References**:
  - `src/fn-insights.js:353` - Appreciation listing
  - `src/fn-insights.js:456` - Appreciation updates
  - `src/fn-insights.js:485` - Appreciation deletion
- **Columns**: id, family_id, from_user_id, to_user_id, appreciation_text, occasion, posted_to_feed, posted_at
- **RLS**: Family sees appreciations, creators can modify

## Indexes and Performance

### Family-Scoped Queries (Most Common)
- `idx_profiles_family_id` - Profile lookups by family
- `idx_events_family_id_starts_at` - Upcoming events
- `idx_posts_family_id_created_at` - Recent posts
- `idx_acts_family_id_created_at` - Recent activities

### User-Specific Operations
- `idx_acts_user_id_kind` - User activity by type
- `idx_wishlist_family_user` - User wishlists
- `idx_appreciations_to_user` - Appreciations received

### FamilyBot Specific
- `idx_nudges_scheduled` - Pending scheduled nudges
- `idx_nudges_family_target` - User-specific nudges

## Database Conventions Applied

### Naming
- ✅ **snake_case**: All columns and tables
- ✅ **Plural table names**: families, events, posts, etc.
- ✅ **Foreign keys**: Consistent `_id` suffix

### Data Types
- ✅ **UUIDs**: Primary keys with `gen_random_uuid()`
- ✅ **Timestamps**: `timestamptz` with `now()` defaults
- ✅ **JSON**: `jsonb` for structured data (meta, preferences)
- ✅ **Constraints**: Check constraints for enums and ranges

### Relationships
- ✅ **Explicit CASCADE**: All foreign keys specify `on delete` behavior
- ✅ **Multi-tenant**: All content tables reference `family_id`
- ✅ **User references**: Point to `profiles(user_id)` not `auth.users`

## Row Level Security (RLS)

### Multi-Tenant Family Model
All tables implement family-based isolation:
```sql
family_id = (select family_id from public.profiles where user_id = auth.uid())
```

### Policy Categories
1. **Family Read**: Members see family-scoped data
2. **Owner Write**: Users modify their own content  
3. **Admin Override**: Family admins can manage certain content
4. **Personal Data**: Users manage only their own (preferences, etc.)

## Assumptions and TODOs

### Assumptions Made
- Auth handled by Supabase auth.users (not custom)
- Single family per user (no multi-family membership)
- Family admin role sufficient for management needs
- English/Arabic bilingual support based on preferences
- Gaming time tracking is minutes-based

### TODO Items
1. **Add constraints**: Consider business rule constraints (e.g., event start < end)
2. **Archive patterns**: Add soft-delete for important historical data
3. **Notification preferences**: May need expansion beyond current muted_categories
4. **File storage**: No file/media columns detected, may need future addition
5. **Audit trail**: Consider adding audit tables for sensitive operations

## Migration Notes

### Safe Operations
- All tables use `if not exists` for idempotent runs
- Triggers use conditional creation pattern
- Policies use `if not exists` where supported

### Deployment Order
1. Extensions
2. Enums  
3. Core tables (families → profiles)
4. Content tables (events, posts, etc.)
5. FamilyBot tables
6. Indexes
7. Triggers
8. Views
9. RLS enablement
10. Policies

### Verification
Schema passes existing verification scripts:
- `scripts/verify-schema.sql` - Table structure validation
- `scripts/verify-rls.sql` - Policy validation