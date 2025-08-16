/**
 * Events view component
 * Shows upcoming events and provides add event form
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../../web/supabaseClient.js';
import { getUserFamilyId } from '../utils/profile-utils.js';
import { WHITELISTED_EMAILS } from '../../web/env.js';

export class EventsView extends LitElement {
  static properties = {
    events: { type: Array },
    loading: { type: Boolean },
    showForm: { type: Boolean },
    newEvent: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .title {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--text, #1e293b);
    }

    .add-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--primary, #3b82f6);
      color: white;
      border: none;
      border-radius: var(--radius, 8px);
      cursor: pointer;
      font-size: 14px;
    }

    .add-button:hover {
      background: var(--primary-dark, #2563eb);
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .event-card {
      background: white;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: var(--radius, 8px);
      padding: 16px;
      box-shadow: var(--shadow, 0 1px 3px rgba(0,0,0,0.1));
    }

    .event-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .event-icon {
      font-size: 20px;
      color: var(--primary, #3b82f6);
    }

    .event-title {
      font-weight: 600;
      color: var(--text, #1e293b);
    }

    .event-date {
      color: var(--text-light, #64748b);
      font-size: 14px;
    }

    .event-type {
      display: inline-block;
      padding: 2px 8px;
      background: var(--secondary, #f3f4f6);
      border-radius: 12px;
      font-size: 12px;
      color: var(--text-light, #64748b);
      text-transform: capitalize;
    }

    .form-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .form-container {
      background: white;
      border-radius: var(--radius, 8px);
      padding: 24px;
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .form-title {
      font-size: 1.2rem;
      font-weight: bold;
      color: var(--text, #1e293b);
    }

    .close-button {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: var(--text-light, #64748b);
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
      color: var(--text, #1e293b);
    }

    .form-input, .form-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: var(--radius, 8px);
      font-size: 14px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .button {
      padding: 8px 16px;
      border: none;
      border-radius: var(--radius, 8px);
      cursor: pointer;
      font-size: 14px;
    }

    .button-primary {
      background: var(--primary, #3b82f6);
      color: white;
    }

    .button-secondary {
      background: var(--secondary, #f3f4f6);
      color: var(--text, #1e293b);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-light, #64748b);
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: var(--text-light, #64748b);
    }

    .form-help {
      display: block;
      font-size: 12px;
      color: var(--text-light, #64748b);
      margin-top: 4px;
    }

    @media (prefers-reduced-motion: reduce) {
      .add-button,
      .button {
        transition: none;
      }
    }
  `;

  constructor() {
    super();
    this.events = [];
    this.loading = true;
    this.showForm = false;
    this.newEvent = {
      title: '',
      event_date: '',
      type: 'custom',
      recurrence: 'none'
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadEvents();
  }

  async loadEvents() {
    try {
      // Check authentication state before making API calls
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        this.events = [];
        this.loading = false;
        return;
      }

      // Additional check: ensure user is whitelisted before making requests
      if (!WHITELISTED_EMAILS.includes(session.user.email)) {
        this.events = [];
        this.loading = false;
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) {
        // Handle 403 errors gracefully (should not happen for whitelisted users with proper RLS)
        if (error.code === 'PGRST301' || error.message?.includes('403')) {
          console.warn('Events access denied despite whitelisted user - possible RLS policy issue');
          this.events = [];
          this.loading = false;
          return;
        }
        throw error;
      }
      this.events = data || [];
    } catch (error) {
      // Silent error handling - show empty state instead
      this.events = [];
    } finally {
      this.loading = false;
    }
  }

  handleAddEvent() {
    this.showForm = true;
  }

  handleCloseForm() {
    this.showForm = false;
    this.newEvent = {
      title: '',
      event_date: '',
      type: 'custom',
      recurrence: 'none'
    };
  }

  handleInputChange(e) {
    const { name, value } = e.target;
    this.newEvent = { ...this.newEvent, [name]: value };
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // Use utility to get family ID, ensuring profile exists
      const familyId = await getUserFamilyId(
        user.user?.id,
        user.user?.email,
        user.user?.user_metadata
      );

      if (!familyId) {
        throw new Error('Unable to determine family. Please try again.');
      }

      // Prepare event data based on type
      const eventData = {
        title: this.newEvent.title,
        event_date: this.newEvent.event_date,
        type: this.newEvent.type,
        family_id: familyId,
        owner_id: user.user.id
      };

      // Set recurrence automatically for birthdays and anniversaries
      if (this.newEvent.type === 'birthday' || this.newEvent.type === 'anniversary') {
        eventData.is_recurring = true;
        eventData.recurrence_pattern = { frequency: 'yearly' };
      } else {
        eventData.is_recurring = this.newEvent.recurrence === 'annual';
        if (eventData.is_recurring) {
          eventData.recurrence_pattern = { frequency: 'yearly' };
        }
      }

      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) throw error;

      this.handleCloseForm();
      this.loadEvents();
    } catch (error) {
      // Silent error handling - could show user-friendly error message in UI
      // For now, just don't create the event
    }
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getEventIcon(type) {
    switch (type) {
      case 'birthday': return 'mdi:cake';
      case 'anniversary': return 'mdi:heart';
      case 'travel': return 'mdi:airplane';
      case 'appointment': return 'mdi:calendar-clock';
      case 'restaurant': return 'mdi:silverware-fork-knife';
      case 'play_area': return 'mdi:playground';
      default: return 'mdi:calendar';
    }
  }

  /**
   * Calculate days until event
   */
  getDaysUntil(dateString) {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Format countdown text
   */
  getCountdownText(days) {
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days === -1) return 'yesterday';
    if (days < 0) return `${Math.abs(days)} days ago`;
    if (days <= 7) return `in ${days} days`;
    if (days <= 14) return `in ${Math.ceil(days / 7)} week${Math.ceil(days / 7) > 1 ? 's' : ''}`;
    if (days <= 30) return `in ${Math.ceil(days / 7)} weeks`;
    return `in ${Math.ceil(days / 30)} months`;
  }

  /**
   * Generate dynamic display text based on category
   */
  getEventDisplayText(event) {
    const days = this.getDaysUntil(event.event_date);
    const countdownText = this.getCountdownText(days);
    
    switch (event.type) {
      case 'birthday': {
        // Try to calculate age if we can extract it from the title or meta
        const match = event.title.match(/(\w+).*(\d+)/);
        if (match) {
          const name = match[1];
          const currentAge = parseInt(match[2]);
          const nextAge = currentAge + 1;
          return `${name} turns ${nextAge} ${countdownText}`;
        }
        return `${event.title} ${countdownText}`;
      }
      case 'anniversary':
        return `${event.title} ${countdownText}`;
      case 'travel':
        return `${event.title} ${countdownText}`;
      case 'appointment':
        return `${event.title} ${countdownText}`;
      case 'restaurant':
        return `${event.title} ${countdownText}`;
      case 'play_area':
        return `${event.title} ${countdownText}`;
      default:
        return `${event.title} ${countdownText}`;
    }
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align: center; padding: 40px;">Loading events...</div>`;
    }

    return html`
      <div class="header">
        <h1 class="title">Family Events</h1>
        <button class="add-button" @click=${this.handleAddEvent}>
          <iconify-icon icon="material-symbols:add"></iconify-icon>
          Add Event
        </button>
      </div>

      ${this.events.length === 0 ? html`
        <div class="empty-state">
          <iconify-icon icon="material-symbols:event-available" class="empty-icon"></iconify-icon>
          <p>No events yet. Add your first family event!</p>
        </div>
      ` : html`
        <div class="events-list">
          ${this.events.map(event => html`
            <div class="event-card">
              <div class="event-header">
                <iconify-icon icon="${this.getEventIcon(event.type)}" class="event-icon"></iconify-icon>
                <div style="flex: 1;">
                  <div class="event-title">${this.getEventDisplayText(event)}</div>
                  <div class="event-date">${this.formatDate(event.event_date)}</div>
                </div>
                <span class="event-type">${event.type}</span>
              </div>
            </div>
          `)}
        </div>
      `}

      ${this.showForm ? html`
        <div class="form-overlay" @click=${this.handleCloseForm}>
          <div class="form-container" @click=${e => e.stopPropagation()}>
            <div class="form-header">
              <h2 class="form-title">Add New Event</h2>
              <button class="close-button" @click=${this.handleCloseForm}>
                <iconify-icon icon="material-symbols:close"></iconify-icon>
              </button>
            </div>

            <form @submit=${this.handleSubmit}>
              <!-- Step 1: Event Type Selection -->
              <div class="form-group">
                <label class="form-label" for="type">Event Type</label>
                <select
                  id="type"
                  name="type"
                  class="form-select"
                  .value=${this.newEvent.type}
                  @change=${this.handleInputChange}
                >
                  <option value="custom">Custom Event</option>
                  <option value="birthday">🎂 Birthday</option>
                  <option value="anniversary">💕 Anniversary</option>
                </select>
              </div>

              <!-- Step 2: Adaptive Fields Based on Type -->
              ${this.newEvent.type === 'birthday' ? html`
                <div class="form-group">
                  <label class="form-label" for="title">Person's Name</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    class="form-input"
                    .value=${this.newEvent.title}
                    @input=${this.handleInputChange}
                    placeholder="e.g., Sarah's Birthday"
                    required
                  >
                </div>
                <div class="form-group">
                  <label class="form-label" for="event_date">Date of Birth</label>
                  <input
                    type="date"
                    id="event_date"
                    name="event_date"
                    class="form-input"
                    .value=${this.newEvent.event_date}
                    @input=${this.handleInputChange}
                    required
                  >
                  <small class="form-help">Birthday will automatically repeat yearly</small>
                </div>
              ` : this.newEvent.type === 'anniversary' ? html`
                <div class="form-group">
                  <label class="form-label" for="title">Anniversary Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    class="form-input"
                    .value=${this.newEvent.title}
                    @input=${this.handleInputChange}
                    placeholder="e.g., Wedding Anniversary"
                    required
                  >
                </div>
                <div class="form-group">
                  <label class="form-label" for="event_date">Anniversary Date</label>
                  <input
                    type="date"
                    id="event_date"
                    name="event_date"
                    class="form-input"
                    .value=${this.newEvent.event_date}
                    @input=${this.handleInputChange}
                    required
                  >
                  <small class="form-help">Anniversary will automatically repeat yearly</small>
                </div>
              ` : html`
                <div class="form-group">
                  <label class="form-label" for="title">Event Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    class="form-input"
                    .value=${this.newEvent.title}
                    @input=${this.handleInputChange}
                    required
                  >
                </div>
                <div class="form-group">
                  <label class="form-label" for="event_date">Date</label>
                  <input
                    type="date"
                    id="event_date"
                    name="event_date"
                    class="form-input"
                    .value=${this.newEvent.event_date}
                    @input=${this.handleInputChange}
                    required
                  >
                </div>
                <div class="form-group">
                  <label class="form-label" for="recurrence">Recurrence</label>
                  <select
                    id="recurrence"
                    name="recurrence"
                    class="form-select"
                    .value=${this.newEvent.recurrence}
                    @change=${this.handleInputChange}
                  >
                    <option value="none">One-time event</option>
                    <option value="annual">Annual (repeats yearly)</option>
                  </select>
                </div>
              `}

              <div class="form-actions">
                <button type="button" class="button button-secondary" @click=${this.handleCloseForm}>
                  Cancel
                </button>
                <button type="submit" class="button button-primary">
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}
    `;
  }
}

if (!customElements.get('events-view')) {
  customElements.define('events-view', EventsView);
}