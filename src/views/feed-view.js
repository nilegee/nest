// @ts-check
/**
 * @fileoverview Feed View for FamilyNest
 * Dedicated family feed with posting interface
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import * as db from '../services/db.js';
import * as ui from '../services/ui.js';
import { getFamilyId, getUserProfile, getUser } from '../services/session-store.js';
import { getTemplateFromHash } from '../router/router.js';

export class FeedView extends LitElement {
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
    
    .template-indicator {
      padding: 4px 8px;
      background: var(--primary-light);
      color: var(--primary);
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .composer-textarea {
      width: 100%;
      min-height: 120px;
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
    
    .posts-feed {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px;
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    
    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border);
      border-top: 2px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .post-card {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    
    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .post-author {
      font-weight: 600;
      color: var(--text);
    }
    
    .post-date {
      color: var(--muted);
      font-size: 0.875rem;
    }
    
    .post-body {
      color: var(--text);
      line-height: 1.6;
      white-space: pre-wrap;
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
    posts: { type: Array, state: true },
    loading: { type: Boolean, state: true },
    postsLoading: { type: Boolean, state: true },
    template: { type: String, state: true }
  };

  constructor() {
    super();
    this.feedText = '';
    this.posts = [];
    this.loading = false;
    this.postsLoading = true;
    this.template = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.handleTemplateParam();
    this.loadPosts();
    
    // Listen for new posts from other components
    this.handlePostCreated = (event) => {
      if (event.detail) {
        this.posts = [event.detail, ...this.posts];
        this.requestUpdate();
      }
    };
    window.addEventListener('post-created', this.handlePostCreated);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.handlePostCreated) {
      window.removeEventListener('post-created', this.handlePostCreated);
    }
  }

  /**
   * Handle template parameter from URL
   */
  handleTemplateParam() {
    const template = getTemplateFromHash();
    
    if (template && !this.feedText) {
      const templates = {
        'gaming-highlight': 'Just had an amazing gaming moment! ',
        'gratitude-share': '🙏 Today I\'m grateful for: ',
        'weekly-highlight': '⭐ This week\'s family highlight: ',
        'family-micro-activity-20': 'Quick family activity idea: '
      };
      
      if (templates[template]) {
        this.feedText = templates[template];
        this.template = template;
      }
    }
  }

  /**
   * Load posts for user's family
   */
  async loadPosts() {
    const familyId = getFamilyId();
    if (!familyId) {
      this.postsLoading = false;
      return;
    }

    this.postsLoading = true;
    
    try {
      const { data, error } = await db.select(
        'posts',
        { family_id: familyId },
        `*, author:profiles!posts_author_id_fkey(full_name)`,
        'created_at',
        false
      );

      if (error) {
        throw error;
      }

      this.posts = data || [];
      
    } catch (error) {
      console.error('Failed to load posts:', error);
      ui.toastError('Failed to load posts');
    } finally {
      this.postsLoading = false;
    }
  }

  /**
   * Handle feed post submission
   */
  async handleFeedSubmit() {
    if (!this.feedText.trim()) return;

    const familyId = getFamilyId();
    const user = getUser();
    
    if (!familyId || !user) {
      ui.toastError('Unable to post: no family context');
      return;
    }

    this.loading = true;
    
    try {
      const { data, error } = await db.insert('posts', {
        family_id: familyId,
        author_id: user.id,
        body: this.feedText.trim(),
        visibility: 'family'
      });

      if (error) {
        throw error;
      }

      this.feedText = '';
      this.template = null;
      ui.toastSuccess('Post shared with family!');
      
      // Reload posts to show the new one
      this.loadPosts();
      
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
    this.template = null;
  }

  /**
   * Format post date for display
   */
  formatPostDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  render() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:dynamic-feed"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Family Feed</h1>
      </div>
      
      <!-- Composer -->
      <div class="composer">
        <div class="composer-header">
          <iconify-icon icon="material-symbols:edit"></iconify-icon>
          <h3 class="composer-title">Share with Family</h3>
          ${this.template ? html`
            <span class="template-indicator">Template: ${this.template}</span>
          ` : ''}
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
            ${this.loading ? 'Posting...' : 'Share'}
          </button>
        </div>
      </div>

      <!-- Posts Feed -->
      <div class="posts-feed">
        ${this.postsLoading ? html`
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <span>Loading posts...</span>
          </div>
        ` : this.posts.length > 0 ? html`
          ${this.posts.map(post => html`
            <article class="post-card">
              <div class="post-header">
                <span class="post-author">${post.author?.full_name || 'Family Member'}</span>
                <time class="post-date">${this.formatPostDate(post.created_at)}</time>
              </div>
              <div class="post-body">${post.body}</div>
            </article>
          `)}
        ` : html`
          <div class="feed-placeholder">
            <iconify-icon icon="material-symbols:dynamic-feed"></iconify-icon>
            <h3>No posts yet</h3>
            <p>Be the first to share something with your family!</p>
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('feed-view', FeedView);