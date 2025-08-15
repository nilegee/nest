// @ts-check
/**
 * @fileoverview Journal View for FamilyNest
 * Merged view combining family feed and personal notes
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { on } from '../services/event-bus.js';
import { getState } from '../services/context-store.js';

export class JournalView extends LitElement {
  static properties = {
    loading: { type: Boolean },
    activeTab: { type: String }
  };

  static styles = css`
    :host {
      display: block;
    }
    
    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
    }
    
    .page-header iconify-icon {
      font-size: 2rem;
      color: var(--primary);
    }
    
    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      color: var(--text);
    }

    .journal-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }

    .tab-button {
      background: none;
      border: none;
      padding: 12px 20px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-muted);
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab-button:hover {
      color: var(--text);
      background: var(--secondary);
    }

    .tab-button.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    .tab-content {
      min-height: 400px;
    }

    .journal-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    @media (min-width: 1024px) {
      .journal-grid {
        grid-template-columns: 1fr 300px;
      }
    }

    .main-content {
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      overflow: hidden;
    }

    .sidebar-content {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .sidebar-header h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      color: var(--text);
    }

    .sidebar-header iconify-icon {
      font-size: 1.25rem;
      color: var(--primary);
    }

    .quick-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--secondary);
      border-radius: var(--radius);
      font-size: 0.875rem;
    }

    .stat-value {
      font-weight: 600;
      color: var(--primary);
    }

    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 4px;
      height: 20px;
      margin-bottom: 12px;
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (max-width: 767px) {
      .journal-tabs {
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .journal-tabs::-webkit-scrollbar {
        display: none;
      }

      .tab-button {
        white-space: nowrap;
        flex-shrink: 0;
      }
    }
  `;

  constructor() {
    super();
    this.loading = true;
    this.activeTab = 'feed';

    // Listen for context updates
    this.contextUnsubscribe = on('context:updated', () => {
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.contextUnsubscribe) {
      this.contextUnsubscribe();
    }
  }

  firstUpdated() {
    // Initial load complete
    this.loading = false;
  }

  /**
   * Switch between tabs
   */
  switchTab(tab) {
    this.activeTab = tab;
  }

  /**
   * Render feed tab content
   */
  renderFeedContent() {
    return html`
      <feed-view embedded></feed-view>
    `;
  }

  /**
   * Render notes tab content
   */
  renderNotesContent() {
    return html`
      <notes-view embedded></notes-view>
    `;
  }

  /**
   * Render journal statistics sidebar
   */
  renderSidebar() {
    const state = getState();
    const recentPosts = state.posts.filter(post => {
      const postDate = new Date(post.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return postDate >= weekAgo;
    }).length;

    const recentNotes = state.notes.filter(note => {
      const noteDate = new Date(note.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return noteDate >= weekAgo;
    }).length;

    return html`
      <div class="sidebar-content">
        <div class="sidebar-header">
          <iconify-icon icon="material-symbols:analytics"></iconify-icon>
          <h3>This Week</h3>
        </div>
        
        <div class="quick-stats">
          <div class="stat-item">
            <span>Family Posts</span>
            <span class="stat-value">${recentPosts}</span>
          </div>
          <div class="stat-item">
            <span>Personal Notes</span>
            <span class="stat-value">${recentNotes}</span>
          </div>
          <div class="stat-item">
            <span>Total Entries</span>
            <span class="stat-value">${state.posts.length + state.notes.length}</span>
          </div>
        </div>

        ${this.activeTab === 'feed' ? html`
          <div style="margin-top: 24px;">
            <div class="sidebar-header">
              <iconify-icon icon="material-symbols:tips-and-updates"></iconify-icon>
              <h3>Quick Tip</h3>
            </div>
            <div style="font-size: 0.875rem; line-height: 1.4; color: var(--text-muted);">
              Share what made you smile today with your family!
            </div>
          </div>
        ` : ''}

        ${this.activeTab === 'notes' ? html`
          <div style="margin-top: 24px;">
            <div class="sidebar-header">
              <iconify-icon icon="material-symbols:lightbulb"></iconify-icon>
              <h3>Note Ideas</h3>
            </div>
            <div style="font-size: 0.875rem; line-height: 1.4; color: var(--text-muted);">
              • Gratitude moments<br>
              • Daily reflections<br>
              • Future plans<br>
              • Lessons learned
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render skeleton loader
   */
  renderSkeleton() {
    return html`
      <div class="skeleton" style="width: 80%;"></div>
      <div class="skeleton" style="width: 60%;"></div>
      <div class="skeleton" style="width: 90%;"></div>
    `;
  }

  render() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:book"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Journal</h1>
      </div>
      
      <div class="journal-tabs">
        <button 
          class="tab-button ${this.activeTab === 'feed' ? 'active' : ''}"
          @click=${() => this.switchTab('feed')}
        >
          <iconify-icon icon="material-symbols:dynamic-feed"></iconify-icon>
          Family Feed
        </button>
        <button 
          class="tab-button ${this.activeTab === 'notes' ? 'active' : ''}"
          @click=${() => this.switchTab('notes')}
        >
          <iconify-icon icon="material-symbols:note"></iconify-icon>
          Personal Notes
        </button>
      </div>

      <div class="tab-content">
        <div class="journal-grid">
          <div class="main-content">
            ${this.loading ? this.renderSkeleton() : 
              this.activeTab === 'feed' ? this.renderFeedContent() : this.renderNotesContent()
            }
          </div>
          
          ${this.renderSidebar()}
        </div>
      </div>
    `;
  }
}

customElements.define('journal-view', JournalView);