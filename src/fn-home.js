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
import { ensureFamilyId } from './services/db.js';

// Import views
import './views/nest-view.js';
import './views/plan-view.js';
import './views/journal-view.js';
import './views/profile-view.js';
// Legacy views (kept for embedded use)
import './views/feed-view.js';
import './views/events-view.js';
import './views/goals-view.js';
import './views/chores-view.js';
import './views/notes-view.js';
import './views/insights-view.js';

// Import flags
import { FLAGS } from '../flags.js';

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
    // Initialize router with the main outlet
    const outlet = this.shadowRoot.querySelector('#route-outlet');
    if (outlet) {
      initRouter(outlet);
      
      // Register main routes (new architecture)
      registerRoute('nest', () => this.userProfile ? html`<nest-view></nest-view>` : this.renderSetupCTA());
      registerRoute('plan', () => this.userProfile ? html`<plan-view></plan-view>` : this.renderSetupCTA());
      registerRoute('journal', () => this.userProfile ? html`<journal-view></journal-view>` : this.renderSetupCTA());
      registerRoute('profile', () => html`<profile-view></profile-view>`); // Always allow profile access
      
      // Legacy routes (for embedded components and backward compatibility)
      registerRoute('feed', () => this.userProfile ? html`<feed-view></feed-view>` : this.renderSetupCTA());
      registerRoute('events', () => this.userProfile ? html`<events-view></events-view>` : this.renderSetupCTA());
      registerRoute('goals', () => this.userProfile ? html`<goals-view></goals-view>` : this.renderSetupCTA());
      registerRoute('notes', () => this.userProfile ? html`<notes-view></notes-view>` : this.renderSetupCTA());
      registerRoute('insights', () => this.userProfile ? html`<insights-view></insights-view>` : this.renderSetupCTA());
      
      // Conditional routes based on flags
      if (FLAGS.chores) {
        registerRoute('chores', () => this.userProfile ? html`<chores-view></chores-view>` : this.renderSetupCTA());
      }
    }
    
    // Listen for route changes to update nav state
    window.addEventListener('nest:route-changed', (e) => {
      this.currentRoute = e.detail.route;
    });
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
      
      // Only proceed with family data if we have a profile with family_id
      if (!this.userProfile?.family_id) return;
      
      // Schedule birthday reminders for the user
      await scheduleBirthdaysFor(this.session.user.id);
    } catch (error) {
      showError('Failed to load family data');
    }
  }

  /**
   * Load current user profile from public.me view
   */
  async loadUserProfile() {
    try {
      const { data, error } = await db.getCurrentUserProfile(supabase, this.session?.user?.id);
      
      if (error) {
        console.log('Profile loading failed - likely due to missing migrations or RLS setup');
        // Instead of showing error, set a flag to render "Finish setup" CTA
        this.userProfile = null;
        return;
      }
      
      this.userProfile = data;
      
      // Update session store with profile and family context
      sessionStore.setUserProfile(data);
      if (data?.family_id) {
        sessionStore.setFamilyId(data.family_id);
      }
    } catch (error) {
      console.log('Profile loading failed - likely due to missing migrations or RLS setup');
      // Instead of showing error, set a flag to render "Finish setup" CTA
      this.userProfile = null;
    }
  }

  /**
   * Handle family setup and retry profile loading
   */
  async handleFinishSetup() {
    try {
      showLoading('Setting up family...');
      await ensureFamilyId();
      await this.loadProfile();
      showSuccess('Family setup complete!');
    } catch (error) {
      console.error('Family setup failed:', error);
      showError('Setup failed. Please try again.');
    }
  }

  /**
   * Render "Finish setup" CTA when profile loading fails
   */
  renderSetupCTA() {
    return html`
      <div style="padding: 40px 20px; text-align: center; max-width: 400px; margin: 0 auto;">
        <iconify-icon icon="material-symbols:settings" style="font-size: 48px; color: var(--primary); margin-bottom: 16px;"></iconify-icon>
        <h2 style="margin-bottom: 12px; color: var(--text);">Finish Setup</h2>
        <p style="margin-bottom: 24px; color: var(--text-secondary);">
          Complete your profile setup to access all FamilyNest features.
        </p>
        <button 
          class="btn-primary" 
          @click=${this.handleFinishSetup}
          style="background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: var(--radius, 8px); cursor: pointer;">
          Complete Setup
        </button>
      </div>
    `;
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
   * Render cards ensuring parity between mobile and desktop layouts
   * Uses the cards utility to maintain consistent card definitions
   * @param {boolean} includeQuickActions - Whether to include Quick Actions card
   * @returns {TemplateResult} LitElement template with cards
   */
  renderCards(includeQuickActions = false) {
    return html`
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
              <a href="#plan" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'plan')}
                 aria-current=${this.currentRoute === 'plan' ? 'page' : null}>
                <iconify-icon icon="material-symbols:calendar-month"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Plan</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#journal" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'journal')}
                 aria-current=${this.currentRoute === 'journal' ? 'page' : null}>
                <iconify-icon icon="material-symbols:book"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Journal</span>
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
            ${FLAGS.chores ? html`
              <li class="nav-item">
                <a href="#chores" class="nav-link" 
                   @click=${(e) => this.handleNavClick(e, 'chores')}
                   aria-current=${this.currentRoute === 'chores' ? 'page' : null}>
                  <iconify-icon icon="material-symbols:checklist"></iconify-icon>
                  <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Chores</span>
                </a>
              </li>
            ` : ''}
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