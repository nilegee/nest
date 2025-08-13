# FamilyNest Router Documentation

## Overview

FamilyNest uses a simple hash-based router for client-side navigation. The router enables multiple views within the authenticated home component without page reloads.

## Route Structure

The application supports the following routes:

- **`#nest`** (default) - Main dashboard with cards and family feed
- **`#feed`** - Dedicated family feed view with posting interface
- **`#events`** - Event management with create, edit, delete operations
- **`#goals`** - Family goals and acts logging interface
- **`#chores`** - Chore management (placeholder)
- **`#notes`** - Family notes (placeholder)
- **`#profile`** - User profile management (placeholder)
- **`#insights`** - Family activity insights (placeholder)

## Implementation Details

### Route Detection
```javascript
getRouteFromHash() {
  return window.location.hash.replace('#', '') || 'nest';
}
```

### Navigation Handling
- Hash changes trigger route updates automatically
- Focus management moves to main heading on route changes
- Navigation state is preserved during route transitions

### Navigation Components

#### Desktop Navigation
- Collapsible sidebar (76px collapsed, 240px expanded)
- Hover expansion on collapsed state
- Menu toggle button for manual expansion
- Icons with text labels (hidden when collapsed)

#### Mobile Navigation
- Bottom tab bar (60px height)
- Icon-only navigation on mobile
- Hidden sidebar on mobile and tablet views

### Accessibility Features

#### ARIA Support
- `aria-current="page"` on active navigation items
- `role="navigation"` on nav container
- `aria-label="Main navigation"` for screen readers
- Proper semantic landmarks (`<nav>`, `<main>`)

#### Keyboard Navigation
- All navigation items are Tab-accessible
- Enter/Space keys activate navigation links
- Focus management on route changes
- Skip-to-content link for main content access

#### Focus Management
```javascript
setMainFocus() {
  // Use requestAnimationFrame to ensure DOM is updated
  requestAnimationFrame(() => {
    const mainHeading = this.shadowRoot?.querySelector('#main-content');
    if (mainHeading) {
      mainHeading.focus();
      mainHeading.tabIndex = -1; // Remove from tab order after focus
    }
  });
}

navigateToRoute(route) {
  window.location.hash = route;
  this.setMainFocus(); // Set focus to main content when route changes
}
```

**Implementation:**
- Focus moves to main heading (`#main-content`) on route changes
- `tabIndex="-1"` prevents heading from staying in tab order
- `requestAnimationFrame` ensures DOM updates before focus management
- Works with hash changes and programmatic navigation

## Route Registry

### Adding New Routes

1. **Add route case to router:**
```javascript
renderRouteContent() {
  switch (this.currentRoute) {
    case 'new-route':
      return this.renderNewRouteView();
    // ... existing routes
  }
}
```

2. **Create render method:**
```javascript
renderNewRouteView() {
  return html`
    <div class="page-header">
      <iconify-icon icon="material-symbols:icon-name"></iconify-icon>
      <h1 id="main-content" tabindex="-1">Page Title</h1>
    </div>
    <!-- Page content -->
  `;
}
```

3. **Add navigation link:**
```javascript
<li class="nav-item">
  <a href="#new-route" class="nav-link" 
     @click=${(e) => this.handleNavClick(e, 'new-route')}
     aria-current=${this.currentRoute === 'new-route' ? 'page' : null}>
    <iconify-icon icon="material-symbols:icon-name"></iconify-icon>
    <span class="nav-text">Link Text</span>
  </a>
</li>
```

### Route Behavior Guidelines

#### Page Headers
- All routes should include `<h1 id="main-content" tabindex="-1">` for focus management
- Use consistent page header structure with icon and title
- Include descriptive microcopy for placeholder routes

#### Loading States
- Implement loading states for data-dependent routes
- Use consistent loading spinner and messaging patterns
- Handle empty states with helpful messaging

#### Error Handling
- Graceful fallback for invalid routes (defaults to nest)
- Error boundaries for route-specific failures
- Toast notifications for user-facing errors

## Testing Routes

### Manual Testing
1. Navigate to each route via sidebar/bottom nav
2. Test direct URL access with hash fragments
3. Verify browser back/forward button behavior
4. Test keyboard navigation and focus management

### Automated Testing
- Route changes trigger correct view renders
- Navigation state updates properly
- Focus management works on route transitions
- ARIA attributes update correctly

## Performance Considerations

- Routes are rendered on-demand (no preloading)
- Navigation state is lightweight (single string property)
- Focus management uses requestAnimationFrame for smooth transitions
- No network requests on route changes (client-side only)