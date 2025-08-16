/**
 * Family Wall - Ultra Minimal
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { WHITELISTED_EMAILS } from '../web/env.js';

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
    .btn-secondary { background: #6b7280; color: white; }
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
    
    // Add debugging for session
    console.log('fn-home connected with session:', {
      hasSession: !!this.session,
      hasUser: !!this.session?.user,
      userEmail: this.session?.user?.email,
      userId: this.session?.user?.id
    });
    
    await this.init();
  }

  async init() {
    console.log('Initializing fn-home with session:', this.session?.user?.email);
    await this.createProfile();
    
    // Only load posts after profile is created
    if (this.profile) {
      await this.loadPosts();
    }
  }

  async createProfile() {
    if (!this.session?.user) return;
    
    console.log('Creating profile for user:', {
      id: this.session.user.id,
      email: this.session.user.email,
      user_metadata: this.session.user.user_metadata
    });
    
    try {
      // First, try to get existing profile
      const { data: profile, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', this.session.user.id)
        .single();

      if (selectError) {
        console.log('Profile select error:', selectError);
        console.log('Current session user:', {
          id: this.session.user.id,
          email: this.session.user.email,
          aud: this.session.user.aud,
          app_metadata: this.session.user.app_metadata,
          user_metadata: this.session.user.user_metadata
        });
        
        // If profile doesn't exist or access denied, try to create one
        if (selectError.code === 'PGRST116' || selectError.code === '42501' || selectError.message?.includes('row-level security') || selectError.message?.includes('permission denied') || selectError.status === 403) {
          console.log('No existing profile found or access denied, attempting to create new profile...');
          
          // First, ensure the default family exists by trying to select it
          const { data: defaultFamily } = await supabase
            .from('families')
            .select('id')
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .single();
          
          if (!defaultFamily) {
            console.warn('Default family not found. Database may need initialization.');
          }
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: this.session.user.id,
              email: this.session.user.email,
              full_name: this.session.user.user_metadata?.full_name || this.session.user.email.split('@')[0],
              family_id: '00000000-0000-0000-0000-000000000001'
            })
            .select()
            .single();

          if (insertError) {
            console.error('Profile insert error:', insertError);
            
            // Check if it's a unique constraint violation (user already has profile)
            if (insertError.code === '23505') {
              console.log('Profile already exists (unique constraint), trying select again...');
              
              // Try to get the existing profile again
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', this.session.user.id)
                .single();
              
              if (existingProfile) {
                console.log('Found existing profile after constraint error:', existingProfile);
                this.profile = existingProfile;
                return;
              }
            }
            
            // If insert fails due to RLS or other issues, show helpful message
            if (insertError.status === 403 || insertError.status === 400) {
              console.warn('Profile creation blocked. This may indicate a database configuration issue.');
              // Don't block the UI, just log the issue
              return;
            }
            return;
          }
          
          console.log('Profile created successfully:', newProfile);
          this.profile = newProfile;
        } else {
          console.error('Profile access denied - this indicates an RLS policy issue:', {
            error: selectError,
            userEmail: this.session.user.email,
            isWhitelisted: WHITELISTED_EMAILS.includes(this.session.user.email)
          });
          console.warn('The user is whitelisted but RLS policies are blocking access. This requires database migration to fix.');
        }
      } else if (profile) {
        console.log('Existing profile found:', profile);
        this.profile = profile;
      }
    } catch (error) {
      console.error('Profile creation failed:', error);
    }
  }

  async loadPosts() {
    // Only load posts if we have a profile
    if (!this.profile) {
      console.log('No profile available, skipping posts load');
      return;
    }
    
    try {
      console.log('Loading posts for family:', this.profile.family_id);
      
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*, author:profiles(full_name)')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Posts query error:', error);
        this.posts = [];
        return;
      }
      
      console.log('Posts loaded successfully:', posts?.length || 0, 'posts');
      this.posts = posts || [];
    } catch (error) {
      console.error('Posts error:', error);
      this.posts = [];
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
    // If we don't have a profile due to database issues, show a helpful message
    if (this.session?.user && !this.profile) {
      return html`
        <div class="container">
          <div class="header">
            <h1 class="title">Family Wall</h1>
            <button class="btn btn-danger" @click=${this.signOut}>Sign Out</button>
          </div>

          <div class="card" style="text-align: center; padding: 40px 20px;">
            <iconify-icon icon="material-symbols:warning" style="
              font-size: 48px;
              color: #f59e0b;
              margin-bottom: 16px;
            "></iconify-icon>
            <h2 style="margin: 0 0 12px 0; color: #1f2937;">Setting Up Your Profile</h2>
            <p style="margin: 0 0 24px 0; color: #6b7280; line-height: 1.5;">
              We're having trouble setting up your family profile due to a database configuration issue.<br>
              Please try refreshing the page, or contact support if the issue persists.
            </p>
            <button 
              class="btn btn-primary" 
              @click=${this.createProfile}
              style="margin-right: 12px;"
            >
              Try Again
            </button>
            <button 
              class="btn btn-secondary" 
              @click=${() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      `;
    }

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