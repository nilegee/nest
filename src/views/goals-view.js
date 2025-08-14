// @ts-check
/**
 * @fileoverview Goals View for FamilyNest
 * Family goals and acts tracking interface
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import * as db from '../services/db.js';
import * as ui from '../services/ui.js';
import { getFamilyId, getUserProfile, getUser } from '../services/session-store.js';
import { ACT_KINDS } from '../constants.js';

// TODO: Remove KIND_MAP once DB acts_kind_check is updated to new values
const KIND_MAP = {
  chore: 'chore_complete',
  goal: 'goal_contrib',
  habit: 'gentle_action',
  note: 'kindness',
  wishlist: 'gentle_action',
  event: 'gentle_action'
};

export class GoalsView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    
    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
    }
    
    .page-header iconify-icon {
      font-size: 2rem;
      color: var(--primary);
    }
    
    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      color: var(--text);
    }
    
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px;
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      margin-bottom: 32px;
    }
    
    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border);
      border-top: 2px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .goal-card {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      margin-bottom: 32px;
    }
    
    .goal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .goal-header h3 {
      margin: 0;
      color: var(--text);
      font-size: 1.25rem;
    }
    
    .goal-progress {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .progress-bar {
      width: 120px;
      height: 8px;
      background: var(--secondary);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: var(--primary);
      transition: width 0.3s ease;
    }
    
    .progress-text {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
    }
    
    .goal-description {
      color: var(--muted);
      margin: 0;
      line-height: 1.5;
    }
    
    .creation-form {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 32px;
      border: 1px solid var(--border);
    }
    
    .creation-form h3 {
      margin: 0 0 16px 0;
      color: var(--text);
      font-size: 1.25rem;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .form-row input,
    .form-row select {
      flex: 1;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-family: inherit;
      font-size: 0.875rem;
      background: var(--background);
      color: var(--text);
    }
    
    .form-row input:focus,
    .form-row select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-light);
    }
    
    .btn {
      padding: 8px 16px;
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    
    .btn-primary {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    
    .btn-primary:hover {
      background: var(--primary-dark);
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .acts-section {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    
    .acts-section h3 {
      margin: 0 0 16px 0;
      color: var(--text);
      font-size: 1.25rem;
    }
    
    .acts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .act-card {
      background: var(--background);
      border-radius: var(--radius);
      padding: 16px;
      border: 1px solid var(--border);
    }
    
    .act-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .act-info {
      flex: 1;
    }
    
    .act-description {
      font-weight: 500;
      color: var(--text);
      display: block;
      margin-bottom: 4px;
    }
    
    .act-meta {
      display: flex;
      gap: 12px;
      font-size: 0.875rem;
      color: var(--muted);
    }
    
    .act-points {
      font-weight: 600;
      color: var(--primary);
      font-size: 1.125rem;
    }
    
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    
    .empty-state iconify-icon {
      font-size: 48px;
      color: var(--muted);
      margin-bottom: 16px;
    }
    
    .empty-state h3 {
      font-size: 1.25rem;
      color: var(--text);
      margin: 0 0 8px 0;
    }
    
    .empty-state p {
      color: var(--muted);
      margin: 0;
    }
    
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }
      
      .goal-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      
      .progress-bar {
        width: 100%;
      }
    }
  `;

  static properties = {
    currentGoal: { type: Object, state: true },
    acts: { type: Array, state: true },
    loading: { type: Boolean, state: true },
    goalsLoading: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this.currentGoal = null;
    this.acts = [];
    this.loading = false;
    this.goalsLoading = true;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadActs();
    this.loadCurrentGoal();
  }

  /**
   * Load acts for user's family
   */
  async loadActs() {
    const familyId = getFamilyId();
    if (!familyId) return;

    try {
      const { data, error } = await db.select(
        'acts',
        { family_id: familyId },
        `*, user:profiles!acts_user_id_fkey(full_name)`,
        'created_at',
        false
      );

      if (error) {
        throw error;
      }

      this.acts = data || [];
      
    } catch (error) {
      console.error('Failed to load acts:', error);
      ui.toastError('Failed to load acts');
    }
  }

  /**
   * Load current family goal (for now, create a simple goal based on acts)
   */
  async loadCurrentGoal() {
    const familyId = getFamilyId();
    if (!familyId) {
      this.goalsLoading = false;
      return;
    }

    try {
      // For now, create a dynamic goal based on family acts
      const totalPoints = this.acts.reduce((sum, act) => sum + (act.points || 0), 0);
      const target = 50; // Target 50 points per week/month
      
      if (totalPoints > 0) {
        this.currentGoal = {
          title: 'Family Kindness Goal',
          description: 'Build stronger family bonds through acts of kindness and helping each other.',
          current: totalPoints,
          target,
          unit: 'points'
        };
      } else {
        this.currentGoal = null;
      }
      
    } catch (error) {
      console.error('Failed to load goal:', error);
    } finally {
      this.goalsLoading = false;
    }
  }

  /**
   * Handle act form submission
   */
  async handleActSubmit(e) {
    e.preventDefault();
    
    const description = e.target.querySelector('#act-description').value;
    const points = parseInt(e.target.querySelector('#act-points').value);
    const kind = e.target.querySelector('#act-kind').value;
    
    if (!description.trim() || !kind || points < 1) {
      ui.toastError('Please fill in all fields with valid values.');
      return;
    }
    
    this.loading = true;
    
    try {
      const success = await this.createAct(kind, points, { description: description.trim() });
      
      if (success) {
        ui.toastSuccess('Act logged successfully!');
        // Clear form
        e.target.reset();
        e.target.querySelector('#act-points').value = '1'; // Reset to default
      }
    } catch (error) {
      console.error('Act submission error:', error);
      ui.toastError('Failed to log act. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Create a new act (goal contribution)
   */
  async createAct(kind, points = 1, meta = {}) {
    const familyId = getFamilyId();
    const user = getUser();
    
    if (!familyId || !user) {
      throw new Error('No family context or user');
    }
    
    // Validate kind against allowed values
    if (!ACT_KINDS.includes(kind)) {
      throw new Error(`Invalid act kind: ${kind}. Must be one of: ${ACT_KINDS.join(', ')}`);
    }
    
    // Prepare the payload and apply kind mapping
    const payload = {
      family_id: familyId,
      user_id: user.id,
      kind,
      points,
      meta
    };

    if (payload.kind && KIND_MAP[payload.kind]) {
      payload.kind = KIND_MAP[payload.kind];
    }
    
    const { data, error } = await db.insert('acts', payload);

    if (error) {
      throw error;
    }

    // Reload data to update UI
    this.loadActs();
    this.loadCurrentGoal();
    
    return true;
  }

  /**
   * Format post date for display (reuse from other views)
   */
  formatPostDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  render() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:flag"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Family Goals & Acts</h1>
      </div>
      
      <!-- Current Goal Display -->
      ${this.goalsLoading ? html`
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <span>Loading goal...</span>
        </div>
      ` : this.currentGoal ? html`
        <div class="goal-card">
          <div class="goal-header">
            <h3>${this.currentGoal.title}</h3>
            <div class="goal-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min((this.currentGoal.current / this.currentGoal.target) * 100, 100)}%"></div>
              </div>
              <span class="progress-text">${this.currentGoal.current}/${this.currentGoal.target} ${this.currentGoal.unit}</span>
            </div>
          </div>
          <p class="goal-description">${this.currentGoal.description}</p>
        </div>
      ` : html`
        <div class="empty-state">
          <iconify-icon icon="material-symbols:flag"></iconify-icon>
          <h3>No active goal</h3>
          <p>Create your first family goal by logging some acts of kindness below!</p>
        </div>
      `}
      
      <!-- Act Creation Form -->
      <div class="creation-form">
        <h3>Log Family Act</h3>
        <form @submit=${this.handleActSubmit}>
          <div class="form-row">
            <input type="text" id="act-description" placeholder="What kind act did you do?" required>
            <input type="number" id="act-points" placeholder="Points" value="1" min="1" max="10" required>
          </div>
          <div class="form-row">
            <select id="act-kind" required>
              <option value="">Select category...</option>
              <option value="kindness">Act of Kindness</option>
              <option value="help">Helping Others</option>
              <option value="chore">Completed Chore</option>
              <option value="learning">Learning Together</option>
              <option value="creativity">Creative Activity</option>
              <option value="exercise">Physical Activity</option>
              <option value="other">Other</option>
            </select>
            <button type="submit" class="btn btn-primary" ?disabled=${this.loading}>
              ${this.loading ? 'Logging...' : 'Log Act'}
            </button>
          </div>
        </form>
      </div>

      <!-- Recent Acts List -->
      <div class="acts-section">
        <h3>Recent Family Acts</h3>
        <div class="acts-list">
          ${this.acts.length > 0 ? html`
            ${this.acts.slice(0, 10).map(act => html`
              <div class="act-card">
                <div class="act-header">
                  <div class="act-info">
                    <span class="act-description">${act.meta?.description || act.kind}</span>
                    <div class="act-meta">
                      <span class="act-author">${act.user?.full_name || 'Family Member'}</span>
                      <span class="act-date">${this.formatPostDate(act.created_at)}</span>
                    </div>
                  </div>
                  <div class="act-points">+${act.points}</div>
                </div>
              </div>
            `)}
          ` : html`
            <div class="empty-state">
              <iconify-icon icon="material-symbols:volunteer-activism"></iconify-icon>
              <h3>No acts logged yet</h3>
              <p>Start logging family acts of kindness and see your goal progress!</p>
            </div>
          `}
        </div>
      </div>
    `;
  }
}

customElements.define('goals-view', GoalsView);