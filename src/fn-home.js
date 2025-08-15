/**
 * Home/Nest component
 * Minimal authenticated view with simple dashboard
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';

export class FnHome extends LitElement {
  static properties = {
    session: { type: Object },
    userProfile: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: #f8fafc;
      --primary: #3b82f6;
      --text: #1e293b;
      --muted: #64748b;
      --border: #e2e8f0;
      --radius: 8px;
      --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .header {
      margin-bottom: 40px;
      text-align: center;
    }
    
    .greeting {
      font-size: 2rem;
      font-weight: bold;
      color: var(--text);
      margin-bottom: 8px;
    }
    
    .subtitle {
      color: var(--muted);
      font-size: 1.1rem;
    }
    
    .card {
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 24px;
      margin-bottom: 20px;
      border: 1px solid var(--border);
      text-align: center;
      max-width: 400px;
      margin: 0 auto;
    }
    
    .card-icon {
      font-size: 3rem;
      color: var(--primary);
      margin-bottom: 16px;
    }
    
    .card-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 8px;
    }
    
    .card-description {
      color: var(--muted);
      margin-bottom: 20px;
    }
    
    .sign-out-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 8px 16px;
      color: var(--text);
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: var(--shadow);
    }
    
    .sign-out-button:hover {
      background: #f8fafc;
    }
  `;
  constructor() {
    super();
    this.userProfile = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this.session?.user) {
      await this.loadUserProfile();
    }
  }

  /**
   * Load user profile from Supabase
   */
  async loadUserProfile() {
    if (!this.session?.user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.session.user.id)
        .single();
      
      if (error) {
        console.log('Profile not found, user may need to complete setup');
        this.userProfile = null;
      } else {
        this.userProfile = data;
      }
    } catch (error) {
      console.log('Error loading profile:', error);
      this.userProfile = null;
    }
  }

  /**
   * Handle sign out
   */
  async handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  render() {
    if (!this.session?.user) {
      return html`<div>Loading...</div>`;
    }

    const userName = this.userProfile?.full_name || this.session.user.email?.split('@')[0] || 'there';

    return html`
      <button class="sign-out-button" @click=${this.handleSignOut}>
        <iconify-icon icon="material-symbols:logout"></iconify-icon>
        Sign Out
      </button>
      
      <div class="container">
        <div class="header">
          <h1 class="greeting">Welcome ${userName}!</h1>
          <p class="subtitle">Your family dashboard is ready</p>
        </div>
        
        <div class="card">
          <iconify-icon icon="material-symbols:event-add" class="card-icon"></iconify-icon>
          <h2 class="card-title">Add your first family event</h2>
          <p class="card-description">
            Start building your family timeline by adding important events, celebrations, and milestones.
          </p>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('fn-home')) {
  customElements.define('fn-home', FnHome);
}