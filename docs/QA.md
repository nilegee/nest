# FamilyNest QA Checklist

## Authentication Flow
- [ ] **Login with Google OAuth**
  - [ ] Click "Continue with Google" button
  - [ ] Redirects to Google OAuth consent screen with correct redirect URL
  - [ ] After authorization, redirects back to application (no blank page)
  - [ ] Console shows: "OAuth redirect URL: [correct URL for environment]"
  - [ ] User session is established and home view loads
  - [ ] OAuth callback URL fragments are cleaned up from address bar

- [ ] **OAuth Environment Handling**
  - [ ] Local development: redirects to `http://localhost:3000`
  - [ ] GitHub Pages: redirects to `https://nilegee.github.io/nest/`
  - [ ] Console logs show correct redirect URL for current environment
  - [ ] No "blank page" issues after OAuth redirect

- [ ] **OAuth Error Handling**
  - [ ] Navigate to `?error=access_denied&error_description=Test%20error`
  - [ ] Should display error message: "Authentication failed: Test error"
  - [ ] Should not show loading spinner indefinitely
  - [ ] Should allow retry of authentication

- [ ] **Magic Link Authentication**
  - [ ] Enter email address in magic link form
  - [ ] Click "Send Magic Link" button
  - [ ] Confirmation message appears
  - [ ] Check email for magic link
  - [ ] Click magic link in email
  - [ ] Redirects to application with authenticated session

- [ ] **Email Whitelist Validation**
  - [ ] Attempt login with non-whitelisted email
  - [ ] Error message displays: "Sorry, access is limited to family members only"
  - [ ] User is automatically signed out
  - [ ] Returns to landing page
  - [ ] Try again with whitelisted email (yazidgeemail@gmail.com, yahyageemail@gmail.com, abdessamia.mariem@gmail.com, nilezat@gmail.com)
  - [ ] Login succeeds and home view loads

- [ ] **Session Management**
  - [ ] Refresh page while authenticated - session persists within browser tab
  - [ ] Close and reopen browser tab - requires re-authentication (uses sessionStorage)
  - [ ] Sign out clears session and returns to landing page
  - [ ] Verify sessionStorage contains auth data when logged in
  - [ ] Verify localStorage remains empty (no permanent session storage)
  - [ ] Session cleanup works properly on sign out

## Layout and Responsiveness

### Desktop (≥1024px)
- [ ] **Navigation Sidebar**
  - [ ] Starts collapsed at 76px width with icons only
  - [ ] Hover expands to 240px showing text labels
  - [ ] Click menu toggle expands/collapses navigation
  - [ ] Navigation is sticky and doesn't scroll with content
  - [ ] All navigation items visible: Nest, Feed, Chores, Events, Notes, Profile, Insights

- [ ] **Main Content Area**
  - [ ] Greeting displays with user's name and current date
  - [ ] "One Gentle Action" card displays with completion button
  - [ ] Clicking complete shows celebration animation (≤600ms)
  - [ ] Composer textarea allows text input
  - [ ] Feed placeholder displays correctly

- [ ] **Right Sidebar**
  - [ ] Fixed width of 320px
  - [ ] Sticky positioning - doesn't scroll with main content
  - [ ] Contains stacked cards: Events, Birthday, Tip, Goal
  - [ ] All cards display sample data properly

### Tablet (768-1023px)
- [x] **Navigation** 
  - [x] Navigation becomes icon rail (60px width)
  - [x] Hover/click doesn't expand navigation text

- [x] **Layout**
  - [x] Main content takes remaining width
  - [x] Right sidebar is hidden
  - [x] Cards are now visible in tablet view (FIXED - showing inline like mobile)

### Mobile (≤767px)
- [x] **Single Column Layout**
  - [x] Main content takes full width
  - [x] Navigation becomes bottom tab bar
  - [x] Tab bar is 60px height with icons and labels

- [x] **Mobile-Specific Features**
  - [x] Cards appear above feed in main content area
  - [x] Floating + button appears in bottom right
  - [x] Bottom navigation has all main items
  - [x] Sign-out button now available in mobile navigation (FIXED)

- [ ] **Bottom Tab Navigation**
  - [ ] All navigation items present with Iconify icons
  - [ ] Icons are clearly visible and properly sized
  - [ ] Text labels are readable

## User Interface Components

