/**
 * Page Title Component
 * Reusable web component for page headers with icon, headline, sub-text, and emphasis
 * Features: Iconify icons, accessibility, reduced-motion support, semantic HTML
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class FnPageTitle extends LitElement {
  static properties = {
    icon: { type: String },
    headline: { type: String },
    sub: { type: String },
    emphasis: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      margin-bottom: 2rem;
    }
    
    .page-title {
      text-align: left;
      position: relative;
    }
    
    .page-title.emphasis {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-size: 200% 200%;
      animation: gradientShift 3s ease-in-out infinite;
    }
    
    /* Respect reduced motion preference */
    @media (prefers-reduced-motion: reduce) {
      .page-title.emphasis {
        animation: none;
        background: var(--primary);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
    
    @keyframes gradientShift {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }
    
    .title-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    
    .title-icon {
      color: var(--primary);
      font-size: 2rem;
      flex-shrink: 0;
    }
    
    .title-icon:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      border-radius: 4px;
    }
    
    .headline {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.2;
      color: var(--text);
    }
    
    .sub-text {
      margin: 0;
      font-size: 1rem;
      color: var(--text-light);
      line-height: 1.4;
    }
    
    /* Responsive adjustments */
    @media (max-width: 767px) {
      .headline {
        font-size: 1.75rem;
      }
      
      .title-icon {
        font-size: 1.75rem;
      }
      
      .title-wrapper {
        gap: 0.5rem;
      }
    }
    
    /* High contrast support */
    @media (prefers-contrast: high) {
      .title-icon {
        color: var(--text);
      }
      
      .page-title.emphasis {
        background: none;
        -webkit-text-fill-color: inherit;
        color: var(--text);
      }
    }
  `;

  constructor() {
    super();
    
    // Default values with type guards
    this.icon = 'mdi:home-heart';
    this.headline = this.getDefaultHeadline();
    this.sub = this.getDefaultSubText();
    this.emphasis = false;
  }

  /**
   * Get smart greeting with first name
   * @returns {string} Formatted greeting
   */
  getDefaultHeadline() {
    try {
      const hour = new Date().getHours();
      let greeting = 'Good morning';
      if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
      else if (hour >= 17) greeting = 'Good evening';
      
      // Try to get user name from session context or default
      const userName = this.getUserName();
      return `${greeting}, ${userName}!`;
    } catch (error) {
      console.warn('Failed to generate default headline:', error);
      return 'Welcome to FamilyNest!';
    }
  }

  /**
   * Get formatted current date
   * @returns {string} Formatted date string
   */
  getDefaultSubText() {
    try {
      return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Failed to generate default sub text:', error);
      return new Date().toLocaleDateString();
    }
  }

  /**
   * Get user's first name with null checks
   * @returns {string} User's first name or fallback
   */
  getUserName() {
    try {
      // Try to access session from parent context
      const app = document.querySelector('fn-app');
      const session = app?.session;
      
      if (session?.user?.user_metadata?.full_name) {
        return session.user.user_metadata.full_name.split(' ')[0];
      }
      
      if (session?.user?.email) {
        return session.user.email.split('@')[0];
      }
      
      return 'Family Member';
    } catch (error) {
      console.warn('Failed to get user name:', error);
      return 'Family Member';
    }
  }

  /**
   * Update headline and sub-text with current data
   */
  updateDefaults() {
    if (!this.hasAttribute('headline')) {
      this.headline = this.getDefaultHeadline();
    }
    if (!this.hasAttribute('sub')) {
      this.sub = this.getDefaultSubText();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Update defaults when component connects
    this.updateDefaults();
    
    // Set document title if not already set
    if (document.title === 'FamilyNest') {
      document.title = 'FamilyNest — Little moments, big love.';
    }
  }

  render() {
    // Type guards and sanitization
    const safeIcon = typeof this.icon === 'string' ? this.icon : 'mdi:home-heart';
    const safeHeadline = typeof this.headline === 'string' ? this.headline : '';
    const safeSub = typeof this.sub === 'string' ? this.sub : '';
    const safeEmphasis = Boolean(this.emphasis);

    return html`
      <header class="page-title ${safeEmphasis ? 'emphasis' : ''}" role="banner">
        <div class="title-wrapper">
          <iconify-icon 
            icon="${safeIcon}"
            class="title-icon"
            aria-hidden="true"
          ></iconify-icon>
          <h1 class="headline" aria-label="${safeHeadline}">
            ${safeHeadline}
          </h1>
        </div>
        ${safeSub ? html`
          <p class="sub-text">${safeSub}</p>
        ` : ''}
      </header>
    `;
  }
}

customElements.define('fn-page-title', FnPageTitle);