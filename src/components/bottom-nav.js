/**
 * Bottom Navigation Component
 * Mobile-first navigation bar with accessibility support
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class BottomNav extends LitElement {
  static properties = {
    currentView: { type: String }
  };

  static styles = css`
    :host {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: white;
      border-top: 1px solid #e2e8f0;
      box-shadow: 0 -2px 8px 0 rgb(0 0 0 / 0.1);
    }

    .nav-container {
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 8px 0;
      max-width: 100%;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px 12px;
      min-height: 44px;
      min-width: 44px;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      color: #64748b;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-item:hover {
      background: #f8fafc;
    }

    .nav-item.active {
      color: #3b82f6;
      background: #eff6ff;
    }

    .nav-item iconify-icon {
      font-size: 20px;
      margin-bottom: 4px;
    }

    .nav-label {
      font-size: 11px;
      font-weight: 500;
      line-height: 1;
      text-align: center;
    }

    /* Show only on mobile */
    @media (max-width: 767px) {
      :host {
        display: block;
      }
    }

    /* Accessibility */
    .nav-item:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .nav-item {
        transition: none;
      }
    }
  `;

  constructor() {
    super();
    this.currentView = 'dashboard';
  }

  handleNavigation(view, event) {
    event.preventDefault();
    
    if (view === 'profile') {
      // For profile, dispatch show-profile event instead of navigate
      this.dispatchEvent(new CustomEvent('show-profile', {
        detail: { userId: null }, // null means current user profile
        bubbles: true,
        composed: true
      }));
    } else {
      // Dispatch custom navigation event
      this.dispatchEvent(new CustomEvent('navigate', {
        detail: { view },
        bubbles: true,
        composed: true
      }));
    }
  }

  render() {
    const navItems = [
      {
        id: 'dashboard',
        icon: 'mdi:view-dashboard',
        label: 'Dashboard',
        ariaLabel: 'Navigate to Dashboard'
      },
      {
        id: 'events',
        icon: 'mdi:calendar',
        label: 'Events',
        ariaLabel: 'Navigate to Events'
      },
      {
        id: 'feed',
        icon: 'mdi:message',
        label: 'Family Wall',
        ariaLabel: 'Navigate to Family Wall'
      },
      {
        id: 'profile',
        icon: 'mdi:account',
        label: 'Profile',
        ariaLabel: 'Navigate to Profile'
      }
    ];

    return html`
      <nav class="nav-container" role="navigation" aria-label="Main navigation">
        ${navItems.map(item => html`
          <a
            class="nav-item ${this.currentView === item.id ? 'active' : ''}"
            @click=${(e) => this.handleNavigation(item.id, e)}
            role="button"
            tabindex="0"
            aria-label="${item.ariaLabel}"
            @keydown=${(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleNavigation(item.id, e);
              }
            }}
          >
            <iconify-icon icon="${item.icon}" aria-hidden="true"></iconify-icon>
            <span class="nav-label">${item.label}</span>
          </a>
        `)}
      </nav>
    `;
  }
}

if (!customElements.get('bottom-nav')) {
  customElements.define('bottom-nav', BottomNav);
}