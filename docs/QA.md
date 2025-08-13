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
- [ ] **Navigation**
  - [ ] Navigation becomes icon rail (60px width)
  - [ ] Hover/click doesn't expand navigation text

- [ ] **Layout**
  - [ ] Main content takes remaining width
  - [ ] Right sidebar is hidden
  - [ ] Cards are not visible in tablet view

### Mobile (≤767px)
- [ ] **Single Column Layout**
  - [ ] Main content takes full width
  - [ ] Navigation becomes bottom tab bar
  - [ ] Tab bar is 60px height with icons and labels

- [ ] **Mobile-Specific Features**
  - [ ] Cards appear above feed in main content area
  - [ ] Floating + button appears in bottom right
  - [ ] Bottom navigation has all main items

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