// @ts-check
/**
 * @fileoverview Events View for FamilyNest
 * Event management with CRUD operations
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import * as db from '../services/db.js';
import * as ui from '../services/ui.js';
import { insertReturning, deleteById } from '../lib/db-helpers.js';
import { supabase } from '../../web/supabaseClient.js';
import { waitForSession } from '../lib/session-store.js';
import { getFamilyId, getUserProfile, getUser } from '../services/session-store.js';
import { formatDateTime } from '../utils/dates.js';
import { dbCall } from '../services/db-call.js';
import { emit } from '../services/event-bus.js';
import { logAct } from '../services/acts.js';
import { checkRateLimit } from '../services/rate-limit.js';

export class EventsView extends LitElement {
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
    
    .form-row input {
      flex: 1;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-family: inherit;
      font-size: 0.875rem;
      background: var(--background);
      color: var(--text);
    }
    
    .form-row input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-light);
    }
    
    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
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
    
    .btn-secondary {
      background: var(--secondary);
      color: var(--text);
      border-color: var(--border);
    }
    
    .btn-secondary:hover {
      background: var(--secondary-dark);
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
    
    .events-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
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
    
    .event-card {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    
    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .event-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
      color: var(--text);
    }
    
    .event-actions {
      display: flex;
      gap: 8px;
    }
    
    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      background: var(--secondary);
      border-radius: var(--radius);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      color: var(--text);
    }
    
    .btn-icon:hover {
      background: var(--secondary-dark);
    }
    
    .btn-icon.btn-danger {
      background: #fef2f2;
      color: #dc2626;
    }
    
    .btn-icon.btn-danger:hover {
      background: #fee2e2;
    }
    
    .event-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--muted);
      font-size: 0.875rem;
      margin-bottom: 16px;
    }
    
    .event-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .event-date,
    .event-location {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
      font-size: 0.875rem;
    }
    
    .event-date iconify-icon,
    .event-location iconify-icon {
      color: var(--primary);
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
      
      .form-actions {
        flex-direction: column;
      }
    }
  `;

  static properties = {
    events: { type: Array, state: true },
    loading: { type: Boolean, state: true },
    eventsLoading: { type: Boolean, state: true },
    editingEvent: { type: Object, state: true }
  };

  constructor() {
    super();
    this.events = [];
    this.loading = false;
    this.eventsLoading = true;
    this.editingEvent = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.session = await waitForSession();
    if (!this.session) return; // safety
    this.loadEvents();
  }

  /**
   * Load events for user's family
   */
  async loadEvents() {
    const familyId = getFamilyId();
    if (!familyId) {
      this.eventsLoading = false;
      return;
    }

    this.eventsLoading = true;
    
    try {
      const { data, error } = await db.select(
        'events',
        { family_id: familyId },
        `*, owner:profiles!events_owner_id_fkey(full_name)`,
        'starts_at',
        true
      );

      if (error) {
        throw error;
      }

      // Filter for upcoming events
      const now = new Date().toISOString();
      this.events = (data || []).filter(event => event.starts_at >= now);
      
    } catch (error) {
      console.error('Failed to load events:', error);
      ui.toastError('Failed to load events');
    } finally {
      this.eventsLoading = false;
    }
  }

  /**
   * Handle event form submission
   */
  async handleEventSubmit(e) {
    e.preventDefault();
    
    const title = e.target.querySelector('#event-title').value;
    const dateTime = e.target.querySelector('#event-date').value;
    const location = e.target.querySelector('#event-location').value;
    
    if (!title.trim() || !dateTime) {
      ui.toastError('Please provide both title and date for the event.');
      return;
    }
    
    // Validate date is not in the past (allow same day)
    const eventDate = new Date(dateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      ui.toastError('Event date cannot be in the past.');
      return;
    }
    
    this.loading = true;
    
    try {
      let result;
      if (this.editingEvent) {
        result = await this.updateEvent(this.editingEvent.id, title, dateTime, location || null);
      } else {
        result = await this.createEvent(title, dateTime, location || null);
      }
      
      if (result) {
        ui.toastSuccess(this.editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
        // Clear form and editing state
        e.target.reset();
        this.editingEvent = null;
        // Reload events
        this.loadEvents();
      }
    } catch (error) {
      console.error('Event submission error:', error);
      ui.toastError('Failed to save event. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(title, startsAt, location = null) {
    const familyId = getFamilyId();
    const user = getUser();
    
    if (!familyId || !user) {
      throw new Error('No family context or user');
    }

    // Check rate limiting
    if (!checkRateLimit('events:create', user.id)) {
      throw new Error('Please wait before creating another event');
    }
    
    const result = await dbCall(async () => {
      return await insertReturning('events', {
        family_id: familyId,
        owner_id: user.id,
        title: title.trim(),
        location,
        starts_at: startsAt
      }, supabase);
    }, { label: 'events:create' });

    if (result.error) {
      throw result.error;
    }

    const event = result;

    // Log activity
    await logAct({
      type: 'event_created',
      ref_table: 'events',
      ref_id: event.id,
      meta: { title: title.trim(), starts_at: startsAt }
    });

    // Update local state
    this.events = [event, ...this.events];
    this.requestUpdate();

    // Emit domain event
    emit('EVENT_SCHEDULED', { 
      event, 
      userId: user.id, 
      familyId 
    });

    return event;
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId, title, startsAt, location = null) {
    const { data, error } = await db.update(
      'events',
      { id: eventId },
      {
        title: title.trim(),
        location,
        starts_at: startsAt
      }
    );

    if (error) {
      throw error;
    }

    return data?.[0];
  }

  /**
   * Edit an event
   */
  editEvent(event) {
    this.editingEvent = event;
    
    // Populate form with event data
    const form = this.shadowRoot.querySelector('form');
    if (form) {
      form.querySelector('#event-title').value = event.title;
      form.querySelector('#event-location').value = event.location || '';
      
      // Format date for datetime-local input
      const eventDate = new Date(event.starts_at);
      const formattedDate = eventDate.toISOString().slice(0, 16);
      form.querySelector('#event-date').value = formattedDate;
    }
    
    // Scroll to form
    const creationForm = this.shadowRoot.querySelector('.creation-form');
    if (creationForm) {
      creationForm.scrollIntoView({ behavior: 'smooth' });
      // Focus the title field
      setTimeout(() => {
        form.querySelector('#event-title').focus();
      }, 300);
    }
  }

  /**
   * Cancel editing an event
   */
  cancelEditEvent() {
    this.editingEvent = null;
    const form = this.shadowRoot.querySelector('form');
    if (form) {
      form.reset();
    }
  }

  /**
   * Delete an event with confirmation
   */
  async deleteEvent(event) {
    const confirmed = await ui.confirm(
      `Are you sure you want to delete "${event.title}"?\n\nThis action cannot be undone.`,
      'Delete Event'
    );
    
    if (!confirmed) return;
    
    try {
      const { error } = await db.remove('events', { id: event.id });
      
      if (error) {
        throw error;
      }
      
      ui.toastSuccess('Event deleted successfully.');
      this.loadEvents();
      
    } catch (error) {
      console.error('Failed to delete event:', error);
      ui.toastError('Failed to delete event. Please try again.');
    }
  }

  /**
   * Format event date for display
   */
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
        <iconify-icon icon="material-symbols:event"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Family Events</h1>
      </div>
      
      <!-- Event Creation Form -->
      <div class="creation-form">
        <h3>${this.editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
        <form @submit=${this.handleEventSubmit}>
          <div class="form-row">
            <input type="text" id="event-title" placeholder="Event title" required>
            <input type="datetime-local" id="event-date" required>
          </div>
          <div class="form-row">
            <input type="text" id="event-location" placeholder="Location (optional)">
            <div class="form-actions">
              ${this.editingEvent ? html`
                <button type="button" class="btn btn-secondary" @click=${this.cancelEditEvent}>
                  Cancel
                </button>
              ` : ''}
              <button type="submit" class="btn btn-primary" ?disabled=${this.loading}>
                ${this.loading ? 'Saving...' : this.editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Events List -->
      <div class="events-list">
        ${this.eventsLoading ? html`
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <span>Loading events...</span>
          </div>
        ` : this.events.length > 0 ? html`
          ${this.events.map(event => html`
            <div class="event-card">
              <div class="event-header">
                <h4 class="event-title">${event.title}</h4>
                <div class="event-actions">
                  <button class="btn-icon" @click=${() => this.editEvent(event)} 
                          aria-label="Edit event">
                    <iconify-icon icon="material-symbols:edit"></iconify-icon>
                  </button>
                  <button class="btn-icon btn-danger" @click=${() => this.deleteEvent(event)} 
                          aria-label="Delete event">
                    <iconify-icon icon="material-symbols:delete"></iconify-icon>
                  </button>
                </div>
              </div>
              <div class="event-meta">
                <iconify-icon icon="material-symbols:person"></iconify-icon>
                <span>${event.owner?.full_name || 'Family Member'}</span>
              </div>
              <div class="event-details">
                <div class="event-date">
                  <iconify-icon icon="material-symbols:schedule"></iconify-icon>
                  <span>${this.formatEventDate(event.starts_at)}</span>
                </div>
                ${event.location ? html`
                  <div class="event-location">
                    <iconify-icon icon="material-symbols:location-on"></iconify-icon>
                    <span>${event.location}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          `)}
        ` : html`
          <div class="empty-state">
            <iconify-icon icon="material-symbols:event"></iconify-icon>
            <h3>No upcoming events</h3>
            <p>Create the first event for your family!</p>
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('events-view', EventsView);