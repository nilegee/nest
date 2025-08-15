/**
 * Main application component
 * Handles session management, authentication state, and view routing
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { wireAuthListener, waitForSession, getSession, init as sessionStoreInit } from './lib/session-store.js';
import { WHITELISTED_EMAILS } from '../web/env.js';
import { bootWarn } from './lib/log.js';
import { logger } from './utils/logger.js';
import { initFamilyBotOnce } from './fn-family-bot.js';
import { ensureFamilyId } from './services/db.js';

const log = logger('fn-app');
let authListenerAttached = false;
let schedulerStartedForSessionId = null;

export class FnApp extends LitElement {
  static properties = {
    session: { type: Object },
    loading: { type: Boolean },
    error: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }
    
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      flex-direction: column;
      gap: 16px;
    }
    
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--secondary);
      border-top: 3px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error {
      padding: 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius);
      color: var(--error);
      max-width: 400px;
      margin: 20px auto;
      text-align: center;
    }
    
    .error-actions {
      margin-top: 12px;
    }
    
    .btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn:hover {
      background: var(--primary-dark);
    }
  `;

  constructor() {
    super();
    this.session = null;
    this.loading = true;
    this.error = '';
    
    this.initAuth();
    this.initProactiveBootstrap();
  }

  /**
   * Optional proactive bootstrap (tolerate 404 gracefully)
   */
  async initProactiveBootstrap() {
    try {
      const url = new URL('./proactive/bootstrap.js', import.meta.url).href;
      await import(url);
    } catch (e) {
      bootWarn('Optional proactive/bootstrap.js missing or failed', e?.message || e);
    }
  }

  /**
   * Initialize authentication and set up session listeners
   */
  async initAuth() {
    try {
      log.info('Initializing auth...', {
        url: window.location.href,
        hash: window.location.hash,
        search: window.location.search
      });
      
      // Initialize session store first
      await sessionStoreInit();
      
      wireAuthListener();
      
      // Ensure a visible skeleton immediately
      document.documentElement.classList.add('app-ready');
      
      // Check for OAuth error in URL
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      
      const error = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
      
      if (error) {
        log.error('OAuth error in URL:', error, errorDescription);
        this.error = `Authentication failed: ${errorDescription || error}`;
        this.loading = false;
        return;
      }
      
      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        log.error('Session error:', sessionError);
        throw sessionError;
      }
      
      log.info('Initial session:', session?.user?.email || 'No session');
      
      // Set up auth state change listener (only once)
      if (!authListenerAttached) {
        supabase.auth.onAuthStateChange(async (event, session) => {
          log.info('Auth state changed:', event, session?.user?.email);
          await this.handleSessionChange(session);
        });
        authListenerAttached = true;
      }
      
      // Handle initial session
      await this.handleSessionChange(session);
      
    } catch (error) {
      log.error('Auth initialization error:', error);
      this.error = 'Failed to initialize authentication';
      this.loading = false;
    }
  }

  /**
   * Handle session changes and validate user access
   */
  async handleSessionChange(session) {
    log.info('Handling session change:', session?.user?.email || 'No session');
    this.error = '';
    
    if (session?.user?.email) {
      log.info('User authenticated:', session.user.email);
      
      // Check if user email is whitelisted
      if (!WHITELISTED_EMAILS.includes(session.user.email)) {
        log.warn('User not whitelisted:', session.user.email);
        this.error = `Sorry, access is limited to family members only. Your email (${session.user.email}) is not authorized.`;
        
        // Sign out unauthorized user
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          log.error('Sign out error:', signOutError);
        }
        
        this.session = null;
        this.loading = false;
        return;
      }
      
      log.info('User authorized, loading home view');
      
      // Start FamilyBot once per session
      const currentSessionId = session?.access_token ?? 'unknown';
      if (schedulerStartedForSessionId !== currentSessionId) {
        initFamilyBotOnce();
        schedulerStartedForSessionId = currentSessionId;
        log.info('FamilyBot started for session');
      }
      
      await waitForSession();
      
      // Refresh data after sign-in
      window.dispatchEvent(new CustomEvent('refresh-data'));
      
      // Clean OAuth hash after parsing
      if (location.hash && location.hash.startsWith('#access_token=')) {
        history.replaceState({}, document.title, location.pathname + location.search);
      }
    } else {
      log.info('No authenticated user, showing landing page');
    }
    
    this.session = session;
    this.loading = false;
    this.requestUpdate();
  }

  /**
   * Handle sign out
   */
  async handleSignOut() {
    try {
      this.loading = true;
      await supabase.auth.signOut();
      
      // Clear any remaining session data
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } catch (error) {
      console.error('Sign out error:', error);
      this.error = 'Failed to sign out';
      this.loading = false;
    }
  }

  /**
   * Retry authentication initialization
   */
  async retryAuth() {
    this.loading = true;
    this.error = '';
    await this.initAuth();
  }

  render() {
    if (this.loading) {
      return html`
        <div class="header-skeleton"></div>
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading FamilyNest...</p>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="error">
          <p>${this.error}</p>
          <div class="error-actions">
            <button class="btn" @click=${this.retryAuth}>
              Try Again
            </button>
          </div>
        </div>
      `;
    }

    // Render appropriate view based on session state
    if (this.session?.user) {
      return html`<fn-home .session=${this.session}></fn-home>`;
    }
    
    return html`<fn-landing></fn-landing>`;
  }
}

customElements.define('fn-app', FnApp);