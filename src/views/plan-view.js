// @ts-check
/**
 * Plan View - Merged events + goals planning interface
 * Unified planning experience for family events and goals
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { waitForSession } from '../lib/session-store.js';
import { insertWithEvents, updateWithEvents, deleteWithEvents, selectWithEvents } from '../services/db-call.js';
import { emit } from '../services/event-bus.js';
import { checkRateLimit } from '../services/rate-limit.js';
import { formatDateTime } from '../utils/dates.js';
import { showError, showSuccess } from '../toast-helper.js';

export class PlanView extends LitElement {
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

    .tabs {
      display: flex;
      border-bottom: 2px solid var(--border);
      margin-bottom: 24px;
    }

    .tab {
      padding: 12px 24px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-secondary);
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .tab:hover {
      color: var(--primary);
    }

    .tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .creation-form {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 32px;
      border: 1px solid var(--border);
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      align-items: center;
    }

    .form-row input,
    .form-row select,
    .form-row textarea {
      flex: 1;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 1rem;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: var(--radius);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-dark);
    }

    .btn-secondary {
      background: var(--bg-secondary);
      color: var(--text);
    }

    .items-list {
      display: grid;
      gap: 16px;
    }

    .item-card {
      background: white;
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }

    .item-header {
      display: flex;
      justify-content: between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .item-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
      color: var(--text);
    }

    .item-meta {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .item-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      padding: 8px;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: var(--radius);
      color: var(--text-secondary);
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      background: var(--bg-secondary);
      color: var(--text);
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
      margin: 8px 0;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary);
      transition: width 0.3s ease;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--text-secondary);
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
    }

    .empty-state iconify-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      display: block;
    }
  `;

  static properties = {
    activeTab: { type: String },
    events: { type: Array },
    goals: { type: Array },
    loading: { type: Boolean },
    editingItem: { type: Object }
  };

  constructor() {
    super();
    this.activeTab = 'events';
    this.events = [];
    this.goals = [];
    this.loading = false;
    this.editingItem = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.session = await waitForSession();
    if (!this.session) return;
    
    await this.loadData();
  }

  async loadData() {
    await Promise.all([
      this.loadEvents(),
      this.loadGoals()
    ]);
  }

  async loadEvents() {
    try {
      const { data } = await selectWithEvents('events', {}, '*', {
        silent: true
      });
      this.events = data || [];
      this.requestUpdate();
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  async loadGoals() {
    try {
      const { data } = await selectWithEvents('goals', {}, '*', {
        silent: true
      });
      this.goals = data || [];
      this.requestUpdate();
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
  }

  handleTabClick(tab) {
    this.activeTab = tab;
  }

  async handleEventSubmit(e) {
    e.preventDefault();
    
    if (!checkRateLimit(this.session.user.id, 'event_create')) {
      return;
    }

    const formData = new FormData(e.target);
    const title = formData.get('title');
    const startsAt = formData.get('starts_at');
    const location = formData.get('location');

    this.loading = true;

    try {
      const eventData = {
        title: title.trim(),
        starts_at: startsAt,
        location: location?.trim() || null,
        owner_id: this.session.user.id
      };

      if (this.editingItem && this.editingItem.type === 'event') {
        await updateWithEvents('events', { id: this.editingItem.id }, eventData, {
          successMessage: 'Event updated successfully!',
          emitEvent: 'EVENT_UPDATED',
          emitPayload: {
            userId: this.session.user.id,
            eventId: this.editingItem.id
          }
        });
      } else {
        const { data } = await insertWithEvents('events', eventData, {
          successMessage: 'Event created successfully!',
          emitEvent: 'EVENT_SCHEDULED',
          emitPayload: {
            userId: this.session.user.id,
            familyId: this.session.user.family_id
          }
        });
        
        // Emit additional event for FamilyBot
        await emit('EVENT_CREATED', {
          userId: this.session.user.id,
          familyId: this.session.user.family_id,
          event: data
        });
      }

      e.target.reset();
      this.editingItem = null;
      await this.loadEvents();
    } catch (error) {
      console.error('Event operation failed:', error);
    } finally {
      this.loading = false;
    }
  }

  async handleGoalSubmit(e) {
    e.preventDefault();
    
    if (!checkRateLimit(this.session.user.id, 'goal_create')) {
      return;
    }

    const formData = new FormData(e.target);
    const title = formData.get('title');
    const description = formData.get('description');
    const targetDate = formData.get('target_date');

    this.loading = true;

    try {
      const goalData = {
        title: title.trim(),
        description: description?.trim() || null,
        target_date: targetDate || null,
        owner_id: this.session.user.id,
        progress: 0
      };

      if (this.editingItem && this.editingItem.type === 'goal') {
        await updateWithEvents('goals', { id: this.editingItem.id }, goalData, {
          successMessage: 'Goal updated successfully!',
          emitEvent: 'GOAL_UPDATED',
          emitPayload: {
            userId: this.session.user.id,
            goalId: this.editingItem.id
          }
        });
      } else {
        const { data } = await insertWithEvents('goals', goalData, {
          successMessage: 'Goal created successfully!',
          emitEvent: 'GOAL_CREATED',
          emitPayload: {
            userId: this.session.user.id,
            familyId: this.session.user.family_id
          }
        });

        await emit('GOAL_PROGRESS', {
          userId: this.session.user.id,
          familyId: this.session.user.family_id,
          goal: data,
          progress: 0
        });
      }

      e.target.reset();
      this.editingItem = null;
      await this.loadGoals();
    } catch (error) {
      console.error('Goal operation failed:', error);
    } finally {
      this.loading = false;
    }
  }

  async updateGoalProgress(goal, newProgress) {
    if (!checkRateLimit(this.session.user.id, 'goal_progress')) {
      return;
    }

    try {
      await updateWithEvents('goals', { id: goal.id }, { progress: newProgress }, {
        successMessage: `Goal progress updated to ${newProgress}%`,
        emitEvent: 'GOAL_PROGRESS',
        emitPayload: {
          userId: this.session.user.id,
          familyId: this.session.user.family_id,
          goal,
          progress: newProgress
        }
      });

      await this.loadGoals();
    } catch (error) {
      console.error('Failed to update goal progress:', error);
    }
  }

  editItem(item, type) {
    this.editingItem = { ...item, type };
    this.activeTab = type === 'event' ? 'events' : 'goals';
    
    // Populate form fields
    this.requestUpdate();
  }

  cancelEdit() {
    this.editingItem = null;
  }

  async deleteItem(item, type) {
    const entityName = type === 'event' ? 'event' : 'goal';
    if (!confirm(`Are you sure you want to delete this ${entityName}?`)) {
      return;
    }

    try {
      const tableName = type === 'event' ? 'events' : 'goals';
      await deleteWithEvents(tableName, { id: item.id }, {
        successMessage: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} deleted successfully!`,
        emitEvent: type === 'event' ? 'EVENT_DELETED' : 'GOAL_DELETED',
        emitPayload: {
          userId: this.session.user.id,
          [`${entityName}Id`]: item.id
        }
      });

      if (type === 'event') {
        await this.loadEvents();
      } else {
        await this.loadGoals();
      }
    } catch (error) {
      console.error(`Failed to delete ${entityName}:`, error);
    }
  }

  formatEventDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  render() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:calendar-month"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Plan</h1>
      </div>

      <div class="tabs">
        <button 
          class="tab ${this.activeTab === 'events' ? 'active' : ''}"
          @click=${() => this.handleTabClick('events')}>
          <iconify-icon icon="material-symbols:event"></iconify-icon>
          Events
        </button>
        <button 
          class="tab ${this.activeTab === 'goals' ? 'active' : ''}"
          @click=${() => this.handleTabClick('goals')}>
          <iconify-icon icon="material-symbols:flag"></iconify-icon>
          Goals
        </button>
      </div>

      <!-- Events Tab -->
      <div class="tab-content ${this.activeTab === 'events' ? 'active' : ''}">
        <div class="creation-form">
          <h3>${this.editingItem?.type === 'event' ? 'Edit Event' : 'Add New Event'}</h3>
          <form @submit=${this.handleEventSubmit}>
            <div class="form-row">
              <input 
                type="text" 
                name="title" 
                placeholder="Event title" 
                .value=${this.editingItem?.type === 'event' ? this.editingItem.title : ''}
                required>
              <input 
                type="datetime-local" 
                name="starts_at"
                .value=${this.editingItem?.type === 'event' ? this.editingItem.starts_at?.slice(0, 16) : ''}
                required>
            </div>
            <div class="form-row">
              <input 
                type="text" 
                name="location" 
                placeholder="Location (optional)"
                .value=${this.editingItem?.type === 'event' ? (this.editingItem.location || '') : ''}>
              <div class="form-actions">
                ${this.editingItem?.type === 'event' ? html`
                  <button type="button" class="btn btn-secondary" @click=${this.cancelEdit}>
                    Cancel
                  </button>
                ` : ''}
                <button type="submit" class="btn btn-primary" ?disabled=${this.loading}>
                  ${this.loading ? 'Saving...' : this.editingItem?.type === 'event' ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div class="items-list">
          ${this.events.length === 0 ? html`
            <div class="empty-state">
              <iconify-icon icon="material-symbols:event"></iconify-icon>
              <h3>No upcoming events</h3>
              <p>Create the first event for your family!</p>
            </div>
          ` : this.events.map(event => html`
            <div class="item-card">
              <div class="item-header">
                <h4 class="item-title">${event.title}</h4>
                <div class="item-actions">
                  <button class="btn-icon" @click=${() => this.editItem(event, 'event')} 
                          aria-label="Edit event">
                    <iconify-icon icon="material-symbols:edit"></iconify-icon>
                  </button>
                  <button class="btn-icon" @click=${() => this.deleteItem(event, 'event')}
                          aria-label="Delete event">
                    <iconify-icon icon="material-symbols:delete"></iconify-icon>
                  </button>
                </div>
              </div>
              <div class="item-meta">
                <iconify-icon icon="material-symbols:schedule"></iconify-icon>
                ${this.formatEventDate(event.starts_at)}
              </div>
              ${event.location ? html`
                <div class="item-meta">
                  <iconify-icon icon="material-symbols:location-on"></iconify-icon>
                  ${event.location}
                </div>
              ` : ''}
            </div>
          `)}
        </div>
      </div>

      <!-- Goals Tab -->
      <div class="tab-content ${this.activeTab === 'goals' ? 'active' : ''}">
        <div class="creation-form">
          <h3>${this.editingItem?.type === 'goal' ? 'Edit Goal' : 'Add New Goal'}</h3>
          <form @submit=${this.handleGoalSubmit}>
            <div class="form-row">
              <input 
                type="text" 
                name="title" 
                placeholder="Goal title" 
                .value=${this.editingItem?.type === 'goal' ? this.editingItem.title : ''}
                required>
              <input 
                type="date" 
                name="target_date"
                .value=${this.editingItem?.type === 'goal' ? this.editingItem.target_date?.slice(0, 10) : ''}>
            </div>
            <div class="form-row">
              <textarea 
                name="description" 
                placeholder="Goal description (optional)"
                .value=${this.editingItem?.type === 'goal' ? (this.editingItem.description || '') : ''}></textarea>
              <div class="form-actions">
                ${this.editingItem?.type === 'goal' ? html`
                  <button type="button" class="btn btn-secondary" @click=${this.cancelEdit}>
                    Cancel
                  </button>
                ` : ''}
                <button type="submit" class="btn btn-primary" ?disabled=${this.loading}>
                  ${this.loading ? 'Saving...' : this.editingItem?.type === 'goal' ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div class="items-list">
          ${this.goals.length === 0 ? html`
            <div class="empty-state">
              <iconify-icon icon="material-symbols:flag"></iconify-icon>
              <h3>No goals yet</h3>
              <p>Set your first family goal!</p>
            </div>
          ` : this.goals.map(goal => html`
            <div class="item-card">
              <div class="item-header">
                <h4 class="item-title">${goal.title}</h4>
                <div class="item-actions">
                  <button class="btn-icon" @click=${() => this.editItem(goal, 'goal')} 
                          aria-label="Edit goal">
                    <iconify-icon icon="material-symbols:edit"></iconify-icon>
                  </button>
                  <button class="btn-icon" @click=${() => this.deleteItem(goal, 'goal')}
                          aria-label="Delete goal">
                    <iconify-icon icon="material-symbols:delete"></iconify-icon>
                  </button>
                </div>
              </div>
              ${goal.description ? html`
                <div class="item-meta">${goal.description}</div>
              ` : ''}
              ${goal.target_date ? html`
                <div class="item-meta">
                  <iconify-icon icon="material-symbols:calendar-today"></iconify-icon>
                  Target: ${new Date(goal.target_date).toLocaleDateString()}
                </div>
              ` : ''}
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${goal.progress || 0}%"></div>
              </div>
              <div class="item-meta">Progress: ${goal.progress || 0}%</div>
              <div class="form-row" style="margin-top: 12px;">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  .value=${goal.progress || 0}
                  @input=${(e) => this.updateGoalProgress(goal, parseInt(e.target.value))}>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('plan-view', PlanView);