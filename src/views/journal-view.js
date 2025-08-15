// @ts-check
/**
 * Journal View - Merged feed + notes journaling interface
 * Unified journaling experience for family feed and personal notes
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { waitForSession } from '../lib/session-store.js';
import { insertWithEvents, selectWithEvents, deleteWithEvents } from '../services/db-call.js';
import { emit } from '../services/event-bus.js';
import { checkRateLimit } from '../services/rate-limit.js';
import { showError, showSuccess } from '../toast-helper.js';

export class JournalView extends LitElement {
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

    .tabs {
      display: flex;
      border-bottom: 2px solid var(--border);
      margin-bottom: 24px;
    }

    .tab {
      padding: 12px 24px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-secondary);
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab:hover {
      color: var(--primary);
    }

    .tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .composer {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 32px;
      border: 1px solid var(--border);
    }

    .composer h3 {
      margin: 0 0 16px 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text);
    }

    .composer-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .composer-form textarea {
      min-height: 100px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 1rem;
      font-family: inherit;
      resize: vertical;
    }

    .composer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .visibility-select {
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: var(--radius);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-dark);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .entries-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .entry-card {
      background: white;
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .entry-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .entry-meta .author {
      font-weight: 500;
      color: var(--text);
    }

    .entry-content {
      margin: 12px 0;
      color: var(--text);
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .entry-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      padding: 8px;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: var(--radius);
      color: var(--text-secondary);
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      background: var(--bg-secondary);
      color: var(--text);
    }

    .visibility-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .visibility-badge.family {
      background: var(--primary-light);
      color: var(--primary);
    }

    .visibility-badge.personal {
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--text-secondary);
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
    }

    .empty-state iconify-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      display: block;
    }

    @media (max-width: 768px) {
      .entry-header {
        flex-direction: column;
        gap: 8px;
      }
      
      .composer-actions {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
    }
  `;

  static properties = {
    activeTab: { type: String },
    posts: { type: Array },
    notes: { type: Array },
    loading: { type: Boolean },
    composing: { type: Boolean }
  };

  constructor() {
    super();
    this.activeTab = 'feed';
    this.posts = [];
    this.notes = [];
    this.loading = false;
    this.composing = false;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.session = await waitForSession();
    if (!this.session) return;
    
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      await Promise.all([
        this.loadPosts(),
        this.loadNotes()
      ]);
    } finally {
      this.loading = false;
    }
  }

  async loadPosts() {
    try {
      const { data } = await selectWithEvents('posts', {}, `
        id, body, visibility, created_at,
        author:profiles!author_id(full_name, avatar_url)
      `, {
        silent: true
      });
      
      this.posts = (data || []).sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      this.requestUpdate();
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  }

  async loadNotes() {
    try {
      const { data } = await selectWithEvents('notes', 
        { author_id: this.session.user.id }, 
        '*', 
        { silent: true }
      );
      
      this.notes = (data || []).sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      this.requestUpdate();
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }

  handleTabClick(tab) {
    this.activeTab = tab;
  }

  async handlePostSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const content = formData.get('content')?.trim();
    const visibility = formData.get('visibility') || 'family';

    if (!content) {
      showError('Please write something to post!');
      return;
    }

    if (!checkRateLimit(this.session.user.id, 'post_create')) {
      return;
    }

    this.composing = true;

    try {
      const postData = {
        body: content,
        visibility,
        author_id: this.session.user.id
      };

      const { data } = await insertWithEvents('posts', postData, {
        successMessage: 'Post shared successfully!',
        emitEvent: 'POST_CREATED',
        emitPayload: {
          userId: this.session.user.id,
          familyId: this.session.user.family_id
        }
      });

      await emit('POST_CREATED', {
        userId: this.session.user.id,
        familyId: this.session.user.family_id,
        post: data,
        content
      });

      form.reset();
      await this.loadPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      this.composing = false;
    }
  }

  async handleNoteSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const content = formData.get('content')?.trim();

    if (!content) {
      showError('Please write something in your note!');
      return;
    }

    if (!checkRateLimit(this.session.user.id, 'note_create')) {
      return;
    }

    this.composing = true;

    try {
      const noteData = {
        content,
        author_id: this.session.user.id,
        type: 'personal'
      };

      const { data } = await insertWithEvents('notes', noteData, {
        successMessage: 'Note saved successfully!',
        emitEvent: 'NOTE_ADDED',
        emitPayload: {
          userId: this.session.user.id,
          familyId: this.session.user.family_id
        }
      });

      await emit('NOTE_ADDED', {
        userId: this.session.user.id,
        familyId: this.session.user.family_id,
        note: data,
        content
      });

      form.reset();
      await this.loadNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      this.composing = false;
    }
  }

  async deletePost(post) {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await deleteWithEvents('posts', { id: post.id }, {
        successMessage: 'Post deleted successfully!',
        emitEvent: 'POST_DELETED',
        emitPayload: {
          userId: this.session.user.id,
          postId: post.id
        }
      });

      await this.loadPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  }

  async deleteNote(note) {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await deleteWithEvents('notes', { id: note.id }, {
        successMessage: 'Note deleted successfully!',
        emitEvent: 'NOTE_DELETED',
        emitPayload: {
          userId: this.session.user.id,
          noteId: note.id
        }
      });

      await this.loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  render() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:book"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Journal</h1>
      </div>

      <div class="tabs">
        <button 
          class="tab ${this.activeTab === 'feed' ? 'active' : ''}"
          @click=${() => this.handleTabClick('feed')}>
          <iconify-icon icon="material-symbols:groups"></iconify-icon>
          Family Feed
        </button>
        <button 
          class="tab ${this.activeTab === 'notes' ? 'active' : ''}"
          @click=${() => this.handleTabClick('notes')}>
          <iconify-icon icon="material-symbols:sticky-note-2"></iconify-icon>
          Personal Notes
        </button>
      </div>

      <!-- Family Feed Tab -->
      <div class="tab-content ${this.activeTab === 'feed' ? 'active' : ''}">
        <div class="composer">
          <h3>Share with Family</h3>
          <form class="composer-form" @submit=${this.handlePostSubmit}>
            <textarea 
              name="content" 
              placeholder="What's on your mind? Share a moment, thought, or update with your family..."
              required></textarea>
            <div class="composer-actions">
              <select name="visibility" class="visibility-select">
                <option value="family">Family</option>
                <option value="public">Public</option>
              </select>
              <button type="submit" class="btn btn-primary" ?disabled=${this.composing}>
                ${this.composing ? 'Posting...' : 'Share'}
              </button>
            </div>
          </form>
        </div>

        <div class="entries-list">
          ${this.loading && this.posts.length === 0 ? html`
            <div class="loading-state">
              <div class="loading-spinner"></div>
              Loading posts...
            </div>
          ` : this.posts.length === 0 ? html`
            <div class="empty-state">
              <iconify-icon icon="material-symbols:groups"></iconify-icon>
              <h3>No posts yet</h3>
              <p>Be the first to share something with your family!</p>
            </div>
          ` : this.posts.map(post => html`
            <div class="entry-card">
              <div class="entry-header">
                <div class="entry-meta">
                  <span class="author">${post.author?.full_name || 'Unknown'}</span>
                  <span>•</span>
                  <span>${this.formatDate(post.created_at)}</span>
                  <span class="visibility-badge ${post.visibility}">
                    <iconify-icon icon="${post.visibility === 'family' ? 'material-symbols:family-restroom' : 'material-symbols:public'}"></iconify-icon>
                    ${post.visibility}
                  </span>
                </div>
                ${post.author_id === this.session.user.id ? html`
                  <div class="entry-actions">
                    <button class="btn-icon" @click=${() => this.deletePost(post)}
                            aria-label="Delete post">
                      <iconify-icon icon="material-symbols:delete"></iconify-icon>
                    </button>
                  </div>
                ` : ''}
              </div>
              <div class="entry-content">${post.body}</div>
            </div>
          `)}
        </div>
      </div>

      <!-- Personal Notes Tab -->
      <div class="tab-content ${this.activeTab === 'notes' ? 'active' : ''}">
        <div class="composer">
          <h3>Add Personal Note</h3>
          <form class="composer-form" @submit=${this.handleNoteSubmit}>
            <textarea 
              name="content" 
              placeholder="Write a personal note, reflection, or reminder..."
              required></textarea>
            <div class="composer-actions">
              <span style="font-size: 0.875rem; color: var(--text-secondary);">
                <iconify-icon icon="material-symbols:lock"></iconify-icon>
                Private to you
              </span>
              <button type="submit" class="btn btn-primary" ?disabled=${this.composing}>
                ${this.composing ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </form>
        </div>

        <div class="entries-list">
          ${this.loading && this.notes.length === 0 ? html`
            <div class="loading-state">
              <div class="loading-spinner"></div>
              Loading notes...
            </div>
          ` : this.notes.length === 0 ? html`
            <div class="empty-state">
              <iconify-icon icon="material-symbols:sticky-note-2"></iconify-icon>
              <h3>No notes yet</h3>
              <p>Start journaling your thoughts and ideas!</p>
            </div>
          ` : this.notes.map(note => html`
            <div class="entry-card">
              <div class="entry-header">
                <div class="entry-meta">
                  <iconify-icon icon="material-symbols:lock"></iconify-icon>
                  <span>Personal Note</span>
                  <span>•</span>
                  <span>${this.formatDate(note.created_at)}</span>
                </div>
                <div class="entry-actions">
                  <button class="btn-icon" @click=${() => this.deleteNote(note)}
                          aria-label="Delete note">
                    <iconify-icon icon="material-symbols:delete"></iconify-icon>
                  </button>
                </div>
              </div>
              <div class="entry-content">${note.content}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('journal-view', JournalView);