/**
 * Home/Nest component
 * Minimal authenticated view with simple dashboard
 * Now includes navigation and routing to new Phase 1 views
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { ensureUserProfile } from './utils/profile-utils.js';

// Import Phase 1 components
import './views/events-view.js';
import './views/feed-view.js';
import './components/profile-overlay.js';
import './components/bottom-nav.js';
import './cards/islamic-guidance-card.js';
import './cards/upcoming-events-card.js';

export class FnHome extends LitElement {
  static properties = {
    session: { type: Object },
    userProfile: { type: Object },
    currentView: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: #f8fafc;
      --primary: #3b82f6;
      --text: #1e293b;
      --muted: #64748b;
      --border: #e2e8f0;
      --radius: 8px;
      --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }
    
    .app-layout {
      display: flex;
      min-height: 100vh;
    }
    
    .sidebar {
      width: 240px;
      background: white;
      border-right: 1px solid var(--border);
      padding: 20px;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
    }
    
    .main-content {
      flex: 1;
      margin-left: 240px;
      padding: 20px;
      padding-bottom: 20px; /* Default for desktop */
    }

    /* Mobile responsive styles */
    @media (max-width: 767px) {
      .sidebar {
        display: none;
      }

      .main-content {
        margin-left: 0;
        padding-bottom: 80px; /* Space for bottom navigation */
      }
      
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      
      .guidance-section {
        grid-column: span 1;
      }
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      margin-bottom: 4px;
      border-radius: var(--radius);
      cursor: pointer;
      color: var(--text);
      text-decoration: none;
      font-size: 14px;
      transition: background-color 0.2s ease;
    }
    
    .nav-item:hover {
      background: #f8fafc;
    }
    
    .nav-item.active {
      background: var(--primary);
      color: white;
    }
    
    .nav-item iconify-icon {
      font-size: 18px;
    }
    
    .sidebar-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    
    .app-title {
      font-size: 1.25rem;
      font-weight: bold;
      color: var(--text);
      margin-bottom: 4px;
    }
    
    .app-subtitle {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .header {
      margin-bottom: 40px;
      text-align: center;
    }
    
    .greeting {
      font-size: 2rem;
      font-weight: bold;
      color: var(--text);
      margin-bottom: 8px;
    }
    
    .subtitle {
      color: var(--muted);
      font-size: 1.1rem;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .guidance-section {
      grid-column: span 2;
      margin-bottom: 32px;
    }
    
    .events-section {
      grid-column: span 2;
      margin-bottom: 32px;
    }
    
    .quick-link-card {
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 24px;
      border: 1px solid var(--border);
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .quick-link-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.15);
    }
    
    .card-icon {
      font-size: 3rem;
      color: var(--primary);
      margin-bottom: 16px;
    }
    
    .card-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 8px;
    }
    
    .card-description {
      color: var(--muted);
      margin-bottom: 20px;
    }
    
    .sign-out-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 8px 16px;
      color: var(--text);
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: var(--shadow);
      z-index: 1000;
    }
    
    .sign-out-button:hover {
      background: #f8fafc;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .nav-item,
      .quick-link-card {
        transition: none;
      }
    }
  `;
  constructor() {
    super();
    this.userProfile = null;
    this.currentView = 'dashboard'; // Default view
    
    // Listen for hash changes for navigation
    window.addEventListener('hashchange', () => {
      this.updateCurrentView();
    });
    
    // Listen for profile overlay events
    this.addEventListener('show-profile', this.handleShowProfile.bind(this));
    
    // Listen for bottom navigation events
    this.addEventListener('navigate', this.handleBottomNavigation.bind(this));
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this.session?.user) {
      await this.loadUserProfile();
    }
    this.updateCurrentView();
  }

  /**
   * Update current view based on URL hash
   */
  updateCurrentView() {
    const hash = window.location.hash.slice(1); // Remove #
    this.currentView = hash || 'dashboard';
  }

  /**
   * Navigate to a specific view
   */
  navigateTo(view) {
    window.location.hash = view;
  }

  /**
   * Handle profile overlay display
   */
  handleShowProfile(event) {
    const overlay = this.shadowRoot.querySelector('profile-overlay');
    if (overlay) {
      overlay.show(event.detail.userId);
    }
  }

  /**
   * Handle bottom navigation events
   */
  handleBottomNavigation(event) {
    const view = event.detail.view;
    this.navigateTo(view);
  }

  /**
   * Load user profile from Supabase
   */
  async loadUserProfile() {
    if (!this.session?.user?.id) return;
    
    try {
      // Use utility to ensure profile exists
      const profile = await ensureUserProfile(
        this.session.user.id,
        this.session.user.email,
        this.session.user.user_metadata
      );
      
      if (profile) {
        this.userProfile = profile;
      } else {
        this.userProfile = null;
      }
    } catch (error) {
      this.userProfile = null;
    }
  }

  /**
   * Handle sign out
   */
  async handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Silent sign out error handling
    }
  }

  render() {
    if (!this.session?.user) {
      return html`<div>Loading...</div>`;
    }

    const userName = this.userProfile?.full_name || this.session.user.email?.split('@')[0] || 'there';

    return html`
      <button class="sign-out-button" @click=${this.handleSignOut}>
        <iconify-icon icon="material-symbols:logout"></iconify-icon>
        Sign Out
      </button>
      
      <div class="app-layout">
        <nav class="sidebar">
          <div class="sidebar-header">
            <div class="app-title">🏠 Family Nest</div>
            <div class="app-subtitle">Phase 1</div>
          </div>
          
          <a class="nav-item ${this.currentView === 'dashboard' ? 'active' : ''}" 
             @click=${() => this.navigateTo('dashboard')}>
            <iconify-icon icon="material-symbols:dashboard"></iconify-icon>
            Dashboard
          </a>
          
          <a class="nav-item ${this.currentView === 'events' ? 'active' : ''}" 
             @click=${() => this.navigateTo('events')}>
            <iconify-icon icon="material-symbols:event"></iconify-icon>
            Events
          </a>
          
          <a class="nav-item ${this.currentView === 'feed' ? 'active' : ''}" 
             @click=${() => this.navigateTo('feed')}>
            <iconify-icon icon="material-symbols:forum"></iconify-icon>
            Family Wall
          </a>
        </nav>
        
        <main class="main-content">
          ${this.renderCurrentView(userName)}
        </main>
      </div>
      
      <!-- Bottom Navigation for Mobile -->
      <bottom-nav .currentView=${this.currentView}></bottom-nav>
      
      <!-- Profile Overlay -->
      <profile-overlay></profile-overlay>
    `;
  }

  renderCurrentView(userName) {
    switch (this.currentView) {
      case 'events':
        return html`<events-view></events-view>`;
      
      case 'feed':
        return html`<feed-view></feed-view>`;
        
      case 'dashboard':
      default:
        return html`
          <div class="container">
            <div class="header">
              <h1 class="greeting">Welcome ${userName}!</h1>
              <p class="subtitle">Your family dashboard is ready</p>
            </div>
            
            <div class="guidance-section">
              <islamic-guidance-card></islamic-guidance-card>
            </div>
            
            <div class="events-section">
              <upcoming-events-card></upcoming-events-card>
            </div>
            
            <div class="dashboard-grid">
              <div class="quick-link-card" @click=${() => this.navigateTo('events')}>
                <iconify-icon icon="material-symbols:event-add" class="card-icon"></iconify-icon>
                <h2 class="card-title">Family Events</h2>
                <p class="card-description">
                  Manage important family events, celebrations, and milestones.
                </p>
              </div>
              
              <div class="quick-link-card" @click=${() => this.navigateTo('feed')}>
                <iconify-icon icon="material-symbols:forum" class="card-icon"></iconify-icon>
                <h2 class="card-title">Family Wall</h2>
                <p class="card-description">
                  Share moments and stay connected with your family.
                </p>
              </div>
            </div>
          </div>
        `;
    }
  }
}

if (!customElements.get('fn-home')) {
  customElements.define('fn-home', FnHome);
}