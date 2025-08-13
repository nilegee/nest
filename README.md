# FamilyNest 🏠

A zero-build static family app built with CDN-only dependencies. Create a private space for your family to connect, share, and stay organized.

## ✨ Features

- **Zero-build setup**: No bundlers, no complex build process
- **Two main views**: Public landing (authentication) and private family home
- **Google OAuth + Magic Link**: Secure authentication with email whitelist
- **Responsive design**: Desktop 3-column, tablet, and mobile layouts
- **Family cards**: Events, birthdays, tips, and goals
- **Real-time updates**: Powered by Supabase
- **Accessibility first**: Semantic HTML, ARIA labels, keyboard navigation
- **Performance optimized**: Lighthouse scores ≥90

## 🚀 Quick Start

### 1. Environment Setup

First, create your environment file:

```bash
# Copy the example and add your Supabase credentials
cp .env.example .env.local
```

Edit `.env.local` with your Supabase project details:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
WHITELISTED_EMAILS=email1@example.com,email2@example.com
```

### 2. Sync Environment Variables

Generate the environment configuration:

```bash
node scripts/sync-env.mjs
```

This creates `web/env.js` with your configuration as an ES module.

### 3. Local Development

Serve the application locally:

```bash
# Using npx (recommended)
npx serve .

# Or using Python
python -m http.server 8000

# Or using Node.js
npx http-server
```

Visit `http://localhost:3000` (or the port shown) to view the app.

## 🔒 Authentication Setup

### OAuth Redirect URL

Configure your Supabase project's OAuth settings:

1. Go to Authentication → Settings in your Supabase dashboard
2. Add your redirect URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

### Email Whitelist

Only emails listed in `WHITELISTED_EMAILS` can access the application. Users with non-whitelisted emails will see a friendly error message and be signed out automatically.

## 📱 Layout & Responsive Design

### Desktop (≥1024px)
- **Left Navigation**: Collapsible sidebar (76px collapsed, 240px expanded)
- **Main Content**: Greeting, action card, composer, feed
- **Right Sidebar**: Family update cards (320px width)

### Tablet (768-1023px)
- **Icon Rail Navigation**: 60px width with icons only
- **Main Content**: Full width with sidebar hidden
- **Cards**: Hidden on tablet view

### Mobile (≤767px)
- **Single Column**: Full-width main content
- **Bottom Navigation**: Tab bar with icons and labels
- **Mobile Cards**: Displayed above feed in main content
- **Floating Action**: Quick add button

## 🎨 Technology Stack

### Core Dependencies (CDN)
- **[Lit 3](https://lit.dev/)**: Web components framework
- **[Supabase JS](https://supabase.com/docs/reference/javascript/)**: Backend-as-a-Service
- **[Iconify](https://iconify.design/)**: Icon system

### Why CDN-Only?
- Zero build complexity
- Fast loading with global CDNs
- No dependency management
- Easy deployment anywhere
- Perfect for small family apps

## 📊 Database Schema

The app uses a minimal Supabase schema with Row Level Security:

- `family_members`: User profiles and family information
- `events`: Family events and activities
- `goals`: Shared family goals with progress tracking
- `posts`: Family feed content
- `chores`: Task management
- `goal_participants`: Goal participation tracking

See `db/schema.sql` for the complete schema and RLS policies.

## 🏗️ File Structure

```
FamilyNest/
├── index.html              # Main HTML shell with CDN imports
├── src/                    # Lit components
│   ├── fn-app.js          # Main app with session management
│   ├── fn-landing.js      # Authentication page
│   ├── fn-home.js         # Private family home
│   ├── fn-card-tip.js     # "Do You Know?" tips
│   ├── fn-card-events.js  # Upcoming events
│   ├── fn-card-birthday.js # Birthday reminders
│   └── fn-card-goal.js    # Family goal progress
├── web/                    # Web assets
│   ├── env.js             # Auto-generated environment config
│   └── supabaseClient.js  # Supabase client setup
├── scripts/                # Build and utility scripts
│   └── sync-env.mjs       # Environment sync script
├── db/                     # Database related files
│   └── schema.sql         # Database schema and RLS
├── docs/                   # Documentation
│   └── QA.md              # Quality assurance checklist
└── README.md              # This file
```

## 🎯 Component Architecture

### Session Management
- `fn-app.js` handles all authentication state
- No localStorage usage - session managed by Supabase
- Automatic whitelist validation
- Graceful error handling

### Responsive Components
- CSS Grid for layout management
- Mobile-first responsive design
- Touch-friendly interactions
- Proper focus management

### Family Cards
- Modular, reusable components
- Sample data with TODO markers for Supabase integration
- Interactive elements (swap tips, add events, etc.)
- Accessible and keyboard navigable

## 🔧 Configuration

### Visibility Rules (Default)
- **Streaks and badges**: Visible by default
- **Exact points**: Hidden until admin toggle exists
- **Family updates**: All visible to family members
- **Personal data**: Private to individual users

### Performance Targets
- **Lighthouse scores**: ≥90 for all categories
- **First Contentful Paint**: <2s
- **Largest Contentful Paint**: <3s
- **Cumulative Layout Shift**: <0.1

## 🎭 Accessibility Features

- **Semantic HTML**: Proper landmarks and heading structure
- **ARIA labels**: Screen reader support
- **Keyboard navigation**: Full keyboard accessibility
- **Focus management**: Visible focus indicators
- **Reduced motion**: Respects `prefers-reduced-motion`
- **Color contrast**: WCAG AA compliance

## 🚀 Deployment

### Static Hosting
Perfect for static hosting platforms:

- **GitHub Pages**: Push to `gh-pages` branch
- **Netlify**: Connect repository for automatic deploys
- **Vercel**: Zero-config deployment
- **Firebase Hosting**: Simple static hosting

### Environment Variables
Remember to:
1. Set up production environment variables
2. Run `node scripts/sync-env.mjs` to generate `web/env.js`
3. Configure OAuth redirect URLs for production domain
4. Test authentication flow with production URLs

### Example Deployment (Netlify)
```bash
# Build command (if needed)
node scripts/sync-env.mjs

# Publish directory
.
```

## 🐛 Debugging

### Common Issues

**Authentication not working:**
- Check OAuth redirect URLs in Supabase
- Verify email is in whitelist
- Check browser console for errors

**Components not loading:**
- Verify CDN links are accessible
- Check for JavaScript console errors
- Ensure ES modules are supported

**Responsive layout issues:**
- Test on actual devices
- Use browser dev tools device emulation
- Check CSS Grid support

## 🤝 Contributing

This is a family app, but improvements are welcome:

1. Follow the existing code style
2. Test on multiple devices and browsers
3. Ensure accessibility compliance
4. Update documentation as needed
5. Run the QA checklist (`docs/QA.md`)

## 📝 License

MIT License - feel free to adapt for your own family needs.

## 💡 Inspiration

Built for families who want a simple, private space to:
- Share daily moments
- Stay organized with events and chores
- Work together on family goals
- Celebrate birthdays and achievements
- Support each other with gentle reminders

---

**Made with ❤️ for families who want to stay connected.**