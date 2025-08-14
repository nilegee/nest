/**
 * Chores Management Component
 * CRUD chores with streak tracking and FamilyBot integration
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { FamilyBot } from './fn-family-bot.js';
import { showSuccess, showError } from './toast-helper.js';

// TODO: Remove KIND_MAP once DB acts_kind_check is updated to new values
const KIND_MAP = {
  chore: 'chore_complete',
  goal: 'goal_contrib',
  habit: 'gentle_action',
  note: 'kindness',
  wishlist: 'gentle_action',
  event: 'gentle_action'
};

export class FnChores extends LitElement {
  static properties = {
    session: { type: Object },
    chores: { type: Array },
    familyProfiles: { type: Array },
    loading: { type: Boolean },
    editingChore: { type: Object },
    streaks: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--theme-border, #e2e8f0);
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .page-title iconify-icon {
      font-size: 32px;
      color: var(--theme-primary, #6366f1);
    }

    .page-title h1 {
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

    .add-chore-form {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: 12px;
      align-items: end;
      margin-bottom: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-label {
      margin-bottom: 4px;
      font-size: 12px;
      font-weight: 500;
      color: var(--theme-text-secondary, #64748b);
    }

    .form-input, .form-select {
      padding: 10px 12px;
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      font-size: 14px;
      background: var(--theme-bg, #ffffff);
      color: var(--theme-text, #1e293b);
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--theme-primary, #6366f1);
      box-shadow: 0 0 0 3px var(--theme-primary, #6366f1)20;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: var(--theme-radius, 8px);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn-primary {
      background: var(--theme-primary, #6366f1);
      color: white;
    }

    .btn-primary:hover {
      background: var(--theme-primary-dark, #4f46e5);
    }

    .btn-success {
      background: var(--theme-accent, #10b981);
      color: white;
    }

    .btn-success:hover {
      background: #059669;
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
      min-width: 40px;
      padding: 10px;
    }

    .chores-grid {
      display: grid;
      gap: 16px;
    }

    .chore-card {
      background: var(--theme-bg-secondary, #f8fafc);
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      padding: 16px;
      transition: all 0.2s;
    }

    .chore-card:hover {
      border-color: var(--theme-border-hover, #cbd5e1);
      box-shadow: 0 2px 8px var(--theme-shadow, rgba(0,0,0,0.1));
    }

    .chore-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .chore-title {
      font-weight: 600;
      color: var(--theme-text, #1e293b);
      margin: 0 0 4px 0;
    }

    .chore-assignee {
      font-size: 12px;
      color: var(--theme-text-secondary, #64748b);
    }

    .chore-actions {
      display: flex;
      gap: 8px;
    }

    .chore-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .chore-points {
      background: var(--theme-primary, #6366f1);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .chore-status {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-todo {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-in-progress {
      background: #fef3c7;
      color: #d97706;
    }

    .status-done {
      background: #dcfce7;
      color: #16a34a;
    }

    .streak-display {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--theme-text-secondary, #64748b);
    }

    .streak-number {
      font-weight: 600;
      color: var(--theme-accent, #10b981);
    }

    .streaks-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .streak-card {
      background: linear-gradient(135deg, var(--theme-accent, #10b981), #059669);
      color: white;
      padding: 20px;
      border-radius: var(--theme-radius, 8px);
      text-align: center;
    }

    .streak-avatar {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .streak-name {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .streak-count {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .streak-label {
      font-size: 12px;
      opacity: 0.9;
    }

    .share-offer {
      background: var(--theme-bg-tertiary, #f1f5f9);
      border: 1px solid var(--theme-accent, #10b981);
      border-radius: var(--theme-radius, 8px);
      padding: 16px;
      margin-top: 12px;
      text-align: center;
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

    @media (max-width: 768px) {
      :host {
        padding: 16px;
      }

      .add-chore-form {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .streaks-section {
        grid-template-columns: 1fr;
      }
    }
  `;

  constructor() {
    super();
    this.chores = [];
    this.familyProfiles = [];
    this.loading = true;
    this.editingChore = null;
    this.streaks = {};
    this.newChore = {
      title: '',
      assignee: '',
      points: 1
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadFamilyProfiles();
    await this.loadChores();
    await this.calculateStreaks();
  }

  async loadFamilyProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, dob')
        .order('full_name');

      if (error) throw error;
      this.familyProfiles = data || [];
    } catch (error) {
      console.error('Failed to load family profiles:', error);
    }
  }

  async loadChores() {
    try {
      // Use mapped kind for querying
      const choreKind = KIND_MAP['chore'] || 'chore';
      
      const { data, error } = await supabase
        .from('acts')
        .select(`
          *,
          assignee_profile:profiles!user_id(full_name)
        `)
        .eq('kind', choreKind)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.chores = data || [];
      this.loading = false;
    } catch (error) {
      console.error('Failed to load chores:', error);
      this.loading = false;
    }
  }

  async calculateStreaks() {
    try {
      // Calculate streak for each family member
      const streaks = {};
      
      for (const profile of this.familyProfiles) {
        const streak = await this.getStreakForUser(profile.user_id);
        streaks[profile.user_id] = {
          name: profile.full_name,
          count: streak,
          avatar: this.getAvatar(profile.full_name)
        };
      }
      
      this.streaks = streaks;
    } catch (error) {
      console.error('Failed to calculate streaks:', error);
    }
  }

  async getStreakForUser(userId) {
    try {
      // Get last 30 days of chore completions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Use mapped kind for querying
      const choreKind = KIND_MAP['chore'] || 'chore';
      
      const { data, error } = await supabase
        .from('acts')
        .select('created_at')
        .eq('user_id', userId)
        .eq('kind', choreKind)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate consecutive days
      let streak = 0;
      const dates = data.map(act => new Date(act.created_at).toDateString());
      const uniqueDates = [...new Set(dates)];
      
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24*60*60*1000).toDateString();
      
      // Start counting from today or yesterday
      let currentDate = uniqueDates.includes(today) ? new Date() : new Date(Date.now() - 24*60*60*1000);
      
      for (const dateStr of uniqueDates) {
        if (dateStr === currentDate.toDateString()) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Failed to calculate streak:', error);
      return 0;
    }
  }

  getAvatar(name) {
    const avatars = {
      'Mariem': '👩',
      'Yazid': '👦', 
      'Yahya': '👶',
      'Ghassan': '👨'
    };
    return avatars[name] || name.charAt(0).toUpperCase();
  }

  async addChore() {
    if (!this.newChore.title.trim() || !this.newChore.assignee) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')  
        .select('family_id')
        .eq('user_id', this.session.user.id)
        .single();

      // Prepare the payload and apply kind mapping
      const payload = {
        family_id: profile.family_id,
        user_id: this.newChore.assignee,
        kind: 'chore',
        points: this.newChore.points,
        meta: {
          title: this.newChore.title,
          status: 'todo',
          assigned_by: this.session.user.id
        }
      };

      if (payload.kind && KIND_MAP[payload.kind]) {
        payload.kind = KIND_MAP[payload.kind];
      }

      const { data, error } = await supabase
        .from('acts')
        .insert(payload)
        .select(`
          *,
          assignee_profile:profiles!user_id(full_name)
        `)
        .single();

      if (error) throw error;
      
      this.chores = [data, ...this.chores];
      this.newChore = { title: '', assignee: '', points: 1 };
      showSuccess('Chore added successfully!');
    } catch (error) {
      console.error('Failed to add chore:', error);
      showError('Failed to add chore');
    }
  }

  async updateChoreStatus(chore, newStatus) {
    try {
      const meta = { ...chore.meta, status: newStatus };
      if (newStatus === 'done' && chore.meta.status !== 'done') {
        meta.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('acts')
        .update({ meta })
        .eq('id', chore.id);

      if (error) throw error;

      // Update local state
      const index = this.chores.findIndex(c => c.id === chore.id);
      if (index > -1) {
        this.chores[index] = { ...chore, meta };
        this.requestUpdate();
      }

      // Recalculate streaks if chore was completed
      if (newStatus === 'done') {
        await this.calculateStreaks();
        
        // Check if user hit 7+ day streak and offer to share
        const userStreak = this.streaks[chore.user_id];
        if (userStreak && userStreak.count >= 7) {
          this.offerStreakShare(chore.user_id, userStreak);
        }
      }

      showSuccess(`Chore marked as ${newStatus}`);
    } catch (error) {
      console.error('Failed to update chore status:', error);
      showError('Failed to update chore status');
    }
  }

  async offerStreakShare(userId, streak) {
    const share = confirm(
      `🔥 Amazing! ${streak.name} has a ${streak.count}-day streak! Share this achievement with the family?`
    );

    if (share) {
      try {
        await FamilyBot.postToFeed(
          userId,
          `🔥 Incredible! ${streak.name} just hit a ${streak.count}-day chore streak! Way to go! 💪✨`
        );
        showSuccess('Streak shared with the family!');
      } catch (error) {
        console.error('Failed to share streak:', error);
      }
    }
  }

  async deleteChore(chore) {
    if (!confirm(`Delete "${chore.meta.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('acts')
        .delete()
        .eq('id', chore.id);

      if (error) throw error;
      
      this.chores = this.chores.filter(c => c.id !== chore.id);
      showSuccess('Chore deleted');
    } catch (error) {
      console.error('Failed to delete chore:', error);
      showError('Failed to delete chore');
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="page-header">
          <div class="page-title">
            <iconify-icon icon="material-symbols:checklist"></iconify-icon>
            <h1>Chores</h1>
          </div>
        </div>
        <div>Loading chores...</div>
      `;
    }

    return html`
      <div class="page-header">
        <div class="page-title">
          <iconify-icon icon="material-symbols:checklist"></iconify-icon>
          <h1 id="main-content" tabindex="-1">Family Chores</h1>
        </div>
      </div>

      <!-- Add New Chore -->
      <div class="section">
        <h2 class="section-title">
          <iconify-icon icon="material-symbols:add-task"></iconify-icon>
          Add New Chore
        </h2>
        
        <div class="add-chore-form">
          <div class="form-group">
            <label class="form-label">Chore Description</label>
            <input type="text" class="form-input" 
                   placeholder="e.g., Clean room, Take out trash..."
                   .value=${this.newChore.title}
                   @input=${(e) => this.newChore.title = e.target.value}>
          </div>

          <div class="form-group">
            <label class="form-label">Assigned To</label>
            <select class="form-select" 
                    .value=${this.newChore.assignee}
                    @change=${(e) => this.newChore.assignee = e.target.value}>
              <option value="">Select person</option>
              ${this.familyProfiles.map(profile => html`
                <option value=${profile.user_id}>${profile.full_name}</option>
              `)}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Points</label>
            <input type="number" class="form-input" min="1" max="10"
                   .value=${this.newChore.points}
                   @input=${(e) => this.newChore.points = parseInt(e.target.value) || 1}>
          </div>

          <button class="btn btn-primary" @click=${this.addChore}>
            <iconify-icon icon="material-symbols:add"></iconify-icon>
            Add Chore
          </button>
        </div>
      </div>

      <!-- Streak Display -->
      ${Object.keys(this.streaks).length > 0 ? html`
        <div class="section">
          <h2 class="section-title">
            <iconify-icon icon="material-symbols:local-fire-department"></iconify-icon>
            Chore Streaks
          </h2>
          
          <div class="streaks-section">
            ${Object.values(this.streaks).map(streak => html`
              <div class="streak-card">
                <div class="streak-avatar">${streak.avatar}</div>
                <div class="streak-name">${streak.name}</div>
                <div class="streak-count">${streak.count}</div>
                <div class="streak-label">${streak.count === 1 ? 'day' : 'days'} in a row</div>
                ${streak.count >= 7 ? html`
                  <div class="share-offer">
                    <button class="btn btn-success" 
                            @click=${() => this.offerStreakShare(Object.keys(this.streaks).find(id => this.streaks[id] === streak), streak)}>
                      🎉 Share Achievement!
                    </button>
                  </div>
                ` : ''}
              </div>
            `)}
          </div>
        </div>
      ` : ''}

      <!-- Chores List -->
      <div class="section">
        <h2 class="section-title">
          <iconify-icon icon="material-symbols:format-list-bulleted"></iconify-icon>
          Current Chores
        </h2>

        ${this.chores.length === 0 ? html`
          <div class="empty-state">
            <iconify-icon icon="material-symbols:checklist"></iconify-icon>
            <h3>No chores yet</h3>
            <p>Add the first chore to get started!</p>
          </div>
        ` : html`
          <div class="chores-grid">
            ${this.chores.map(chore => html`
              <div class="chore-card">
                <div class="chore-header">
                  <div>
                    <h3 class="chore-title">${chore.meta.title}</h3>
                    <div class="chore-assignee">
                      Assigned to ${chore.assignee_profile?.full_name || 'Unknown'}
                    </div>
                  </div>
                  <div class="chore-actions">
                    <button class="btn btn-secondary btn-icon" 
                            @click=${() => this.deleteChore(chore)}>
                      <iconify-icon icon="material-symbols:delete"></iconify-icon>
                    </button>
                  </div>
                </div>

                <div class="chore-meta">
                  <span class="chore-points">${chore.points} pts</span>
                  <span class="chore-status status-${chore.meta.status || 'todo'}">
                    ${(chore.meta.status || 'todo').replace('-', ' ')}
                  </span>
                </div>

                ${chore.meta.status !== 'done' ? html`
                  <div style="display: flex; gap: 8px; margin-top: 12px;">
                    ${chore.meta.status === 'todo' ? html`
                      <button class="btn btn-secondary" 
                              @click=${() => this.updateChoreStatus(chore, 'in-progress')}>
                        <iconify-icon icon="material-symbols:play-arrow"></iconify-icon>
                        Start
                      </button>
                    ` : ''}
                    
                    <button class="btn btn-success" 
                            @click=${() => this.updateChoreStatus(chore, 'done')}>
                      <iconify-icon icon="material-symbols:check"></iconify-icon>
                      Complete
                    </button>
                  </div>
                ` : html`
                  <div class="streak-display">
                    <iconify-icon icon="material-symbols:check-circle"></iconify-icon>
                    Completed ${chore.meta.completed_at ? new Date(chore.meta.completed_at).toLocaleDateString() : 'recently'}
                  </div>
                `}
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('fn-chores', FnChores);