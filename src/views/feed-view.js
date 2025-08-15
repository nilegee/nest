/**
 * Feed view component
 * Shows posts in reverse chronological order with post composer
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../../web/supabaseClient.js';

export class FeedView extends LitElement {
  static properties = {
    posts: { type: Array },
    profiles: { type: Array },
    loading: { type: Boolean },
    showComposer: { type: Boolean },
    newPost: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .title {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--text, #1e293b);
    }

    .compose-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--primary, #3b82f6);
      color: white;
      border: none;
      border-radius: var(--radius, 8px);
      cursor: pointer;
      font-size: 14px;
    }

    .compose-button:hover {
      background: var(--primary-dark, #2563eb);
    }

    .composer {
      background: white;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: var(--radius, 8px);
      padding: 16px;
      margin-bottom: 24px;
      box-shadow: var(--shadow, 0 1px 3px rgba(0,0,0,0.1));
    }

    .composer-header {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 12px;
    }

    .composer-title {
      font-weight: 600;
      color: var(--text, #1e293b);
      flex: 1;
    }

    .close-composer {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--text-light, #64748b);
    }

    .composer-textarea {
      width: 100%;
      min-height: 100px;
      padding: 12px;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: var(--radius, 8px);
      resize: vertical;
      font-family: inherit;
      font-size: 14px;
      margin-bottom: 12px;
    }

    .composer-media {
      margin-bottom: 12px;
    }

    .composer-media input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: var(--radius, 8px);
      font-size: 14px;
    }

    .composer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .button {
      padding: 8px 16px;
      border: none;
      border-radius: var(--radius, 8px);
      cursor: pointer;
      font-size: 14px;
    }

    .button-primary {
      background: var(--primary, #3b82f6);
      color: white;
    }

    .button-secondary {
      background: var(--secondary, #f3f4f6);
      color: var(--text, #1e293b);
    }

    .posts-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .post-card {
      background: white;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: var(--radius, 8px);
      padding: 16px;
      box-shadow: var(--shadow, 0 1px 3px rgba(0,0,0,0.1));
    }

    .post-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .post-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--secondary, #f3f4f6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: var(--text-light, #64748b);
      cursor: pointer;
    }

    .post-author {
      flex: 1;
    }

    .post-author-name {
      font-weight: 600;
      color: var(--text, #1e293b);
      cursor: pointer;
    }

    .post-author-name:hover {
      text-decoration: underline;
    }

    .post-date {
      color: var(--text-light, #64748b);
      font-size: 12px;
    }

    .post-content {
      color: var(--text, #1e293b);
      line-height: 1.6;
      margin-bottom: 12px;
      white-space: pre-wrap;
    }

    .post-media {
      border-radius: var(--radius, 8px);
      overflow: hidden;
      margin-top: 12px;
    }

    .post-media img {
      width: 100%;
      height: auto;
      display: block;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-light, #64748b);
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: var(--text-light, #64748b);
    }

    @media (prefers-reduced-motion: reduce) {
      .compose-button,
      .button {
        transition: none;
      }
    }
  `;

  constructor() {
    super();
    this.posts = [];
    this.profiles = [];
    this.loading = true;
    this.showComposer = false;
    this.newPost = {
      content: '',
      media_url: ''
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  async loadData() {
    try {
      // Load posts with author information
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      this.posts = postsData || [];

      // Load all family profiles for profile overlay functionality
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;
      this.profiles = profilesData || [];

    } catch (error) {
      console.error('Error loading feed data:', error);
    } finally {
      this.loading = false;
    }
  }

  handleShowComposer() {
    this.showComposer = true;
  }

  handleHideComposer() {
    this.showComposer = false;
    this.newPost = {
      content: '',
      media_url: ''
    };
  }

  handleInputChange(e) {
    const { name, value } = e.target;
    this.newPost = { ...this.newPost, [name]: value };
  }

  async handleSubmitPost(e) {
    e.preventDefault();
    
    if (!this.newPost.content.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('user_id', user.user?.id)
        .single();

      if (!profile?.family_id) {
        throw new Error('No family found');
      }

      const { error } = await supabase
        .from('posts')
        .insert([{
          content: this.newPost.content,
          media_url: this.newPost.media_url || null,
          family_id: profile.family_id,
          author_id: user.user.id
        }]);

      if (error) throw error;

      this.handleHideComposer();
      this.loadData(); // Reload posts
    } catch (error) {
      console.error('Error creating post:', error);
    }
  }

  handleAuthorClick(authorId) {
    // Dispatch event for profile overlay
    this.dispatchEvent(new CustomEvent('show-profile', {
      detail: { userId: authorId },
      bubbles: true
    }));
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  getAuthorInitials(authorName) {
    if (!authorName) return '?';
    return authorName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  isValidImageUrl(url) {
    if (!url) return false;
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    } catch {
      return false;
    }
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align: center; padding: 40px;">Loading family wall...</div>`;
    }

    return html`
      <div class="header">
        <h1 class="title">Family Wall</h1>
        <button class="compose-button" @click=${this.handleShowComposer}>
          <iconify-icon icon="material-symbols:edit"></iconify-icon>
          New Post
        </button>
      </div>

      ${this.showComposer ? html`
        <div class="composer">
          <div class="composer-header">
            <div class="composer-title">Share with your family</div>
            <button class="close-composer" @click=${this.handleHideComposer}>
              <iconify-icon icon="material-symbols:close"></iconify-icon>
            </button>
          </div>

          <form @submit=${this.handleSubmitPost}>
            <textarea
              class="composer-textarea"
              name="content"
              placeholder="What's happening in your family?"
              .value=${this.newPost.content}
              @input=${this.handleInputChange}
              required
            ></textarea>

            <div class="composer-media">
              <input
                type="url"
                name="media_url"
                placeholder="Optional: Add image URL"
                .value=${this.newPost.media_url}
                @input=${this.handleInputChange}
              />
            </div>

            <div class="composer-actions">
              <button type="button" class="button button-secondary" @click=${this.handleHideComposer}>
                Cancel
              </button>
              <button type="submit" class="button button-primary">
                Share Post
              </button>
            </div>
          </form>
        </div>
      ` : ''}

      ${this.posts.length === 0 ? html`
        <div class="empty-state">
          <iconify-icon icon="material-symbols:forum" class="empty-icon"></iconify-icon>
          <p>No posts yet. Be the first to share something with your family!</p>
        </div>
      ` : html`
        <div class="posts-list">
          ${this.posts.map(post => html`
            <div class="post-card">
              <div class="post-header">
                <div class="post-avatar" @click=${() => this.handleAuthorClick(post.author_id)}>
                  ${this.getAuthorInitials(post.author?.full_name)}
                </div>
                <div class="post-author">
                  <div class="post-author-name" @click=${() => this.handleAuthorClick(post.author_id)}>
                    ${post.author?.full_name || 'Unknown'}
                  </div>
                  <div class="post-date">${this.formatDate(post.created_at)}</div>
                </div>
              </div>

              ${post.content ? html`
                <div class="post-content">${post.content}</div>
              ` : ''}

              ${this.isValidImageUrl(post.media_url) ? html`
                <div class="post-media">
                  <img src="${post.media_url}" alt="Post media" loading="lazy" />
                </div>
              ` : ''}
            </div>
          `)}
        </div>
      `}
    `;
  }
}

if (!customElements.get('feed-view')) {
  customElements.define('feed-view', FeedView);
}