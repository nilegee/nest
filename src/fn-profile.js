/**
 * Profile Management Component
 * Full profile editing with preferences, interests, and wishlist
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { waitForSession } from './lib/session-store.js';
import { FamilyBot } from './fn-family-bot.js';
import { getAllThemes, applyTheme } from './themes.js';
import { showSuccess, showError } from './toast-helper.js';
import * as db from './services/db.js';
import { logger } from './utils/logger.js';

const log = logger('fn-profile');

export class FnProfile extends LitElement {
  static properties = {
    session: { type: Object },
    profile: { type: Object },
    preferences: { type: Object },
    wishlist: { type: Array },
    loading: { type: Boolean },
    editing: { type: Object },
    previewMessage: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--theme-border, #e2e8f0);
    }

    .page-header iconify-icon {
      font-size: 32px;
      color: var(--theme-primary, #6366f1);
    }

    .page-header h1 {
      margin: 0;
      font-size: 28px;
      color: var(--theme-text, #1e293b);
    }

    .section {
      background: var(--theme-bg, #ffffff);
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px var(--theme-shadow, rgba(0,0,0,0.1));
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--theme-text, #1e293b);
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: var(--theme-text, #1e293b);
    }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      font-size: 14px;
      background: var(--theme-bg, #ffffff);
      color: var(--theme-text, #1e293b);
      box-sizing: border-box;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--theme-primary, #6366f1);
      box-shadow: 0 0 0 3px var(--theme-primary, #6366f1)20;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .interests-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .interest-chip {
      padding: 6px 12px;
      background: var(--theme-bg-secondary, #f8fafc);
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .interest-chip.selected {
      background: var(--theme-primary, #6366f1);
      color: white;
      border-color: var(--theme-primary, #6366f1);
    }

    .wishlist-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--theme-bg-secondary, #f8fafc);
      border-radius: var(--theme-radius, 8px);
      margin-bottom: 8px;
    }

    .wishlist-add {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      align-items: center;
    }

    .wishlist-add input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      font-size: 14px;
    }

    .wishlist-add button {
      padding: 8px 16px;
      background: var(--theme-primary, #6366f1);
      color: white;
      border: none;
      border-radius: var(--theme-radius, 8px);
      font-size: 14px;
      cursor: pointer;
    }

    .wishlist-add button:hover {
      background: var(--theme-primary-hover, #5855eb);
    }

    .wishlist-content {
      flex: 1;
    }

    .wishlist-title {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .wishlist-description {
      font-size: 12px;
      color: var(--theme-text-secondary, #64748b);
    }

    .wishlist-priority {
      display: flex;
      gap: 2px;
    }

    .priority-star {
      color: #fbbf24;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: var(--theme-radius, 8px);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 44px;
      min-width: 44px;
    }

    .btn-primary {
      background: var(--theme-primary, #6366f1);
      color: white;
    }

    .btn-primary:hover {
      background: var(--theme-primary-dark, #4f46e5);
    }

    .btn-secondary {
      background: var(--theme-bg-secondary, #f8fafc);
      color: var(--theme-text, #1e293b);
      border: 1px solid var(--theme-border, #e2e8f0);
    }

    .btn-secondary:hover {
      background: var(--theme-bg-tertiary, #f1f5f9);
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      min-width: 36px;
      min-height: 36px;
    }

    .preview-message {
      background: var(--theme-bg-tertiary, #f1f5f9);
      border-left: 4px solid var(--theme-accent, #10b981);
      padding: 16px;
      margin-top: 16px;
      border-radius: 0 var(--theme-radius, 8px) var(--theme-radius, 8px) 0;
      font-style: italic;
    }

    .muted-category {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: var(--theme-bg-secondary, #f8fafc);
      border-radius: var(--theme-radius, 8px);
      margin-bottom: 8px;
    }

    .toggle-switch {
      position: relative;
      width: 44px;
      height: 24px;
      background: var(--theme-border, #e2e8f0);
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .toggle-switch.active {
      background: var(--theme-primary, #6366f1);
    }

    .toggle-knob {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s;
    }

    .toggle-switch.active .toggle-knob {
      transform: translateX(20px);
    }

    @media (max-width: 768px) {
      :host {
        padding: 16px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `;

  constructor() {
    super();
    this.profile = null;
    this.preferences = null;
    this.wishlist = [];
    this.loading = true;
    this.editing = null;
    this.previewMessage = '';

    this.availableInterests = [
      'roblox', 'minecraft', 'pubg', 'sims4', 
      'art', 'soccer', 'reading'
    ];

    this.mutedCategories = [
      { id: 'mom_support', label: 'Mom Support Messages', icon: '👩‍👧‍👦' },
      { id: 'anti_bullying', label: 'Anti-Bullying Check-ins', icon: '🛡️' },
      { id: 'food_habits', label: 'Food & Manners Reminders', icon: '🍽️' },
      { id: 'gaming', label: 'Gaming Reminders', icon: '🎮' }
    ];
  }

  async connectedCallback() {
    super.connectedCallback();
    this.session = await waitForSession();
    if (!this.session) return; // safety
    
    await this.loadProfile();
    await this.loadPreferences();
    await this.loadWishlist();
    this.updatePreviewMessage();
  }

  async loadProfile() {
    try {
      // Guard against missing session
      if (!this.session?.user) {
        log.warn('No session user for profile loading');
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', this.session.user.id)
        .single();

      if (error) throw error;
      this.profile = data;
    } catch (error) {
      console.error('Failed to load profile:', error);
      showError('Failed to load profile');
    }
  }

  async loadPreferences() {
    try {
      this.preferences = await FamilyBot.getMemberPrefs(this.session.user.id);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      this.preferences = FamilyBot.getDefaultPrefs();
    }
    this.loading = false;
  }

  async loadWishlist() {
    try {
      // Guard against missing session
      if (!this.session?.user) {
        log.warn('No session user for wishlist loading');
        return;
      }
      
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', this.session.user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.wishlist = data || [];
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      showError('Failed to load wishlist');
    }
  }

  async savePreferences() {
    try {
      // Guard against missing session or profile
      if (!this.session?.user) {
        throw new Error('No session user available');
      }
      
      if (!this.profile?.family_id) {
        // Optionally create/link default family if your backend supports it; otherwise just render empty state.
        log.warn('No family_id available for saving preferences');
        showError('Profile not fully loaded. Please refresh and try again.');
        return;
      }
      
      const { data, error } = await supabase
        .from('preferences')
        .upsert({
          user_id: this.session.user.id,
          family_id: this.profile.family_id,
          ...this.preferences
        })
        .select()
        .single();

      if (error) throw error;
      
      // Clear cache
      FamilyBot.preferencesCache.delete(this.session.user.id);
      
      // Apply theme immediately
      applyTheme(document.documentElement, this.preferences.theme);
      
      showSuccess('Preferences saved successfully!');
      this.updatePreviewMessage();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      showError('Failed to save preferences');
    }
  }

  updatePreferences(field, value) {
    this.preferences = { ...this.preferences, [field]: value };
    this.requestUpdate();
  }

  toggleInterest(interest) {
    const interests = [...this.preferences.interests];
    const index = interests.indexOf(interest);
    
    if (index > -1) {
      interests.splice(index, 1);
    } else {
      interests.push(interest);
    }
    
    this.updatePreferences('interests', interests);
  }

  toggleMutedCategory(categoryId) {
    const muted = [...this.preferences.muted_categories];
    const index = muted.indexOf(categoryId);
    
    if (index > -1) {
      muted.splice(index, 1);
    } else {
      muted.push(categoryId);
    }
    
    this.updatePreferences('muted_categories', muted);
  }

  updatePreviewMessage() {
    const variables = { name: this.profile?.full_name || 'Family Member' };
    const message = FamilyBot.generateMessage('kindness_prompt', this.preferences, variables);
    this.previewMessage = message.replace('FamilyBot', this.preferences.bot_name);
  }

  handleWishlistKeydown(e) {
    if (e.key === 'Enter') {
      this.handleAddWishlist();
    }
  }

  async handleAddWishlist() {
    const el = this.renderRoot?.querySelector?.('#wl-input');
    const item = (el?.value || '').trim();
    if (!item) {
      el?.focus();
      return;
    }
    
    // Optimistic add
    const temp = { id: `temp_${Date.now()}`, title: item, description: null, priority: 3 };
    this.wishlist = [temp, ...this.wishlist];
    el.value = '';
    
    try {
      const { data, error } = await db.insert('wishlist', {
        user_id: this.session.user.id,
        family_id: this.profile?.family_id,
        title: item,
        priority: 3
      });
      
      if (error) throw error;
      
      // Swap temp with real
      this.wishlist = this.wishlist.map(x => x.id === temp.id ? data[0] : x);
      showSuccess('Added to wishlist!');
    } catch (e) {
      this.wishlist = this.wishlist.filter(x => x.id !== temp.id);
      console.error('Failed to add wishlist item:', e);
      showError('Failed to add wishlist item');
      el?.focus();
    }
  }

  // Keep the old method for backward compatibility but simplify it
  async addWishlistItem() {
    // For now, just focus the input to encourage using the new form
    const el = this.renderRoot?.querySelector?.('#wl-input');
    el?.focus();
  }

  async removeWishlistItem(item) {
    if (!confirm(`Remove "${item.title}" from wishlist?`)) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      
      this.wishlist = this.wishlist.filter(w => w.id !== item.id);
      showSuccess('Removed from wishlist');
    } catch (error) {
      console.error('Failed to remove wishlist item:', error);
      showError('Failed to remove wishlist item');
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="page-header">
          <iconify-icon icon="material-symbols:person"></iconify-icon>
          <h1>Profile</h1>
        </div>
        <div>Loading profile...</div>
      `;
    }

    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:person"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Profile & Preferences</h1>
      </div>

      <!-- Bot Preferences -->
      <div class="section">
        <h2 class="section-title">
          <iconify-icon icon="material-symbols:smart-toy"></iconify-icon>
          FamilyBot Settings
        </h2>
        
        <div class="form-group">
          <label class="form-label">Bot Name</label>
          <input type="text" class="form-input" 
                 .value=${this.preferences.bot_name}
                 @input=${(e) => this.updatePreferences('bot_name', e.target.value)}
                 placeholder="FamilyBot">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Theme</label>
            <select class="form-select"
                    .value=${this.preferences.theme}
                    @change=${(e) => this.updatePreferences('theme', e.target.value)}>
              ${getAllThemes().map(theme => html`
                <option value=${theme.name}>${theme.displayName}</option>
              `)}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Language</label>
            <select class="form-select"
                    .value=${this.preferences.language}
                    @change=${(e) => this.updatePreferences('language', e.target.value)}>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="mix">Mixed</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Message Pack</label>
            <select class="form-select"
                    .value=${this.preferences.message_pack}
                    @change=${(e) => this.updatePreferences('message_pack', e.target.value)}>
              <option value="standard">Standard</option>
              <option value="arabic_values">Arabic Values</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-select"
                    .value=${this.preferences.role_tag || ''}
                    @change=${(e) => this.updatePreferences('role_tag', e.target.value || null)}>
              <option value="">Not specified</option>
              <option value="mom">Mom</option>
              <option value="dad">Dad</option>
              <option value="child">Child</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Quiet Hours Start</label>
            <input type="time" class="form-input"
                   .value=${this.preferences.quiet_hours_start}
                   @input=${(e) => this.updatePreferences('quiet_hours_start', e.target.value)}>
          </div>

          <div class="form-group">
            <label class="form-label">Quiet Hours End</label>
            <input type="time" class="form-input"
                   .value=${this.preferences.quiet_hours_end}
                   @input=${(e) => this.updatePreferences('quiet_hours_end', e.target.value)}>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Daily Message Limit</label>
          <input type="number" class="form-input" min="1" max="10"
                 .value=${this.preferences.nudge_cap_per_day}
                 @input=${(e) => this.updatePreferences('nudge_cap_per_day', parseInt(e.target.value))}>
        </div>

        ${this.previewMessage ? html`
          <div class="preview-message">
            <strong>Preview message from ${this.preferences.bot_name}:</strong><br>
            ${this.previewMessage}
          </div>
        ` : ''}

        <button class="btn btn-primary" @click=${this.savePreferences}>
          Save Preferences
        </button>
      </div>

      <!-- Interests -->
      <div class="section">
        <h2 class="section-title">
          <iconify-icon icon="material-symbols:interests"></iconify-icon>
          Interests
        </h2>
        
        <div class="interests-chips">
          ${this.availableInterests.map(interest => html`
            <button class="interest-chip ${this.preferences.interests.includes(interest) ? 'selected' : ''}"
                    @click=${() => this.toggleInterest(interest)}>
              ${interest}
            </button>
          `)}
        </div>

        ${this.preferences.interests.includes('pubg') || this.preferences.interests.includes('sims4') ? html`
          <div class="form-group" style="margin-top: 20px;">
            <label class="form-label">Gaming Goal (minutes per day)</label>
            <input type="number" class="form-input" min="30" max="480"
                   .value=${this.preferences.gaming_minutes_goal}
                   @input=${(e) => this.updatePreferences('gaming_minutes_goal', parseInt(e.target.value))}>
          </div>
        ` : ''}
      </div>

      <!-- Wishlist -->
      <div class="section">
        <h2 class="section-title">
          <iconify-icon icon="material-symbols:favorite"></iconify-icon>
          Wishlist
        </h2>

        <!-- Add Wishlist Item Form -->
        <div class="wishlist-add">
          <input id="wl-input" type="text" placeholder="Add to wishlist..." aria-label="Wishlist item" @keydown=${this.handleWishlistKeydown}>
          <button @click=${() => this.handleAddWishlist()}>Add</button>
        </div>

        ${this.wishlist.length === 0 ? html`
          <p>Your wishlist is empty. Add some items!</p>
        ` : ''}

        ${this.wishlist.slice(0, 3).map(item => html`
          <div class="wishlist-item">
            <div class="wishlist-content">
              <div class="wishlist-title">${item.title}</div>
              ${item.description ? html`
                <div class="wishlist-description">${item.description}</div>
              ` : ''}
            </div>
            <div class="wishlist-priority">
              ${Array(item.priority).fill(0).map(() => html`
                <span class="priority-star">⭐</span>
              `)}
            </div>
            <button class="btn btn-secondary btn-icon" 
                    @click=${() => this.removeWishlistItem(item)}>
              <iconify-icon icon="material-symbols:delete"></iconify-icon>
            </button>
          </div>
        `)}

        ${this.wishlist.length > 3 ? html`
          <p>+ ${this.wishlist.length - 3} more items</p>
        ` : ''}
      </div>

      <!-- Muted Categories -->
      <div class="section">
        <h2 class="section-title">
          <iconify-icon icon="material-symbols:notifications-off"></iconify-icon>
          Message Categories
        </h2>
        
        <p>Toggle which types of messages you want to receive:</p>

        ${this.mutedCategories.map(category => html`
          <div class="muted-category">
            <div>
              <span>${category.icon}</span>
              <strong>${category.label}</strong>
            </div>
            <div class="toggle-switch ${!this.preferences.muted_categories.includes(category.id) ? 'active' : ''}"
                 @click=${() => this.toggleMutedCategory(category.id)}>
              <div class="toggle-knob"></div>
            </div>
          </div>
        `)}
      </div>
    `;
  }
}

customElements.define('fn-profile', FnProfile);