/**
 * Profile overlay component
 * Displays profile info, last 5 posts, and placeholder stats
 * Max width: 400px
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../../web/supabaseClient.js';

export class ProfileOverlay extends LitElement {
  static properties = {
    userId: { type: String },
    profile: { type: Object },
    recentPosts: { type: Array },
    loading: { type: Boolean },
    visible: { type: Boolean }
  };

  static styles = css`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    :host([visible]) {
      opacity: 1;
      pointer-events: auto;
    }

    .overlay-content {
      background: white;
      border-radius: var(--radius, 8px);
      width: 90%;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      transform: scale(0.95);
      transition: transform 0.2s ease;
    }

    :host([visible]) .overlay-content {
      transform: scale(1);
    }

    .profile-header {
      padding: 24px;
      border-bottom: 1px solid var(--border, #e2e8f0);
      text-align: center;
    }

    .close-button {
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: var(--text-light, #64748b);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      background: var(--secondary, #f3f4f6);
    }

    .profile-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--primary, #3b82f6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;
      margin: 0 auto 16px;
    }

    .profile-name {
      font-size: 1.25rem;
      font-weight: bold;
      color: var(--text, #1e293b);
      margin-bottom: 4px;
    }

    .profile-role {
      color: var(--text-light, #64748b);
      font-size: 14px;
      text-transform: capitalize;
    }

    .stats-section {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border, #e2e8f0);
    }

    .stats-title {
      font-weight: 600;
      color: var(--text, #1e293b);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .stat-item {
      text-align: center;
      padding: 12px;
      background: var(--secondary, #f3f4f6);
      border-radius: var(--radius, 8px);
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary, #3b82f6);
      display: block;
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-light, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .posts-section {
      padding: 20px 24px;
    }

    .posts-title {
      font-weight: 600;
      color: var(--text, #1e293b);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .recent-posts {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .post-item {
      padding: 12px;
      background: var(--secondary, #f3f4f6);
      border-radius: var(--radius, 8px);
      font-size: 14px;
    }

    .post-content {
      color: var(--text, #1e293b);
      line-height: 1.4;
      margin-bottom: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .post-date {
      color: var(--text-light, #64748b);
      font-size: 12px;
    }

    .empty-posts {
      text-align: center;
      color: var(--text-light, #64748b);
      font-style: italic;
      padding: 20px;
    }

    .appreciations-section {
      padding: 20px 24px;
      border-top: 1px solid var(--border, #e2e8f0);
    }

    .appreciations-title {
      font-weight: 600;
      color: var(--text, #1e293b);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .appreciations-placeholder {
      text-align: center;
      color: var(--text-light, #64748b);
      font-style: italic;
      padding: 16px;
      background: var(--secondary, #f3f4f6);
      border-radius: var(--radius, 8px);
    }

    @media (prefers-reduced-motion: reduce) {
      :host,
      .overlay-content {
        transition: none;
      }
    }
  `;

  constructor() {
    super();
    this.userId = '';
    this.profile = null;
    this.recentPosts = [];
    this.loading = false;
    this.visible = false;
  }

  updated(changedProperties) {
    if (changedProperties.has('userId') && this.userId) {
      this.loadProfileData();
    }
  }

  async loadProfileData() {
    if (!this.userId) return;
    
    this.loading = true;
    
    try {
      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (profileError) throw profileError;
      this.profile = profileData;

      // Load recent posts by this user
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (postsError) throw postsError;
      this.recentPosts = postsData || [];

    } catch (error) {
      // Silent error handling - profile data loading failed
    } finally {
      this.loading = false;
    }
  }

  show(userId) {
    this.userId = userId;
    this.visible = true;
  }

  hide() {
    this.visible = false;
    // Clear data after animation
    setTimeout(() => {
      this.userId = '';
      this.profile = null;
      this.recentPosts = [];
    }, 200);
  }

  handleOverlayClick(e) {
    if (e.target === this) {
      this.hide();
    }
  }

  getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  render() {
    if (!this.visible) return html``;

    return html`
      <div class="overlay-content" @click=${e => e.stopPropagation()}>
        <div class="profile-header">
          <button class="close-button" @click=${this.hide}>
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>

          ${this.loading ? html`
            <div>Loading profile...</div>
          ` : this.profile ? html`
            <div class="profile-avatar">
              ${this.getInitials(this.profile.full_name)}
            </div>
            <div class="profile-name">${this.profile.full_name || 'Unknown'}</div>
            <div class="profile-role">${this.profile.role || 'member'}</div>
          ` : html`
            <div>Profile not found</div>
          `}
        </div>

        ${!this.loading && this.profile ? html`
          <div class="stats-section">
            <div class="stats-title">
              <iconify-icon icon="material-symbols:trending-up"></iconify-icon>
              Kindness & Acts
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">42</span>
                <span class="stat-label">Kind Acts</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">7</span>
                <span class="stat-label">Day Streak</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">156</span>
                <span class="stat-label">Total Points</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">🏆</span>
                <span class="stat-label">Helper Badge</span>
              </div>
            </div>
          </div>

          <div class="posts-section">
            <div class="posts-title">
              <iconify-icon icon="material-symbols:forum"></iconify-icon>
              Recent Posts
            </div>
            
            ${this.recentPosts.length === 0 ? html`
              <div class="empty-posts">No recent posts</div>
            ` : html`
              <div class="recent-posts">
                ${this.recentPosts.map(post => html`
                  <div class="post-item">
                    ${post.content ? html`
                      <div class="post-content">${post.content}</div>
                    ` : ''}
                    <div class="post-date">${this.formatDate(post.created_at)}</div>
                  </div>
                `)}
              </div>
            `}
          </div>

          <div class="appreciations-section">
            <div class="appreciations-title">
              <iconify-icon icon="material-symbols:favorite"></iconify-icon>
              Appreciations
            </div>
            <div class="appreciations-placeholder">
              Coming soon: Family appreciations and gratitude messages will appear here.
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

if (!customElements.get('profile-overlay')) {
  customElements.define('profile-overlay', ProfileOverlay);
}