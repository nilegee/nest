/**
 * Family Wall - Ultra Minimal
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';

export class FnHome extends LitElement {
  static properties = {
    session: { type: Object },
    profile: { type: Object },
    posts: { type: Array },
    newPost: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: #f8fafc;
      padding: 16px;
    }
    .container { max-width: 600px; margin: 0 auto; }
    .header {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }
    .title { font-size: 1.5rem; font-weight: 700; margin: 0; }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-danger { background: #ef4444; color: white; }
    .btn-primary { background: #6366f1; color: white; }
    .btn:disabled { background: #9ca3af; cursor: not-allowed; }
    .card {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }
    .greeting {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    .textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-family: inherit;
      resize: vertical;
      margin-bottom: 8px;
    }
    .textarea:focus { outline: none; border-color: #6366f1; }
    .text-right { text-align: right; }
    .post {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .post:last-child { border-bottom: none; margin-bottom: 0; }
    .post-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #6366f1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 600;
    }
    .post-meta { flex: 1; }
    .author { font-weight: 600; margin: 0; font-size: 14px; }
    .time { color: #6b7280; font-size: 12px; margin: 0; }
    .content {
      color: #374151;
      line-height: 1.4;
      margin: 0;
      white-space: pre-wrap;
    }
    .empty {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
    }
  `;

  constructor() {
    super();
    this.session = null;
    this.profile = null;
    this.posts = [];
    this.newPost = '';
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.init();
  }

  async init() {
    await this.createProfile();
    await this.loadPosts();
  }

  async createProfile() {
    if (!this.session?.user) return;
    try {
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', this.session.user.id)
        .single();

      if (!profile) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            user_id: this.session.user.id,
            email: this.session.user.email,
            full_name: this.session.user.user_metadata?.full_name || this.session.user.email.split('@')[0],
            family_id: '00000000-0000-0000-0000-000000000001'
          })
          .select()
          .single();
        profile = newProfile;
      }
      this.profile = profile;
    } catch (error) {
      console.error('Profile error:', error);
    }
  }

  async loadPosts() {
    try {
      const { data: posts } = await supabase
        .from('posts')
        .select('*, author:profiles(full_name)')
        .order('created_at', { ascending: false });
      this.posts = posts || [];
    } catch (error) {
      console.error('Posts error:', error);
    }
  }

  async createPost() {
    if (!this.newPost.trim() || !this.profile) return;
    try {
      await supabase.from('posts').insert({
        content: this.newPost.trim(),
        author_id: this.profile.id,
        family_id: this.profile.family_id
      });
      this.newPost = '';
      await this.loadPosts();
    } catch (error) {
      console.error('Create post error:', error);
    }
  }

  signOut() {
    supabase.auth.signOut();
  }

  getInitials(name) {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
    return date.toLocaleDateString();
  }

  getGreeting() {
    const hour = new Date().getHours();
    const name = this.profile?.full_name?.split(' ')[0] || 'there';
    if (hour < 12) return `Good morning, ${name}! ☀️`;
    if (hour < 18) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}! 🌙`;
  }

  render() {
    return html`
      <div class="container">
        <div class="header">
          <h1 class="title">Family Wall</h1>
          <button class="btn btn-danger" @click=${this.signOut}>Sign Out</button>
        </div>

        <div class="card greeting">
          <p style="margin: 0;">${this.getGreeting()}</p>
        </div>

        <div class="card">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Share with the family</label>
          <textarea
            class="textarea"
            placeholder="What's on your mind?"
            .value=${this.newPost}
            @input=${(e) => this.newPost = e.target.value}
          ></textarea>
          <div class="text-right">
            <button 
              class="btn btn-primary"
              @click=${this.createPost}
              ?disabled=${!this.newPost.trim()}
            >Post</button>
          </div>
        </div>

        <div class="card">
          <h2 style="margin: 0 0 16px 0;">Recent Posts</h2>
          ${this.posts.length === 0 ? html`
            <div class="empty">No posts yet. Be the first to share!</div>
          ` : this.posts.map(post => html`
            <div class="post">
              <div class="post-header">
                <div class="avatar">${this.getInitials(post.author?.full_name)}</div>
                <div class="post-meta">
                  <p class="author">${post.author?.full_name || 'Family Member'}</p>
                  <p class="time">${this.formatTime(post.created_at)}</p>
                </div>
              </div>
              <p class="content">${post.content}</p>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

if (!customElements.get('fn-home')) {
  customElements.define('fn-home', FnHome);
}