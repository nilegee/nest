/**
 * Insights Dashboard Component
 * Parenting tips, age-group mapping, and Mom Panel with quick actions
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { waitForSession } from './lib/session-store.js';
import { FamilyBot } from './fn-family-bot.js';
import { showSuccess, showError } from './toast-helper.js';

function basePath() {
  // works on /nest/ and local /
  const base = document.querySelector('base')?.getAttribute('href');
  if (base) return base;
  const p = window.location.pathname;
  return p.includes('/nest/') ? '/nest/' : '/';
}

async function loadParentingTips() {
  const url = basePath() + 'src/data/parenting-tips.json';
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('tips fetch failed ' + res.status);
  return res.json();
}

export class FnInsights extends LitElement {
  static properties = {
    session: { type: Object },
    familyProfiles: { type: Array },
    parentingTips: { type: Object },
    currentTips: { type: Array },
    appreciations: { type: Array },
    userPrefs: { type: Object },
    loading: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      padding: 20px;
      max-width: 1200px;
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

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }

    .section {
      background: var(--theme-bg, #ffffff);
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      padding: 24px;
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

    .mom-panel {
      background: linear-gradient(135deg, #f8fafc, #e0f2fe);
      border: 2px solid var(--theme-accent, #10b981);
    }

    .mom-panel .section-title {
      color: var(--theme-accent, #10b981);
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .quick-action-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--theme-bg, #ffffff);
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      text-decoration: none;
      color: inherit;
    }

    .quick-action-btn:hover {
      border-color: var(--theme-accent, #10b981);
      background: var(--theme-bg-secondary, #f8fafc);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px var(--theme-shadow, rgba(0,0,0,0.1));
    }

    .action-icon {
      font-size: 24px;
      width: 40px;
      text-align: center;
    }

    .action-content {
      flex: 1;
    }

    .action-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--theme-text, #1e293b);
    }

    .action-description {
      font-size: 12px;
      color: var(--theme-text-secondary, #64748b);
    }

    .tips-grid {
      display: grid;
      gap: 16px;
    }

    .tip-card {
      background: var(--theme-bg-secondary, #f8fafc);
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      padding: 20px;
      transition: all 0.2s;
    }

    .tip-card:hover {
      border-color: var(--theme-border-hover, #cbd5e1);
      box-shadow: 0 2px 8px var(--theme-shadow, rgba(0,0,0,0.1));
    }

    .tip-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .tip-badge {
      background: var(--theme-primary, #6366f1);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .tip-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--theme-text, #1e293b);
    }

    .tip-principle {
      font-size: 12px;
      font-style: italic;
      color: var(--theme-accent, #10b981);
      margin-bottom: 8px;
    }

    .tip-description {
      font-size: 14px;
      line-height: 1.5;
      color: var(--theme-text-secondary, #64748b);
      margin-bottom: 16px;
    }

    .tip-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .btn {
      padding: 8px 12px;
      border: none;
      border-radius: var(--theme-radius, 8px);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
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

    .gratitude-box {
      background: var(--theme-bg-tertiary, #f1f5f9);
      border-radius: var(--theme-radius, 8px);
      padding: 16px;
      margin-top: 16px;
    }

    .gratitude-item {
      background: var(--theme-bg, #ffffff);
      border-radius: var(--theme-radius, 8px);
      padding: 12px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .gratitude-text {
      flex: 1;
      font-size: 14px;
    }

    .gratitude-actions {
      display: flex;
      gap: 8px;
    }

    .age-group-info {
      background: var(--theme-bg-tertiary, #f1f5f9);
      border-radius: var(--theme-radius, 8px);
      padding: 12px;
      margin-bottom: 16px;
      font-size: 12px;
      text-align: center;
      color: var(--theme-text-secondary, #64748b);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--theme-text-secondary, #64748b);
    }

    .empty-state iconify-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    @media (max-width: 768px) {
      :host {
        padding: 16px;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .tip-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `;

  constructor() {
    super();
    this.familyProfiles = [];
    this.parentingTips = null;
    this.currentTips = [];
    this.appreciations = [];
    this.userPrefs = null;
    this.loading = true;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.session = await waitForSession();
    if (!this.session) return; // safety
    
    await Promise.all([
      this.loadParentingTips(),
      this.loadFamilyProfiles(),
      this.loadUserPrefs(),
      this.loadAppreciations()
    ]);
    this.generateCurrentTips();
    this.loading = false;
  }

  async loadParentingTips() {
    try {
      this.parentingTips = await loadParentingTips();
    } catch (error) {
      console.error('Failed to load parenting tips:', error);
    }
  }

  async loadFamilyProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, dob')
        .order('dob');

      if (error) throw error;
      this.familyProfiles = data || [];
    } catch (error) {
      console.error('Failed to load family profiles:', error);
    }
  }

  async loadUserPrefs() {
    try {
      this.userPrefs = await FamilyBot.getMemberPrefs(this.session.user.id);
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  }

  async loadAppreciations() {
    try {
      const { data, error } = await supabase
        .from('appreciations')
        .select(`
          *,
          from_user:profiles!from_user_id(full_name),
          to_user:profiles!to_user_id(full_name)
        `)
        .eq('posted_to_feed', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      this.appreciations = data || [];
    } catch (error) {
      console.error('Failed to load appreciations:', error);
    }
  }

  generateCurrentTips() {
    if (!this.parentingTips || !this.familyProfiles.length) return;

    const tips = [];

    // Add age-specific tips for children
    this.familyProfiles.forEach(profile => {
      if (profile.dob) {
        const age = this.calculateAge(profile.dob);
        const ageGroup = this.getAgeGroup(age);
        
        if (ageGroup && this.parentingTips.age_groups[ageGroup]) {
          const groupTips = this.parentingTips.age_groups[ageGroup].tips;
          // Rotate through tips (show up to 1 per child)
          const weekNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
          const tipIndex = weekNumber % groupTips.length;
          tips.push({
            ...groupTips[tipIndex],
            target_child: profile.full_name,
            age_group: ageGroup
          });
        }
      }
    });

    // Add general family tips
    const generalTips = this.parentingTips.general_family_tips;
    const weekNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
    const generalTipIndex = weekNumber % generalTips.length;
    tips.push(generalTips[generalTipIndex]);

    this.currentTips = tips.slice(0, 3); // Show max 3 tips
  }

  calculateAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  }

  getAgeGroup(age) {
    if (age <= 3) return 'toddler';
    if (age <= 6) return 'preschool';
    if (age <= 12) return 'school_age';
    if (age <= 18) return 'teen';
    return null;
  }

  async sendQuickAction(actionType) {
    try {
      const botName = this.userPrefs?.bot_name || 'FamilyBot';
      
      const actions = {
        weekly_highlight: () => FamilyBot.promptUserAction(this.session.user.id, 'weekly_highlight'),
        self_care: () => FamilyBot.scheduleNudge(this.session.user.id, 'mom_self_care', new Date(Date.now() + 5000)),
        weekend_connector: () => FamilyBot.promptUserAction(this.session.user.id, 'weekend_planning')
      };

      if (actions[actionType]) {
        await actions[actionType]();
        showSuccess(`${botName} will help you with that!`);
      }
    } catch (error) {
      console.error(`Failed to send ${actionType} action:`, error);
      showError('Unable to send action right now');
    }
  }

  async postAppreciation(appreciation) {
    try {
      const content = `🙏 ${appreciation.appreciation_text}\n\n— ${appreciation.from_user.full_name}`;
      
      const post = await FamilyBot.postToFeed(this.session.user.id, content, {
        type: 'appreciation',
        appreciation_id: appreciation.id
      });

      if (post) {
        // Mark as posted
        await supabase
          .from('appreciations')
          .update({ 
            posted_to_feed: true, 
            posted_at: new Date().toISOString() 
          })
          .eq('id', appreciation.id);

        // Remove from local list
        this.appreciations = this.appreciations.filter(a => a.id !== appreciation.id);
        
        showSuccess('Appreciation shared with the family!');

        // Schedule thank-back nudge
        const thankBackTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await FamilyBot.scheduleNudge(
          appreciation.from_user_id, 
          'gratitude_thank_back', 
          thankBackTime
        );
      }
    } catch (error) {
      console.error('Failed to post appreciation:', error);
      showError('Unable to share appreciation');
    }
  }

  async deleteAppreciation(appreciation) {
    try {
      await supabase
        .from('appreciations')
        .delete()
        .eq('id', appreciation.id);

      this.appreciations = this.appreciations.filter(a => a.id !== appreciation.id);
      showSuccess('Appreciation removed');
    } catch (error) {
      console.error('Failed to delete appreciation:', error);
      showError('Unable to remove appreciation');
    }
  }

  navigateToRoute(route, params = '') {
    window.location.hash = route + params;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="page-header">
          <iconify-icon icon="material-symbols:insights"></iconify-icon>
          <h1>Insights</h1>
        </div>
        <div>Loading insights...</div>
      `;
    }

    const isMom = this.userPrefs?.role_tag === 'mom';

    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:insights"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Family Insights</h1>
      </div>

      <div class="dashboard-grid">
        <!-- Mom Panel (if user is mom) -->
        ${isMom ? html`
          <div class="section mom-panel">
            <h2 class="section-title">
              <iconify-icon icon="material-symbols:favorite"></iconify-icon>
              Mom Panel
            </h2>
            
            <div class="quick-actions">
              <button class="quick-action-btn" 
                      @click=${() => this.sendQuickAction('weekly_highlight')}>
                <div class="action-icon">🌟</div>
                <div class="action-content">
                  <div class="action-title">Share Weekly Highlight</div>
                  <div class="action-description">Celebrate a special family moment from this week</div>
                </div>
              </button>

              <button class="quick-action-btn" 
                      @click=${() => this.sendQuickAction('self_care')}>
                <div class="action-icon">🧘‍♀️</div>
                <div class="action-content">
                  <div class="action-title">Self-Care Reminder</div>
                  <div class="action-description">Schedule a moment just for you</div>
                </div>
              </button>

              <button class="quick-action-btn" 
                      @click=${() => this.sendQuickAction('weekend_connector')}>
                <div class="action-icon">👨‍👩‍👧‍👦</div>
                <div class="action-content">
                  <div class="action-title">Plan Family Time</div>
                  <div class="action-description">Create a special weekend connection moment</div>
                </div>
              </button>
            </div>

            <!-- Gratitude Box -->
            ${this.appreciations.length > 0 ? html`
              <div class="gratitude-box">
                <h3 style="margin: 0 0 12px 0; font-size: 14px;">💝 Gratitude Box</h3>
                ${this.appreciations.map(appreciation => html`
                  <div class="gratitude-item">
                    <div class="gratitude-text">
                      "${appreciation.appreciation_text}"
                      <br><small>— ${appreciation.from_user.full_name}</small>
                    </div>
                    <div class="gratitude-actions">
                      <button class="btn btn-primary" 
                              @click=${() => this.postAppreciation(appreciation)}>
                        Share
                      </button>
                      <button class="btn btn-secondary" 
                              @click=${() => this.deleteAppreciation(appreciation)}>
                        Remove
                      </button>
                    </div>
                  </div>
                `)}
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Parenting Tips -->
        <div class="section ${isMom ? '' : 'full-width'}">
          <h2 class="section-title">
            <iconify-icon icon="material-symbols:lightbulb"></iconify-icon>
            Parenting Tips
          </h2>

          ${this.currentTips.length === 0 ? html`
            <div class="empty-state">
              <iconify-icon icon="material-symbols:psychology"></iconify-icon>
              <h3>No tips available</h3>
              <p>Add children's birthdates to get personalized parenting tips!</p>
            </div>
          ` : html`
            ${this.familyProfiles.length > 0 ? html`
              <div class="age-group-info">
                Your children: ${this.familyProfiles
                  .filter(p => p.dob && this.calculateAge(p.dob) < 19)
                  .map(p => `${p.full_name} (${this.calculateAge(p.dob)} years)`)
                  .join(', ') || 'No children profiles found'}
              </div>
            ` : ''}

            <div class="tips-grid">
              ${this.currentTips.map(tip => html`
                <div class="tip-card">
                  <div class="tip-header">
                    <div>
                      <div class="tip-title">
                        ${tip.title}
                        ${tip.target_child ? html`<small> (for ${tip.target_child})</small>` : ''}
                      </div>
                      <div class="tip-principle">${tip.principle}</div>
                    </div>
                    <div class="tip-badge">${tip.badge}</div>
                  </div>

                  <div class="tip-description">${tip.description}</div>

                  <div class="tip-actions">
                    <button class="btn btn-primary" 
                            @click=${() => this.navigateToRoute(tip.route, tip.params)}>
                      ${tip.action_cta}
                    </button>
                    
                    ${this.userPrefs?.bot_name ? html`
                      <button class="btn btn-secondary" 
                              @click=${() => FamilyBot.promptUserAction(this.session.user.id, 'tip_action', tip)}>
                        Nudge via ${this.userPrefs.bot_name}
                      </button>
                    ` : ''}
                  </div>
                </div>
              `)}
            </div>
          `}
        </div>
      </div>
    `;
  }
}

customElements.define('fn-insights', FnInsights);