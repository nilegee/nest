/**
 * Main application component
 * Handles authentication state and routing between landing and home views
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { WHITELISTED_EMAILS } from '../web/env.js';

export class FnApp extends LitElement {
  static properties = {
    session: { type: Object },
    loading: { type: Boolean },
    error: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
    }
  `;

  constructor() {
    super();
    this.session = null;
    this.loading = true;
    this.error = '';
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.initAuth();
  }

  /**
   * Initialize authentication and session listeners
   */
  async initAuth() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        this.error = error.message;
        this.loading = false;
        return;
      }

      // Handle session change
      await this.handleSessionChange(session);

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        await this.handleSessionChange(session);
      });

    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.error = 'Failed to initialize authentication';
      this.loading = false;
    }
  }

  /**
   * Handle session changes and validate user access
   */
  async handleSessionChange(session) {
    this.error = '';
    
    if (session?.user?.email) {
      // Check if user email is whitelisted
      if (!WHITELISTED_EMAILS.includes(session.user.email)) {
        this.error = `Sorry, access is limited to family members only. Your email (${session.user.email}) is not authorized.`;
        
        // Sign out unauthorized user
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Sign out error:', signOutError);
        }
        
        this.session = null;
        this.loading = false;
        return;
      }
      
      console.log('User authorized, loading home view');
    }
    
    this.session = session;
    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html`
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="text-align: center;">
            <div style="
              width: 32px;
              height: 32px;
              border: 3px solid #e5e7eb;
              border-top: 3px solid #6366f1;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 16px;
            "></div>
            <p style="color: #6b7280; margin: 0;">Loading...</p>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
    }

    if (this.error) {
      return html`
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #f8fafc;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            max-width: 400px;
            width: 100%;
            text-align: center;
          ">
            <iconify-icon icon="material-symbols:error" style="
              font-size: 48px;
              color: #ef4444;
              margin-bottom: 16px;
            "></iconify-icon>
            <h2 style="
              margin: 0 0 12px 0;
              color: #1f2937;
              font-size: 1.25rem;
              font-weight: 600;
            ">Access Denied</h2>
            <p style="
              margin: 0 0 24px 0;
              color: #6b7280;
              line-height: 1.5;
            ">${this.error}</p>
            <button 
              @click=${() => window.location.reload()}
              style="
                background: #6366f1;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
              "
            >Try Again</button>
          </div>
        </div>
      `;
    }

    if (this.session?.user) {
      return html`<fn-home .session=${this.session}></fn-home>`;
    } else {
      return html`<fn-landing></fn-landing>`;
    }
  }
}

if (!customElements.get('fn-app')) {
  customElements.define('fn-app', FnApp);
}