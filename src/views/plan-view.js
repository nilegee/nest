// @ts-check
/**
 * @fileoverview Plan View for FamilyNest
 * Merged view combining events and goals planning
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { on } from '../services/event-bus.js';
import { selectUpcomingEvents, selectStaleGoals } from '../services/context-store.js';

export class PlanView extends LitElement {
  static properties = {
    loading: { type: Boolean }
  };

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

    .plan-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }

    @media (max-width: 768px) {
      .plan-grid {
        grid-template-columns: 1fr;
      }
    }

    .plan-section {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .section-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
      color: var(--text);
    }

    .section-header iconify-icon {
      font-size: 1.5rem;
      color: var(--primary);
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .quick-action {
      background: var(--primary);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .quick-action:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }

    .empty-state {
      text-align: center;
      padding: 32px 16px;
      color: var(--text-muted);
    }

    .empty-state iconify-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 4px;
      height: 20px;
      margin-bottom: 12px;
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;

  constructor() {
    super();
    this.loading = true;

    // Listen for context updates
    this.contextUnsubscribe = on('context:updated', () => {
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.contextUnsubscribe) {
      this.contextUnsubscribe();
    }
  }

  firstUpdated() {
    // Initial load complete
    this.loading = false;
  }

  /**
   * Render upcoming events section
   */
  renderEventsSection() {
    const upcomingEvents = selectUpcomingEvents();

    return html`
      <div class="plan-section">
        <div class="section-header">
          <iconify-icon icon="material-symbols:event"></iconify-icon>
          <h2>Upcoming Events</h2>
        </div>
        
        <div class="quick-actions">
          <button class="quick-action" @click=${this.addEvent}>
            <iconify-icon icon="material-symbols:add"></iconify-icon>
            Add Event
          </button>
        </div>

        ${this.loading ? this.renderSkeleton() : 
          upcomingEvents.length === 0 ? html`
            <div class="empty-state">
              <iconify-icon icon="material-symbols:event-available"></iconify-icon>
              <p>No upcoming events</p>
              <p>Add an event to get started!</p>
            </div>
          ` : html`
            <!-- Events content from events-view can be embedded here -->
            <events-view embedded></events-view>
          `
        }
      </div>
    `;
  }

  /**
   * Render goals section
   */
  renderGoalsSection() {
    const staleGoals = selectStaleGoals();

    return html`
      <div class="plan-section">
        <div class="section-header">
          <iconify-icon icon="material-symbols:flag"></iconify-icon>
          <h2>Goals & Progress</h2>
        </div>
        
        <div class="quick-actions">
          <button class="quick-action" @click=${this.addGoal}>
            <iconify-icon icon="material-symbols:add"></iconify-icon>
            Add Goal
          </button>
        </div>

        ${this.loading ? this.renderSkeleton() : html`
          <!-- Goals content from goals-view can be embedded here -->
          <goals-view embedded></goals-view>
        `}

        ${staleGoals.length > 0 ? html`
          <div class="stale-goals-notice" style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: var(--radius); color: #92400e;">
            <iconify-icon icon="material-symbols:warning" style="color: #d97706;"></iconify-icon>
            ${staleGoals.length} goal(s) need attention
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render skeleton loader
   */
  renderSkeleton() {
    return html`
      <div class="skeleton" style="width: 80%;"></div>
      <div class="skeleton" style="width: 60%;"></div>
      <div class="skeleton" style="width: 90%;"></div>
    `;
  }

  /**
   * Add new event
   */
  addEvent() {
    // Navigate to events view with new event template
    window.location.hash = '#events?template=new';
  }

  /**
   * Add new goal
   */
  addGoal() {
    // Navigate to goals view with new goal template
    window.location.hash = '#goals?template=new';
  }

  render() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:calendar-month"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Plan</h1>
      </div>
      
      <div class="plan-grid">
        ${this.renderEventsSection()}
        ${this.renderGoalsSection()}
      </div>
    `;
  }
}

customElements.define('plan-view', PlanView);