// @ts-check
/**
 * @fileoverview Nest (Dashboard) View for FamilyNest
 * Default view with family feed composer and cards
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import * as db from '../services/db.js';
import * as ui from '../services/ui.js';
import { getFamilyId, getUserProfile } from '../services/session-store.js';

export class NestView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    
    .mobile-cards {
      margin-bottom: 24px;
    }
    
    @media (max-width: 1023px) {
      .mobile-cards {
        display: block;
      }
    }
    
    @media (min-width: 1024px) {
      .mobile-cards {
        display: none;
      }
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
      color: var(--text);
    }
    
    .composer-textarea {
      width: 100%;
      min-height: 100px;
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-family: inherit;
      font-size: 0.875rem;
      resize: vertical;
      background: var(--background);
      color: var(--text);
    }
    
    .composer-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-light);
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
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    
    .btn-secondary {
      background: var(--secondary);
      color: var(--text);
      border-color: var(--border);
    }
    
    .btn-secondary:hover {
      background: var(--secondary-dark);
    }
    
    .btn-primary {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    
    .btn-primary:hover {
      background: var(--primary-dark);
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .feed-placeholder {
      text-align: center;
      padding: 48px 24px;
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    
    .feed-placeholder iconify-icon {
      font-size: 48px;
      color: var(--muted);
      margin-bottom: 16px;
    }
    
    .feed-placeholder h3 {
      font-size: 1.25rem;
      color: var(--text);
      margin: 0 0 8px 0;
    }
    
    .feed-placeholder p {
      color: var(--muted);
      margin: 0;
    }
  `;

  static properties = {
    feedText: { type: String, state: true },
    loading: { type: Boolean, state: true },
    isMobile: { type: Boolean, state: true },
    showInlineCards: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this.feedText = '';
    this.loading = false;
    this.isMobile = window.innerWidth <= 767;
    this.showInlineCards = window.innerWidth <= 1023;

    // Listen for window resize
    this.handleResize = () => {
      this.isMobile = window.innerWidth <= 767;
      this.showInlineCards = window.innerWidth <= 1023;
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this.handleResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.handleResize);
  }

  /**
   * Handle feed post submission
   */
  async handleFeedSubmit() {
    if (!this.feedText.trim()) return;

    const familyId = getFamilyId();
    const userProfile = getUserProfile();
    
    if (!familyId || !userProfile) {
      ui.toastError('Unable to post: no family context');
      return;
    }

    this.loading = true;
    
    try {
      const { data, error } = await db.insert('posts', {
        family_id: familyId,
        content: this.feedText.trim(),
        author_id: userProfile.id
      });

      if (error) {
        throw error;
      }

      this.feedText = '';
      ui.toastSuccess('Post shared with family!');
      
      // Emit event for other components to react
      this.dispatchEvent(new CustomEvent('nest:post-created', {
        detail: { post: data },
        bubbles: true
      }));
      
    } catch (error) {
      console.error('Failed to create post:', error);
      ui.toastError('Failed to share post');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Clear feed text
   */
  clearFeed() {
    this.feedText = '';
  }

  /**
   * Render cards for mobile/tablet inline display
   */
  renderCards() {
    // Import and render cards from the cards utility
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
    `;
  }

  render() {
    return html`
      <!-- Page Title -->
      <fn-page-title></fn-page-title>

      <!-- Mobile/Tablet Cards (shown above feed when no sidebar) -->
      ${this.showInlineCards ? html`
        <div class="mobile-cards">
          ${this.renderCards()}
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
          <button class="btn btn-secondary" @click=${this.clearFeed}>
            Clear
          </button>
          <button 
            class="btn btn-primary" 
            @click=${this.handleFeedSubmit}
            ?disabled=${this.loading}
          >
            ${this.loading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>

      <!-- Feed Placeholder -->
      <div class="feed-placeholder">
        <iconify-icon icon="material-symbols:dynamic-feed"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Family Feed Coming Soon</h1>
        <p>This is where family updates and shared moments will appear.</p>
      </div>
    `;
  }
}

customElements.define('nest-view', NestView);