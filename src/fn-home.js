// @ts-check
/**
 * Home/Nest component
 * Main authenticated view with responsive layout and family content
 * Refactored to use modular router and view architecture
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { showSuccess, showError, showLoading } from './toast-helper.js';
import { FamilyBot } from './fn-family-bot.js';
import { scheduleBirthdaysFor } from './cards/birthdays.js';

// Router and services
import { initRouter, registerRoute, navigate } from './router/router.js';
import * as sessionStore from './services/session-store.js';
import * as db from './services/db.js';

// Import views
import './views/nest-view.js';
import './views/feed-view.js';
import './views/events-view.js';
import './views/goals-view.js';
import './views/chores-view.js';
import './views/notes-view.js';
import './views/profile-view.js';
import './views/insights-view.js';

export class FnHome extends LitElement {
  static properties = {
    session: { type: Object },
    navExpanded: { type: Boolean },
    completedAction: { type: Boolean },
    isMobile: { type: Boolean },
    showInlineCards: { type: Boolean },
    currentRoute: { type: String },
    userProfile: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      --primary: #3b82f6;
      --primary-dark: #2563eb;
      --primary-light: #dbeafe;
      --secondary: #f1f5f9;
      --secondary-dark: #e2e8f0;
      --background: #ffffff;
      --text: #1e293b;
      --muted: #64748b;
      --border: #e2e8f0;
      --radius: 8px;
      --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }
    
    .layout {
      display: grid;
      grid-template-columns: auto 1fr auto;
      height: 100vh;
      background: #f8fafc;
    }
    
    .layout.nav-expanded {
      grid-template-columns: 240px 1fr auto;
    }
    
    @media (max-width: 767px) {
      .layout {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr auto;
      }
      
      .layout.nav-expanded {
        grid-template-columns: 1fr;
      }
    }
    
    @media (min-width: 768px) and (max-width: 1023px) {
      .layout {
        grid-template-columns: 76px 1fr;
      }
      
      .layout.nav-expanded {
        grid-template-columns: 240px 1fr;
      }
    }
    
    /* Navigation Styles */
    .nav {
      background: white;
      border-right: 1px solid var(--border);
      box-shadow: var(--shadow);
      z-index: 100;
      overflow: hidden;
      transition: width 0.3s ease;
      width: 76px;
    }
    
    .layout.nav-expanded .nav {
      width: 240px;
    }
    
    @media (max-width: 767px) {
      .nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        height: 60px;
        border-right: none;
        border-top: 1px solid var(--border);
        z-index: 1000;
      }
    }
    
    .nav-header {
      display: flex;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--border);
      gap: 12px;
    }
    
    .nav-toggle {
      background: none;
      border: none;
      padding: 8px;
      border-radius: var(--radius);
      cursor: pointer;
      color: var(--text);
      transition: background 0.2s;
    }
    
    .nav-toggle:hover {
      background: var(--secondary);
    }
    
    .nav-logo {
      font-weight: 700;
      color: var(--primary);
      white-space: nowrap;
      overflow: hidden;
      transition: opacity 0.3s;
    }
    
    .nav-logo.collapsed {
      opacity: 0;
      width: 0;
    }
    
    .nav-logo.expanded {
      opacity: 1;
    }
    
    .nav-menu {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px;
    }
    
    @media (max-width: 767px) {
      .nav-menu {
        flex-direction: row;
        justify-content: space-around;
        padding: 8px;
        gap: 0;
      }
    }
    
    .nav-item {
      margin: 0;
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      color: var(--text);
      text-decoration: none;
      border-radius: var(--radius);
      margin: 0 8px;
      transition: all 0.2s;
    }
    
    @media (max-width: 767px) {
      .nav-link {
        flex-direction: column;
        gap: 4px;
        padding: 8px;
        margin: 0;
        font-size: 0.75rem;
      }
    }
    
    .nav-link:hover {
      background: var(--secondary);
    }
    
    .nav-link[aria-current="page"] {
      background: var(--primary);
      color: white;
    }
    
    .nav-text {
      transition: opacity 0.3s;
      white-space: nowrap;
    }
    
    .nav-text.expanded {
      opacity: 1;
    }
    
    .nav-text.collapsed {
      opacity: 0;
    }
    
    @media (max-width: 767px) {
      .nav-text {
        opacity: 1;
      }
    }
    
    /* Main Content */
    .main {
      padding: 24px;
      overflow-y: auto;
      background: #f8fafc;
    }
    
    @media (max-width: 767px) {
      .main {
        padding: 16px;
        padding-bottom: 80px; /* Account for mobile nav */
      }
    }
    
    /* Sidebar */
    .sidebar {
      width: 320px;
      background: white;
      border-left: 1px solid var(--border);
      padding: 24px;
      overflow-y: auto;
      box-shadow: var(--shadow);
    }
    
    @media (max-width: 1023px) {
      .sidebar {
        display: none;
      }
    }
    
    .sidebar-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 20px 0;
      color: var(--text);
    }
    
    .sidebar-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    /* Mobile floating button */
    .floating-add {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      z-index: 999;
      transition: all 0.2s;
    }
    
    .floating-add:hover {
      background: var(--primary-dark);
      transform: scale(1.05);
    }
    
    @media (min-width: 768px) {
      .floating-add {
        display: none;
      }
    }
    
    /* Celebration animation */
    .celebration {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 3rem;
      pointer-events: none;
      z-index: 1000;
      opacity: 0;
      animation: celebrate 0.6s ease-out;
    }
    
    @keyframes celebrate {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
    }
    
    /* Action card styles */
    .action-card {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 32px;
      border: 1px solid var(--border);
    }
    
    .action-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .action-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
      color: var(--text);
    }
    
    .action-button {
      background: var(--primary);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.3s;
    }
    
    .action-button:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }
    
    .action-button.completed {
      background: #10b981; /* success green */
    }
    
    .action-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .setup-card {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: var(--radius);
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: var(--shadow);
    }

    .setup-card .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .setup-card .card-header h3 {
      margin: 0;
      color: #92400e;
      font-size: 1.1rem;
    }

    .setup-card .card-icon {
      color: #d97706;
      font-size: 1.25rem;
    }

    .setup-card .card-content p {
      margin: 0 0 16px 0;
      color: #78350f;
      line-height: 1.5;
    }
  `;

  constructor() {
    super();
    this.navExpanded = false;
    this.completedAction = false;
    this.isMobile = window.innerWidth <= 767;
    this.showInlineCards = window.innerWidth <= 1023; // Include tablet for inline cards
    this.currentRoute = this.getRouteFromHash() || 'nest';
    this.userProfile = null;
    
    // Listen for window resize
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 767;
      this.showInlineCards = window.innerWidth <= 1023;
    });
    
    // Listen for auth changes to update session store
    sessionStore.onAuthChange((session) => {
      this.session = session;
      if (session?.user) {
        this.initializeData();
        // FamilyBot initialization is now handled in fn-app.js to prevent duplicates
      }
    });
    
    // Add keyboard navigation support
    window.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  /**
   * Initialize router after component mounts
   */
  firstUpdated() {
    // Wait for session to be established before initializing router
    this.initializeRouterWhenReady();
    
    // Listen for route changes to update nav state
    window.addEventListener('nest:route-changed', (e) => {
      this.currentRoute = e.detail.route;
    });
  }

  /**
   * Initialize router when session is ready
   */
  async initializeRouterWhenReady() {
    // Wait for session to be available
    if (!this.session?.user) {
      await new Promise(resolve => {
        const checkSession = () => {
          if (this.session?.user) {
            resolve();
          } else {
            setTimeout(checkSession, 100);
          }
        };
        checkSession();
      });
    }

    // Initialize router with the main outlet
    const outlet = this.shadowRoot.querySelector('#route-outlet');
    if (outlet) {
      initRouter(outlet);
      
      // Register all routes
      registerRoute('nest', () => html`<nest-view></nest-view>`);
      registerRoute('feed', () => html`<feed-view></feed-view>`);
      registerRoute('events', () => html`<events-view></events-view>`);
      registerRoute('goals', () => html`<goals-view></goals-view>`);
      registerRoute('chores', () => html`<chores-view></chores-view>`);
      registerRoute('notes', () => html`<notes-view></notes-view>`);
      registerRoute('profile', () => html`<profile-view></profile-view>`);
      registerRoute('insights', () => html`<insights-view></insights-view>`);
    }
  }

  /**
   * React to property changes
   */
  updated(changedProperties) {
    if (changedProperties.has('session') && this.session?.user) {
      // Update session store when session changes
      sessionStore.setSession(this.session);
    }
  }

  /**
   * Get greeting based on time of day
   */
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  /**
   * Handle keyboard navigation (accessibility)
   */
  handleKeydown(event) {
    // Handle keyboard activation for navigation links
    if (event.key === 'Enter' || event.key === ' ') {
      const target = event.target.closest('.nav-link');
      if (target) {
        event.preventDefault();
        target.click();
      }
    }
  }

  /**
   * Toggle navigation expanded state
   */
  toggleNav() {
    this.navExpanded = !this.navExpanded;
  }

  /**
   * Complete gentle action with celebration
   */
  async completeAction() {
    this.completedAction = true;
    
    try {
      // Log the action
      const familyId = sessionStore.getFamilyId();
      const user = sessionStore.getUser();
      
      if (familyId && user) {
        await db.insert('acts', {
          family_id: familyId,
          user_id: user.id,
          kind: 'gentle_action',
          points: 1,
          meta: { 
            description: 'Completed gentle action',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      showSuccess('Action completed! ✨');
    } catch (error) {
      console.error('Failed to log action:', error);
    }
    
    // Show celebration animation
    const celebration = this.shadowRoot.querySelector('.celebration');
    if (celebration) {
      celebration.style.display = 'block';
      setTimeout(() => {
        celebration.style.display = 'none';
      }, 600);
    }
    
    // Reset after delay
    setTimeout(() => {
      this.completedAction = false;
    }, 3000);
  }

  /**
   * Handle sign out
   */
  async handleSignOut() {
    try {
      await supabase.auth.signOut();
      sessionStore.clearSession();
    } catch (error) {
      showError('Sign out failed');
    }
  }

  /**
   * Ask FamilyBot for help
   */
  async askFamilyBot() {
    try {
      const user = sessionStore.getUser();
      if (user) {
        const prefs = await FamilyBot.getMemberPrefs(user.id);
        await FamilyBot.promptUserAction(user.id, 'general_help');
      }
    } catch (error) {
      showError('Unable to contact FamilyBot right now');
    }
  }

  /**
   * Initialize data from Supabase
   */
  async initializeData() {
    if (!this.session?.user) return;
    
    try {
      await this.loadUserProfile();
      
      // Schedule birthday reminders for the user
      await scheduleBirthdaysFor(this.session.user.id);
    } catch (error) {
      console.warn('Failed to load family data:', error);
      // Don't show error toast for initialization - profile fallback will handle it
    }
  }

  /**
   * Load current user profile from public.me view
   */
  async loadUserProfile() {
    try {
      const { data, error } = await db.getCurrentUserProfile(supabase, this.session?.user?.id);
      
      if (error) {
        console.warn('Profile loading error:', error);
        // Set a basic profile fallback to prevent UI blocking
        this.userProfile = {
          user_id: this.session?.user?.id,
          full_name: this.session?.user?.email?.split('@')[0] || 'User',
          family_id: null,
          dob: null,
          avatar_url: null
        };
        return;
      }
      
      this.userProfile = data;
      
      // Update session store with profile and family context
      sessionStore.setUserProfile(data);
      if (data?.family_id) {
        sessionStore.setFamilyId(data.family_id);
      } else {
        // Show setup needed indicator if no family
        console.info('User has no family assigned - showing setup helper');
      }
    } catch (error) {
      console.warn('Profile loading failed:', error);
      // Set a basic profile fallback
      this.userProfile = {
        user_id: this.session?.user?.id,
        full_name: this.session?.user?.email?.split('@')[0] || 'User',
        family_id: null,
        dob: null,
        avatar_url: null
      };
    }
  }

  /**
   * Get current route from window location hash
   */
  getRouteFromHash() {
    const hash = window.location.hash.slice(1);
    const [route, queryString] = hash.split('?');
    return route || null;
  }

  /**
   * Handle navigation click
   */
  handleNavClick(e, route) {
    e.preventDefault();
    navigate(route);
  }

  /**
   * Render setup card for users without family
   */
  renderSetupCard() {
    return html`
      <section class="setup-card">
        <div class="card-header">
          <iconify-icon icon="material-symbols:settings-outline" class="card-icon"></iconify-icon>
          <h3>Complete Setup</h3>
        </div>
        <div class="card-content">
          <p>Welcome! To get started with your family nest, you'll need to create or join a family.</p>
          <button class="action-button" @click=${this.createFamily}>
            Create Family
          </button>
        </div>
      </section>
    `;
  }

  /**
   * Create a family for the user
   */
  async createFamily() {
    try {
      const familyName = prompt('Enter a name for your family:', 'My Family');
      if (!familyName) return;

      // Create family
      const { data: family } = await db.insert('families', {
        name: familyName.trim()
      });

      if (family) {
        // Update user's profile with family_id
        await db.update('profiles', 
          { user_id: this.session.user.id },
          { family_id: family.id }
        );

        // Update local state
        this.userProfile = { ...this.userProfile, family_id: family.id };
        sessionStore.setFamilyId(family.id);

        showSuccess('Family created successfully!');
      }
    } catch (error) {
      console.warn('Family creation failed:', error);
      showError('Failed to create family');
    }
  }

  /**
   * Render cards ensuring parity between mobile and desktop layouts
   * Uses the cards utility to maintain consistent card definitions
   * @param {boolean} includeQuickActions - Whether to include Quick Actions card
   * @returns {TemplateResult} LitElement template with cards
   */
  renderCards(includeQuickActions = false) {
    return html`
      ${this.userProfile?.family_id ? '' : this.renderSetupCard()}
      <section aria-labelledby="events-heading">
        <fn-card-events></fn-card-events>
      </section>
      <section aria-labelledby="birthday-heading">
        <fn-card-birthday></fn-card-birthday>
      </section>
      <section aria-labelledby="tip-heading">
        <fn-card-tip></fn-card-tip>
      </section>
      <section aria-labelledby="goal-heading">
        <fn-card-goal></fn-card-goal>
      </section>
      ${includeQuickActions ? html`
        <section aria-labelledby="quick-actions-heading">
          <div class="action-card">
            <div class="action-header">
              <iconify-icon icon="material-symbols:self-improvement"></iconify-icon>
              <h2 class="action-title" id="quick-actions-heading">Quick Actions</h2>
            </div>
            <p>Take a moment to express gratitude to a family member today.</p>
            <button 
              class="action-button ${this.completedAction ? 'completed' : ''}"
              @click=${this.completeAction}
              ?disabled=${this.completedAction}
            >
              ${this.completedAction ? 'Completed! ✨' : 'Mark Complete'}
            </button>
          </div>
        </section>
      ` : ''}
    `;
  }

  render() {
    return html`
      <div class="layout ${this.navExpanded ? 'nav-expanded' : ''}">
        <!-- Navigation -->
        <nav class="nav" role="navigation" aria-label="Main navigation">
          ${!this.isMobile ? html`
            <div class="nav-header">
              <button class="nav-toggle" @click=${this.toggleNav} aria-label="Toggle navigation">
                <iconify-icon icon="material-symbols:menu"></iconify-icon>
              </button>
              <div class="nav-logo ${this.navExpanded ? 'expanded' : 'collapsed'}">🏠 FamilyNest</div>
            </div>
          ` : ''}
          
          <ul class="nav-menu">
            <li class="nav-item">
              <a href="#nest" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'nest')}
                 aria-current=${this.currentRoute === 'nest' ? 'page' : null}>
                <iconify-icon icon="material-symbols:home"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Nest</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#feed" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'feed')}
                 aria-current=${this.currentRoute === 'feed' ? 'page' : null}>
                <iconify-icon icon="material-symbols:dynamic-feed"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Feed</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#chores" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'chores')}
                 aria-current=${this.currentRoute === 'chores' ? 'page' : null}>
                <iconify-icon icon="material-symbols:checklist"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Chores</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#events" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'events')}
                 aria-current=${this.currentRoute === 'events' ? 'page' : null}>
                <iconify-icon icon="material-symbols:event"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Events</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#goals" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'goals')}
                 aria-current=${this.currentRoute === 'goals' ? 'page' : null}>
                <iconify-icon icon="material-symbols:flag"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Goals</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#notes" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'notes')}
                 aria-current=${this.currentRoute === 'notes' ? 'page' : null}>
                <iconify-icon icon="material-symbols:note"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Notes</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#profile" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'profile')}
                 aria-current=${this.currentRoute === 'profile' ? 'page' : null}>
                <iconify-icon icon="material-symbols:person"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Profile</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#insights" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'insights')}
                 aria-current=${this.currentRoute === 'insights' ? 'page' : null}>
                <iconify-icon icon="material-symbols:insights"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Insights</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link" @click=${this.handleSignOut}>
                <iconify-icon icon="material-symbols:logout"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Sign Out</span>
              </a>
            </li>
          </ul>
        </nav>

        <!-- Main Content -->
        <main class="main" role="main">
          <div id="route-outlet"></div>
        </main>

        <!-- Sidebar (Desktop only) -->
        ${!this.showInlineCards ? html`
          <aside class="sidebar sticky-col" role="complementary" aria-label="Family updates">
            <h2 class="sidebar-title">Family Updates</h2>
            <div class="sidebar-cards">
              ${this.renderCards(true)}
            </div>
          </aside>
        ` : ''}

        <!-- Mobile Floating Ask Bot Button -->
        ${this.isMobile && this.currentRoute !== 'landing' ? html`
          <button class="floating-add" aria-label="Ask ${this.userProfile?.bot_name || 'FamilyBot'}" 
                  @click=${this.askFamilyBot}>
            <iconify-icon icon="material-symbols:smart-toy"></iconify-icon>
          </button>
        ` : ''}
      </div>

      <!-- Celebration Animation -->
      <div class="celebration" style="display: none;">
        🎉✨🎊
      </div>
    `;
  }
}

if (!customElements.get('fn-home')) {
  customElements.define('fn-home', FnHome);
}