### Cards Functionality
- [ ] **Events Card**
  - [ ] Shows upcoming events with dates
  - [ ] Event dates formatted correctly
  - [ ] "Add Event" button is functional
  - [ ] Shows "No upcoming events" when empty

- [ ] **Birthday Card**
  - [ ] Shows upcoming birthdays with countdown
  - [ ] Birthday dates calculated correctly
  - [ ] Animation plays for birthdays today (if any)
  - [ ] "Add Birthday" button is functional

- [ ] **Tip Card**
  - [ ] Shows "Do You Know?" tip with content
  - [ ] "Swap" button cycles through tips
  - [ ] "Got it" button dismisses tip with confirmation
  - [ ] "Show More Tips" restores tip view

- [ ] **Goal Card**
  - [ ] Progress bar shows correct percentage
  - [ ] Statistics display properly
  - [ ] Details toggle shows/hides additional info
  - [ ] "Contribute" and "View Full" buttons are functional

### Enhanced Data Loading (New)
- [ ] **Loading States**
  - [ ] All data panels show loading spinners while fetching data
  - [ ] Consistent loading indicators across Feed, Events, Birthdays, Goals
  - [ ] Loading text shows appropriate context ("Loading posts...", "Loading events...")
  - [ ] No flickering or layout shifts during loading

- [ ] **Empty States**
  - [ ] Feed shows "No posts yet. Be the first to share!" when empty
  - [ ] Events shows "No upcoming events. Create the first event!" when empty
  - [ ] Acts/Goals shows "No acts recorded yet. Start logging!" when empty
  - [ ] All empty states include helpful icons and encouraging messaging

- [ ] **Toast Notifications**
  - [ ] Success messages appear for successful operations (create, update, delete)
  - [ ] Error messages appear for failed operations with helpful text
  - [ ] Loading toasts show progress and update to success/error states
  - [ ] Toast notifications are dismissible and auto-remove after appropriate time

### Modular Components (New)
- [ ] **Page Title Component**
  - [ ] fn-page-title displays with home icon and smart greeting
  - [ ] Shows current date as subtitle
  - [ ] Document title updates to "FamilyNest — Little moments, big love."
  - [ ] Respects prefers-reduced-motion (no gradient animation if reduced motion)
  - [ ] Proper semantic HTML with h1 for headline, p for subtitle

- [ ] **Card Parity & Reuse**
  - [ ] Desktop sidebar shows 5 cards: Events, Birthdays, Tips, Goal, Quick Actions
  - [ ] Mobile shows 4 cards inline (Events, Birthdays, Tips, Goal)
  - [ ] Quick Actions card appears in desktop sidebar only
  - [ ] All cards use identical markup between layouts
  - [ ] Cards wrapped in semantic <section> elements with aria-labelledby

- [ ] **Sticky Positioning**
  - [ ] Desktop sidebar uses .sticky-col class
  - [ ] Sidebar sticks at top: 80px when scrolling
  - [ ] Height adjusted to calc(100vh - 80px)
  - [ ] No layout thrash during scroll

- [ ] **Framework-agnostic Utility**
  - [ ] renderNestCards() function exists and returns DocumentFragment
  - [ ] registerNestCard() function exists for extensibility
  - [ ] hasNestCards() and countNestCards() utility functions work
  - [ ] Cards utility can be imported and used independently

### Actions and Interactions
- [ ] **Gentle Action Completion**
  - [ ] Button changes text to "Completed! ✨"
  - [ ] Celebration animation appears (confetti/emojis)
  - [ ] Button is disabled after completion
  - [ ] Action resets after 3 seconds

- [ ] **Feed Composer**
  - [ ] Textarea accepts text input
  - [ ] "Clear" button empties textarea
  - [ ] "Share" button processes input (logs to console)
  - [ ] Placeholder text displays when empty

## Accessibility
- [ ] **Semantic HTML**
  - [ ] Proper landmarks: `<nav>`, `<main>`, `<aside>`
  - [ ] Headings follow logical hierarchy (h1, h2, h3)
  - [ ] Lists use proper `<ul>` and `<li>` elements

- [ ] **Focus Management**
  - [ ] All interactive elements are keyboard accessible
  - [ ] Focus rings are visible on all focusable elements
  - [ ] Tab order is logical and intuitive

