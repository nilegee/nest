/**
 * Landing page component - Simplified
 * Handles user authentication with Google OAuth and Magic Link
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';

function getRedirectUrl() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.origin}`;
  }
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
    
    .container {
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
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    
    .subtitle {
      color: #6b7280;
      margin: 0 0 32px 0;
      line-height: 1.5;
    }
    
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: #4285f4;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .google-btn:hover {
      background: #3367d6;
    }
    
    .google-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    
    .divider {
      display: flex;
      align-items: center;
      margin: 20px 0;
      color: #9ca3af;
      font-size: 14px;
    }
    
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e5e7eb;
    }
    
    .divider span {
      margin: 0 16px;
    }
    
    .email-input {
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 16px;
      width: 100%;
    }
    
    .email-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
    }
    
    .magic-btn {
      background: #6366f1;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .magic-btn:hover {
      background: #4f46e5;
    }
    
    .magic-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    
    .error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }
    
    .success {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      color: #0369a1;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
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
      to { transform: rotate(360deg); }
    }
  `;

  constructor() {
    super();
    this.loading = false;
    this.error = '';
    this.magicLinkSent = false;
    this.email = '';
  }

  async signInWithGoogle() {
    try {
      this.loading = true;
      this.error = '';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl()
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Google sign in error:', error);
      this.error = error.message || 'Failed to sign in with Google';
    } finally {
      this.loading = false;
    }
  }

  async signInWithMagicLink() {
    if (!this.email.trim()) {
      this.error = 'Please enter your email address';
      return;
    }

    try {
      this.loading = true;
      this.error = '';
      
      const { error } = await supabase.auth.signInWithOtp({
        email: this.email.trim(),
        options: {
          emailRedirectTo: getRedirectUrl()
        }
      });
      
      if (error) throw error;
      
      this.magicLinkSent = true;
    } catch (error) {
      console.error('Magic link error:', error);
      this.error = error.message || 'Failed to send magic link';
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="container">
        <div class="logo">🏠</div>
        <h1 class="title">FamilyNest</h1>
        <p class="subtitle">Your private family hub</p>
        
        ${this.error ? html`
          <div class="error">${this.error}</div>
        ` : ''}
        
        ${this.magicLinkSent ? html`
          <div class="success">
            <p><strong>Check your email!</strong></p>
            <p>We sent a magic link to ${this.email}</p>
          </div>
        ` : html`
          <div class="auth-form">
            <button 
              class="google-btn" 
              @click=${this.signInWithGoogle}
              ?disabled=${this.loading}
            >
              ${this.loading ? html`<div class="spinner"></div>` : html`
                <iconify-icon icon="logos:google-icon"></iconify-icon>
                Continue with Google
              `}
            </button>
            
            <div class="divider">
              <span>or</span>
            </div>
            
            <input
              type="email"
              class="email-input"
              placeholder="Enter your email"
              .value=${this.email}
              @input=${(e) => this.email = e.target.value}
              @keydown=${(e) => e.key === 'Enter' && this.signInWithMagicLink()}
              ?disabled=${this.loading}
            />
            
            <button 
              class="magic-btn"
              @click=${this.signInWithMagicLink}
              ?disabled=${this.loading || !this.email.trim()}
            >
              ${this.loading ? html`<div class="spinner"></div>` : 'Send Magic Link'}
            </button>
          </div>
        `}
      </div>
    `;
  }
}

if (!customElements.get('fn-landing')) {
  customElements.define('fn-landing', FnLanding);
}