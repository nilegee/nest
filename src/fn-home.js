/**
 * Home/Nest component
 * Main authenticated view with responsive layout and family content
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { getStandardCards } from './cards/nest-cards.js';

export class FnHome extends LitElement {
  static properties = {
    session: { type: Object },
    navExpanded: { type: Boolean },
    completedAction: { type: Boolean },
    feedText: { type: String },
    isMobile: { type: Boolean },
    showInlineCards: { type: Boolean },
    currentRoute: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }
    
    .layout {
      display: grid;
      grid-template-columns: 76px 1fr 320px;
      height: 100vh;
      transition: grid-template-columns 0.3s ease;
    }
    
    .layout.nav-expanded {
      grid-template-columns: 240px 1fr 320px;
    }
    
    @media (max-width: 1023px) {
      .layout {
        grid-template-columns: 60px 1fr;
      }
      
      .layout.nav-expanded {
        grid-template-columns: 60px 1fr;
      }
      
      .sidebar {
        display: none !important;
      }
    }
    
    @media (max-width: 767px) {
      .layout {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr 60px;
      }
      
      .nav {
        order: 2;
        grid-column: 1;
        grid-row: 2;
      }
      
      .main {
        grid-column: 1;
        grid-row: 1;
      }
    }
    
    /* Navigation */
    .nav {
      background: white;
      border-right: 1px solid var(--border);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: hidden;
      z-index: 100;
    }
    
    @media (max-width: 767px) {
      .nav {
        height: 60px;
        border-right: none;
        border-top: 1px solid var(--border);
        position: static;
        overflow: visible;
      }
    }
    
    .nav-header {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    @media (max-width: 767px) {
      .nav-header {
        display: none;
      }
    }
    
    .nav-toggle {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: var(--radius);
    }
    
    .nav-logo {
      font-size: 1.5rem;
      transition: opacity 0.3s;
    }
    
    .nav-logo.expanded {
      opacity: 1;
    }
    
    .nav-logo.collapsed {
      opacity: 0;
    }
    
    .nav-menu {
      padding: 16px 0;
      list-style: none;
      margin: 0;
    }
    
    @media (max-width: 767px) {
      .nav-menu {
        display: flex;
        justify-content: space-around;
        padding: 0;
        height: 60px;
        align-items: center;
      }
    }
    
    .nav-item {
      margin-bottom: 4px;
    }
    
    @media (max-width: 767px) {
      .nav-item {
        margin: 0;
      }
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
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
    }
    
    @media (max-width: 767px) {
      .main {
        padding: 16px;
      }
    }
    
    .greeting-section {
      margin-bottom: 32px;
    }
    
    .greeting {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 8px 0;
    }
    
    @media (max-width: 767px) {
      .greeting {
        font-size: 1.5rem;
      }
    }
    
    .date {
      color: var(--text-light);
      font-size: 1rem;
    }
    
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
      background: var(--success);
    }
    
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
    
    .composer {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 32px;
      border: 1px solid var(--border);
    }
    
    .composer-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .composer-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }
    
    .composer-textarea {
      width: 100%;
      min-height: 100px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-family: inherit;
      font-size: 1rem;
      resize: vertical;
    }
    
    .composer-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
    }
    
    .composer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }
    
    .btn {
      padding: 8px 16px;
      border-radius: var(--radius);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-secondary {
      background: var(--secondary);
      border: 1px solid var(--border);
      color: var(--text);
    }
    
    .btn-primary {
      background: var(--primary);
      border: 1px solid var(--primary);
      color: white;
    }
    
    .btn:hover {
      transform: translateY(-1px);
    }
    
    .feed-placeholder {
      background: white;
      border-radius: var(--radius);
      padding: 48px 24px;
      box-shadow: var(--shadow);
      text-align: center;
      border: 1px solid var(--border);
    }
    
    .feed-placeholder iconify-icon {
      font-size: 3rem;
      color: var(--text-light);
      margin-bottom: 16px;
    }
    
    .feed-placeholder h3 {
      margin: 0 0 8px 0;
      color: var(--text);
    }
    
    .feed-placeholder p {
      margin: 0;
      color: var(--text-light);
    }
    
    /* Route Pages */
    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    
    .page-header iconify-icon {
      font-size: 2rem;
      color: var(--primary);
    }
    
    .page-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
    }
    
    .route-placeholder {
      background: white;
      border-radius: var(--radius);
      padding: 48px 24px;
      text-align: center;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }
    
    .route-placeholder p {
      margin: 0;
      color: var(--text-light);
      font-size: 1.125rem;
    }
    
    /* Sidebar */
    .sidebar {
      background: white;
      border-left: 1px solid var(--border);
      padding: 24px 16px;
    }
    
    .sticky-col {
      position: sticky;
      top: 80px;
      height: calc(100vh - 80px);
      overflow-y: auto;
    }
    
    .sidebar-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 24px 0;
      color: var(--text);
    }
    
    .sidebar-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    /* Mobile & Tablet Inline Cards */
    .mobile-cards {
      display: grid;
      gap: 16px;
      margin-bottom: 32px;
    }
    
    /* Tablet: 2 column grid when space allows */
    @media (min-width: 768px) and (max-width: 1023px) {
      .mobile-cards {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }
    }
    
    /* Mobile: single column */
    @media (max-width: 767px) {
      .mobile-cards {
        grid-template-columns: 1fr;
      }
      
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
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 4px 12px rgb(0 0 0 / 0.25);
        z-index: 100;
      }
    }
  `;

  constructor() {
    super();
    this.navExpanded = false;
    this.completedAction = false;
    this.feedText = '';
    this.isMobile = window.innerWidth <= 767;
    this.showInlineCards = window.innerWidth <= 1023; // Include tablet for inline cards
    this.currentRoute = this.getRouteFromHash() || 'nest';
    
    // Listen for window resize
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 767;
      this.showInlineCards = window.innerWidth <= 1023;
    });
    
    // Listen for hash changes for routing
    window.addEventListener('hashchange', () => {
      this.currentRoute = this.getRouteFromHash() || 'nest';
    });
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
   * Get current date formatted
   */
  getCurrentDate() {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get user's first name
   */
  getUserName() {
    const fullName = this.session?.user?.user_metadata?.full_name || 
                     this.session?.user?.email?.split('@')[0] || 
                     'Family Member';
    return fullName.split(' ')[0];
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
  completeAction() {
    this.completedAction = true;
    
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
   * Handle feed post submission
   */
  handleFeedSubmit() {
    if (this.feedText.trim()) {
      // TODO: Submit to Supabase
      console.log('Feed post:', this.feedText);
      this.feedText = '';
    }
  }

  /**
   * Handle sign out
   */
  async handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
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

  /**
   * Get current route from window location hash
   */
  getRouteFromHash() {
    return window.location.hash.slice(1) || null;
  }

  /**
   * Navigate to a specific route
   */
  navigateToRoute(route) {
    window.location.hash = route;
  }

  /**
   * Handle navigation click
   */
  handleNavClick(e, route) {
    e.preventDefault();
    this.navigateToRoute(route);
  }

  /**
   * Render the main content based on current route
   */
  renderRouteContent() {
    switch (this.currentRoute) {
      case 'feed':
        return this.renderFeedView();
      case 'chores':
        return this.renderChoresView();
      case 'events':
        return this.renderEventsView();
      case 'notes':
        return this.renderNotesView();
      case 'profile':
        return this.renderProfileView();
      case 'insights':
        return this.renderInsightsView();
      case 'nest':
      default:
        return this.renderNestView();
    }
  }

  /**
   * Render Nest (default) view
   */
  renderNestView() {
    return html`
      <!-- Page Title -->
      <fn-page-title></fn-page-title>

      <!-- Mobile/Tablet Cards (shown above feed when no sidebar) -->
      ${this.showInlineCards ? html`
        <div class="mobile-cards">
          ${this.renderCards(false)}
        </div>
      ` : ''}

      <!-- Composer -->
      <div class="composer">
        <div class="composer-header">
          <iconify-icon icon="material-symbols:edit"></iconify-icon>
          <h3 class="composer-title">Share with Family</h3>
        </div>
        <textarea 
          class="composer-textarea"
          placeholder="What's on your mind?"
          .value=${this.feedText}
          @input=${(e) => this.feedText = e.target.value}
        ></textarea>
        <div class="composer-actions">
          <button class="btn btn-secondary" @click=${() => this.feedText = ''}>
            Clear
          </button>
          <button class="btn btn-primary" @click=${this.handleFeedSubmit}>
            Share
          </button>
        </div>
      </div>

      <!-- Feed Placeholder -->
      <div class="feed-placeholder">
        <iconify-icon icon="material-symbols:dynamic-feed"></iconify-icon>
        <h3>Family Feed Coming Soon</h3>
        <p>This is where family updates and shared moments will appear.</p>
      </div>
    `;
  }

  /**
   * Render Feed view
   */
  renderFeedView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:dynamic-feed"></iconify-icon>
        <h1>Family Feed</h1>
      </div>
      <div class="route-placeholder">
        <p>Feed functionality coming soon...</p>
      </div>
    `;
  }

  /**
   * Render Chores view
   */
  renderChoresView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:checklist"></iconify-icon>
        <h1>Family Chores</h1>
      </div>
      <div class="route-placeholder">
        <p>Chores management coming soon...</p>
      </div>
    `;
  }

  /**
   * Render Events view
   */
  renderEventsView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:event"></iconify-icon>
        <h1>Family Events</h1>
      </div>
      <div class="route-placeholder">
        <p>Event management coming soon...</p>
      </div>
    `;
  }

  /**
   * Render Notes view
   */
  renderNotesView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:note"></iconify-icon>
        <h1>Family Notes</h1>
      </div>
      <div class="route-placeholder">
        <p>Notes functionality coming soon...</p>
      </div>
    `;
  }

  /**
   * Render Profile view
   */
  renderProfileView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:person"></iconify-icon>
        <h1>Profile</h1>
      </div>
      <div class="route-placeholder">
        <p>Profile management coming soon...</p>
      </div>
    `;
  }

  /**
   * Render Insights view
   */
  renderInsightsView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:insights"></iconify-icon>
        <h1>Family Insights</h1>
      </div>
      <div class="route-placeholder">
        <p>Insights and analytics coming soon...</p>
      </div>
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
          ${this.renderRouteContent()}
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

        <!-- Mobile Floating Add Button -->
        ${this.isMobile ? html`
          <button class="floating-add" aria-label="Quick add">
            <iconify-icon icon="material-symbols:add"></iconify-icon>
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

customElements.define('fn-home', FnHome);