- [ ] **ARIA Labels**
  - [ ] Current page has `aria-current="page"`
  - [ ] Navigation has proper `aria-label`
  - [ ] Buttons have descriptive labels or `aria-label`
  - [ ] Toggle buttons indicate state

- [ ] **Screen Reader Support**
  - [ ] All images have appropriate alt text
  - [ ] Iconify icons don't interfere with screen readers
  - [ ] Form inputs have associated labels

## Enhanced Features (Latest Update)

### Accessibility Improvements
- [ ] **Skip to Content**
  - [ ] Skip link appears at top of page and is hidden until focused
  - [ ] Tab key makes skip link visible at top-left
  - [ ] Clicking skip link focuses main content heading
  - [ ] Skip link works on all routes/pages

- [ ] **Keyboard Navigation**
  - [ ] All navigation links are reachable with Tab key
  - [ ] Enter or Space key activates navigation links
  - [ ] Focus management moves to main heading on route changes
  - [ ] Visible focus indicators on all interactive elements

- [ ] **ARIA & Semantic Structure**
  - [ ] Main content has id="main-content" for skip link target
  - [ ] All page headings have proper hierarchy (h1, h2, h3)
  - [ ] Navigation has aria-current="page" for current route
  - [ ] Button elements have descriptive aria-label attributes

### Events CRUD Operations
- [ ] **Event Creation**
  - [ ] Form accepts title, date/time, and optional location
  - [ ] Date validation prevents past dates (except same day)
  - [ ] Shows loading state during creation ("Creating...")
  - [ ] Success toast appears on successful creation
  - [ ] Form clears after successful creation
  - [ ] Error messages appear for validation failures

- [ ] **Event Editing**
  - [ ] Edit button appears on each event card
  - [ ] Clicking edit populates form with current event data
  - [ ] Form title changes to "Edit Event" during editing
  - [ ] Cancel button appears to exit edit mode
  - [ ] Update button changes to "Update Event" during editing
  - [ ] Success toast appears on successful update
  - [ ] Smooth scroll to form when editing begins

- [ ] **Event Deletion**
  - [ ] Delete button appears on each event card with red styling
  - [ ] Confirmation dialog appears before deletion
  - [ ] Dialog shows event title and warns action cannot be undone
  - [ ] Event is removed from list after successful deletion
  - [ ] Success toast appears on successful deletion

### Goals & Acts Management
- [ ] **Acts Creation**
  - [ ] Form accepts description, points (1-10), and category
  - [ ] All fields are required with appropriate validation
  - [ ] Category dropdown includes: Kindness, Helping, Chore, Learning, etc.
  - [ ] Points field defaults to 1 and validates numeric input
  - [ ] Success toast appears on successful logging
  - [ ] Form clears after successful submission

- [ ] **Goal Progress**
  - [ ] Current goal displays with progress bar
  - [ ] Progress bar shows percentage completion
  - [ ] Progress text shows "current/target points"
  - [ ] Goal automatically updates when new acts are added
  - [ ] Shows encouraging empty state when no goal exists

- [ ] **Acts List**
  - [ ] Recent acts display in chronological order (newest first)
  - [ ] Each act shows description, author, date, and points
  - [ ] Points are displayed as badges with primary color
  - [ ] List limits to 10 most recent acts
  - [ ] Shows helpful empty state when no acts exist

## New Features (December 2024)

### Hash-Based Router
- [x] **Navigation Routes**
  - [x] Nest (default) - shows cards and composer
  - [x] Feed - dedicated feed view with posts
  - [x] Chores - placeholder view
  - [x] Events - event management with creation form
  - [x] Notes - placeholder view  
  - [x] Profile - placeholder view
  - [x] Insights - placeholder view

