/**
 * Landing page component
 * Handles user authentication with Google OAuth and Magic Link
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';

/**
 * Get the appropriate redirect URL based on current environment
 */
function getRedirectUrl() {
  // For local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.origin}`;
  }
  
  // For GitHub Pages or other production environments
  return `${window.location.origin}${window.location.pathname}`;
}

export class FnLanding extends LitElement {
  static properties = {
    loading: { type: Boolean },
    error: { type: String },
    magicLinkSent: { type: Boolean },
    email: { type: String }
  };

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .landing-container {
      background: white;
      border-radius: 16px;
      padding: 48px 32px;
      box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    
    .logo {
      font-size: 2.5rem;
      margin-bottom: 8px;
    }
    
    .title {
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 8px 0;
    }
    
    .subtitle {
      color: var(--text-light);
      margin: 0 0 32px 0;
      font-size: 1rem;
    }
    
    .auth-section {
      margin-bottom: 24px;
    }
    
    .auth-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: white;
      color: var(--text);
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 12px;
    }
    
    .auth-button:hover {
      background: var(--secondary);
      border-color: var(--primary);
    }
    
    .auth-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .auth-button.primary {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    
    .auth-button.primary:hover {
      background: var(--primary-dark);
    }
    
    .divider {
      display: flex;
      align-items: center;
      margin: 24px 0;
      color: var(--text-light);
      font-size: 0.875rem;
    }
    
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }
    
    .divider span {
      padding: 0 16px;
    }
    
    .email-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .email-input {
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 1rem;
    }
    
    .email-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
    }
    
    .error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: var(--error);
      padding: 12px;
      border-radius: var(--radius);
      margin-bottom: 16px;
      font-size: 0.875rem;
    }
    
    .success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: var(--success);
      padding: 12px;
      border-radius: var(--radius);
      margin-bottom: 16px;
      font-size: 0.875rem;
    }
    
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .family-note {
      margin-top: 32px;
      padding: 16px;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: var(--radius);
      color: #92400e;
      font-size: 0.875rem;
    }
  `;

  constructor() {
    super();
    this.loading = false;
    this.error = '';
    this.magicLinkSent = false;
    this.email = '';
  }

  /**
   * Handle Google OAuth login
   */
  async handleGoogleLogin() {
    try {
      this.loading = true;
      this.error = '';
      
      const redirectUrl = getRedirectUrl();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Google login error:', error);
      this.error = error.message || 'Failed to sign in with Google';
      this.loading = false;
    }
  }

  /**
   * Handle magic link email submission
   */
  async handleMagicLink(e) {
    e.preventDefault();
    
    if (!this.email.trim()) {
      this.error = 'Please enter your email address';
      return;
    }
    
    try {
      this.loading = true;
      this.error = '';
      
      const redirectUrl = getRedirectUrl();
      
      const { error } = await supabase.auth.signInWithOtp({
        email: this.email.trim(),
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) throw error;
      
      this.magicLinkSent = true;
      this.loading = false;
      
    } catch (error) {
      console.error('Magic link error:', error);
      this.error = error.message || 'Failed to send magic link';
      this.loading = false;
    }
  }

  /**
   * Handle email input change
   */
  handleEmailChange(e) {
    this.email = e.target.value;
    this.error = '';
  }

  render() {
    return html`
      <div class="landing-container">
        <div class="logo">🏠</div>
        <h1 class="title">FamilyNest</h1>
        <p class="subtitle">Welcome to your family's private space</p>
        
        ${this.error ? html`
          <div class="error">
            ${this.error}
          </div>
        ` : ''}
        
        ${this.magicLinkSent ? html`
          <div class="success">
            <strong>Check your email!</strong><br>
            We've sent a magic link to ${this.email}
          </div>
        ` : ''}
        
        ${!this.magicLinkSent ? html`
          <div class="auth-section">
            <button 
              class="auth-button primary"
              ?disabled=${this.loading}
              @click=${this.handleGoogleLogin}
            >
              ${this.loading ? html`<div class="spinner"></div>` : html`
                <iconify-icon icon="logos:google-icon"></iconify-icon>
                Continue with Google
              `}
            </button>
            
            <div class="divider">
              <span>or</span>
            </div>
            
            <form class="email-form" @submit=${this.handleMagicLink}>
              <input
                type="email"
                class="email-input"
                placeholder="Enter your email address"
                .value=${this.email}
                @input=${this.handleEmailChange}
                ?disabled=${this.loading}
              >
              <button 
                type="submit" 
                class="auth-button"
                ?disabled=${this.loading || !this.email.trim()}
              >
                ${this.loading ? html`<div class="spinner"></div>` : html`
                  <iconify-icon icon="material-symbols:mail-outline"></iconify-icon>
                  Send Magic Link
                `}
              </button>
            </form>
          </div>
        ` : html`
          <button 
            class="auth-button"
            @click=${() => { this.magicLinkSent = false; this.email = ''; }}
          >
            <iconify-icon icon="material-symbols:arrow-back"></iconify-icon>
            Try Different Email
          </button>
        `}
        
        <div class="family-note">
          <iconify-icon icon="material-symbols:info-outline"></iconify-icon>
          Access is limited to family members only
        </div>
      </div>
    `;
  }
}

customElements.define('fn-landing', FnLanding);