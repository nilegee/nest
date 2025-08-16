/**
 * Islamic Guidance Card (Removable)
 * Self-contained card that shows Islamic guidance from database
 * Falls back to placeholder Qur'an verse if empty
 * Delete this file + import to remove feature
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../../web/supabaseClient.js';
import { getUserFamilyId } from '../utils/profile-utils.js';

export class IslamicGuidanceCard extends LitElement {
  static properties = {
    guidance: { type: Object },
    loading: { type: Boolean },
    error: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .guidance-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: var(--radius, 8px);
      padding: 20px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow, 0 4px 6px rgba(0,0,0,0.1));
    }

    .guidance-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect fill="url(%23pattern)" width="100" height="100"/></svg>');
      pointer-events: none;
    }

    .guidance-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }

    .guidance-icon {
      font-size: 24px;
      color: rgba(255, 255, 255, 0.9);
    }

    .guidance-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
    }

    .guidance-content {
      position: relative;
      z-index: 1;
      line-height: 1.6;
      margin-bottom: 12px;
    }

    .guidance-text {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.95);
      font-style: italic;
      margin-bottom: 12px;
    }

    .guidance-source {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      text-align: right;
      font-weight: 500;
    }

    .guidance-type {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
      text-transform: capitalize;
      margin-bottom: 12px;
    }

    .loading-state {
      text-align: center;
      padding: 20px;
      color: rgba(255, 255, 255, 0.8);
    }

    .error-state {
      text-align: center;
      padding: 20px;
      color: rgba(255, 255, 255, 0.8);
    }

    .placeholder-note {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      margin-top: 12px;
      font-style: normal;
    }

    @media (prefers-reduced-motion: reduce) {
      .guidance-card {
        background: #5a67d8;
      }
      
      .guidance-card::before {
        display: none;
      }
    }

    @media (max-width: 640px) {
      .guidance-card {
        padding: 16px;
      }
      
      .guidance-text {
        font-size: 15px;
      }
    }
  `;

  constructor() {
    super();
    this.guidance = null;
    this.loading = true;
    this.error = null;
    
    // Placeholder fallback content
    this.fallbackGuidance = {
      content: "Indeed, prayer prohibits immorality and wrongdoing, and the remembrance of Allah is greater. And Allah knows that which you do.",
      source: "Qur'an (29:45) — Placeholder",
      type: "quran"
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadGuidance();
  }

  async loadGuidance() {
    try {
      // Try to get user's family to fetch family-specific guidance
      const { data: user } = await supabase.auth.getUser();
      let familyId = null;

      if (user?.user) {
        // Use utility to get family ID
        familyId = await getUserFamilyId(
          user.user.id,
          user.user.email,
          user.user.user_metadata
        );
      }

      let guidanceData = null;

      if (familyId) {
        // Try to get family-specific guidance first
        const { data, error } = await supabase
          .from('islamic_guidance')
          .select('*')
          .eq('family_id', familyId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          guidanceData = data[0];
        }
      }

      // If no family-specific guidance, try to get any guidance
      if (!guidanceData) {
        const { data, error } = await supabase
          .from('islamic_guidance')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          guidanceData = data[0];
        }
      }

      // Use database data if available, otherwise use fallback
      this.guidance = guidanceData || this.fallbackGuidance;
      
    } catch (error) {
      console.error('Error loading Islamic guidance:', error);
      this.guidance = this.fallbackGuidance;
      this.error = 'Failed to load guidance';
    } finally {
      this.loading = false;
    }
  }

  getTypeIcon(type) {
    switch (type) {
      case 'quran': return 'material-symbols:menu-book';
      case 'hadith': return 'material-symbols:format-quote';
      case 'advice': return 'material-symbols:lightbulb';
      default: return 'material-symbols:auto-stories';
    }
  }

  render() {
    return html`
      <div class="guidance-card">
        <div class="guidance-header">
          <iconify-icon icon="${this.getTypeIcon(this.guidance?.type || 'quran')}" class="guidance-icon"></iconify-icon>
          <div class="guidance-title">Daily Islamic Guidance</div>
        </div>

        ${this.loading ? html`
          <div class="loading-state">
            <iconify-icon icon="material-symbols:refresh" style="font-size: 20px; margin-bottom: 8px;"></iconify-icon>
            <div>Loading guidance...</div>
          </div>
        ` : this.guidance ? html`
          <div class="guidance-content">
            <div class="guidance-type">${this.guidance.type || 'guidance'}</div>
            <div class="guidance-text">"${this.guidance.content}"</div>
            <div class="guidance-source">— ${this.guidance.source || 'Islamic Guidance'}</div>
            
            ${this.guidance === this.fallbackGuidance ? html`
              <div class="placeholder-note">
                This is a placeholder. Add Islamic guidance to your family database to see custom content.
              </div>
            ` : ''}
          </div>
        ` : html`
          <div class="error-state">
            <iconify-icon icon="material-symbols:error" style="font-size: 20px; margin-bottom: 8px;"></iconify-icon>
            <div>Unable to load guidance</div>
          </div>
        `}
      </div>
    `;
  }
}

if (!customElements.get('islamic-guidance-card')) {
  customElements.define('islamic-guidance-card', IslamicGuidanceCard);
}