- [x] **Route Features**
  - [x] URL hash updates when navigating (e.g., #feed, #events)
  - [x] aria-current="page" indicates active route
  - [x] Real navigation links (no more href="#" placeholders)
  - [x] Back/forward browser navigation works

### Supabase Integration
- [x] **User Profile**
  - [x] Loads current user via public.me view
  - [x] Respects family_id for RLS filtering
  - [x] Handles family membership properly

- [x] **Feed Posts** 
  - [x] Create posts via composer (family scoped)
  - [x] Display posts with author names and timestamps
  - [x] Posts persist and display after page refresh
  - [x] Proper RLS filtering by family_id

- [x] **Events Management**
  - [x] Create events with title, date, and optional location
  - [x] Display upcoming events sorted by date
  - [x] Event creation form with validation
  - [x] Events scoped to user's family

- [x] **Birthdays**
  - [x] Load birthdays from profiles table
  - [x] Calculate upcoming birthdays with age/countdown
  - [x] Replace hardcoded sample data with real data
  - [x] Proper date calculations and formatting

- [x] **Goals & Acts**
  - [x] Track family acts (kindness, gentle actions)
  - [x] Generate monthly goals based on acts
  - [x] Progress tracking with points system
  - [x] Completing gentle action creates act record

## Performance and Technical

### Browser Compatibility
- [ ] **Chrome/Chromium**
  - [ ] All features work properly
  - [ ] No console errors
  - [ ] Animations smooth

- [ ] **Firefox**
  - [ ] All features work properly
  - [ ] No console errors
  - [ ] Iconify icons load correctly

- [ ] **Safari**
  - [ ] All features work properly
  - [ ] ES modules load correctly
  - [ ] CDN dependencies work

### Performance
- [ ] **Lighthouse Scores ≥90**
  - [ ] Performance: ≥90
  - [ ] Accessibility: ≥90
  - [ ] Best Practices: ≥90
  - [ ] SEO: ≥90

- [ ] **Loading Performance**
  - [ ] Initial page load is fast
  - [ ] CDN resources load quickly
  - [ ] No render-blocking resources

- [ ] **Runtime Performance**
  - [ ] Smooth animations and transitions
  - [ ] No memory leaks
  - [ ] Responsive interactions

### Error Handling
- [ ] **Network Errors**
  - [ ] Graceful handling of Supabase connection issues
  - [ ] Error messages are user-friendly
  - [ ] Retry mechanisms work

- [ ] **Authentication Errors**
  - [ ] OAuth failures show helpful messages
  - [ ] Magic link errors are handled gracefully
  - [ ] Session timeouts redirect appropriately

## Motion and Animation
- [ ] **Reduced Motion Respect**
  - [ ] Set `prefers-reduced-motion: reduce` in browser/OS
  - [ ] Animations are disabled or significantly reduced
  - [ ] Essential animations (like focus indicators) still work
  - [ ] Page remains fully functional

- [ ] **Animation Quality**
  - [ ] Celebration animation is smooth and brief (≤600ms)
  - [ ] Navigation expand/collapse is smooth
  - [ ] Hover effects provide good feedback
  - [ ] No janky or stuttering animations

## Data and Storage
- [ ] **No localStorage Usage**
  - [ ] Check browser dev tools Application tab
  - [ ] localStorage should be empty or only contain non-app data
  - [ ] All session data managed by Supabase auth

- [ ] **Environment Configuration**
  - [ ] `node scripts/sync-env.mjs` generates correct `web/env.js`
  - [ ] Environment variables are properly exported
  - [ ] Supabase client connects successfully

## Console Cleanliness
- [ ] **Zero Console Errors**
  - [ ] No JavaScript errors in browser console
  - [ ] No 404 errors for resources
  - [ ] No CORS errors
  - [ ] Only expected informational logs

- [ ] **Database Error Resolution (Fixed)**
  - [x] Fixed 403 Forbidden errors on `me` view access (added proper RLS policies)
  - [x] Fixed 400 Bad Request errors on profiles table (added missing `dob` column)
  - [x] Fixed 403 Forbidden errors on nudges table (added INSERT policy for FamilyBot)
  - [x] Fixed missing family member access to profiles (added family-scoped RLS policy)
  - [x] All database migrations are properly applied and idempotent

- [ ] **Production Console Cleanliness**
  - [ ] In production build: zero info/warn logs; only real errors

- [ ] **Network Tab**
  - [ ] All CDN resources load successfully (Lit, Supabase JS, Iconify)
  - [ ] No failed requests
  - [ ] Reasonable load times for all resources

## Edge Cases
- [ ] **Empty States**
  - [ ] Feed placeholder shows when no posts
  - [ ] Event card shows "No upcoming events"
  - [ ] All cards handle empty data gracefully

- [ ] **Error Recovery**
  - [ ] Network errors don't break the app
  - [ ] Authentication errors allow retry
  - [ ] Component errors are contained

- [ ] **Boundary Testing**
  - [ ] Very long text in composer
  - [ ] Many events/birthdays in cards
  - [ ] Rapid clicking on action buttons