/**
 * Upcoming Events Card - Birthday and Anniversary widgets
 * Shows countdown to upcoming birthdays and anniversaries
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../../web/supabaseClient.js';

export class UpcomingEventsCard extends LitElement {
  static properties = {
    events: { type: Array },
    loading: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .events-container {
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr;
    }

    @media (min-width: 768px) {
      .events-container {
        grid-template-columns: 1fr 1fr;
      }
    }

    .card {
      background: white;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: var(--radius, 8px);
      box-shadow: var(--shadow, 0 1px 3px rgba(0,0,0,0.1));
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 16px 0 16px;
    }

    .card-icon {
      font-size: 20px;
      color: var(--primary, #3b82f6);
    }

    .card-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text, #1e293b);
    }

    .card-content {
      padding: 12px 16px 16px 16px;
    }

    .event-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-light, #f1f5f9);
    }

    .event-item:last-child {
      border-bottom: none;
    }

    .event-info {
      flex: 1;
    }

    .event-name {
      display: block;
      font-weight: 500;
      color: var(--text, #1e293b);
      font-size: 14px;
    }

    .event-countdown {
      display: block;
      font-size: 12px;
      color: var(--text-light, #64748b);
      margin-top: 2px;
    }

    .event-type-icon {
      font-size: 16px;
      color: var(--text-light, #64748b);
    }

    .empty-message {
      color: var(--text-light, #64748b);
      font-size: 14px;
      text-align: center;
      margin: 0;
      padding: 16px 0;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border, #e2e8f0);
      border-top: 2px solid var(--primary, #3b82f6);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  constructor() {
    super();
    this.events = [];
    this.loading = true;
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

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('type', ['birthday', 'anniversary'])
        .order('event_date', { ascending: true });

      if (error) {
        // Handle 403 errors gracefully (RLS policy issues)
        if (error.code === 'PGRST301' || error.message?.includes('403')) {
          this.events = [];
          this.loading = false;
          return;
        }
        throw error;
      }
      this.events = data || [];
    } catch (error) {
      // Silent error handling
      this.events = [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Calculate age for birthday events
   */
  calculateAge(eventDate, eventTitle) {
    const today = new Date();
    const birthDate = new Date(eventDate);
    
    // Extract current age from title if available (e.g., "Sarah's 25th Birthday")
    const ageMatch = eventTitle.match(/(\d+)(?:st|nd|rd|th)/);
    if (ageMatch) {
      return parseInt(ageMatch[1]) + 1;
    }
    
    // Calculate age based on year difference
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return Math.max(1, age + 1); // Next birthday age, minimum 1
  }

  /**
   * Calculate years for anniversary events
   */
  calculateAnniversaryYears(eventDate, eventTitle) {
    const today = new Date();
    const anniversaryDate = new Date(eventDate);
    
    // Extract current years from title if available
    const yearsMatch = eventTitle.match(/(\d+)(?:st|nd|rd|th)/);
    if (yearsMatch) {
      return parseInt(yearsMatch[1]) + 1;
    }
    
    // Calculate years based on year difference
    let years = today.getFullYear() - anniversaryDate.getFullYear();
    const monthDiff = today.getMonth() - anniversaryDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < anniversaryDate.getDate())) {
      years--;
    }
    
    return Math.max(1, years + 1); // Next anniversary years, minimum 1
  }

  /**
   * Calculate days until event (considering yearly recurrence)
   */
  getDaysUntilEvent(eventDate) {
    const today = new Date();
    const event = new Date(eventDate);
    
    // Set this year's occurrence
    const thisYear = new Date(today.getFullYear(), event.getMonth(), event.getDate());
    
    // If this year's occurrence has passed, use next year
    const targetDate = thisYear < today 
      ? new Date(today.getFullYear() + 1, event.getMonth(), event.getDate())
      : thisYear;
    
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Format countdown text
   */
  formatCountdown(days) {
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days < 7) return `in ${days} days`;
    if (days < 30) return `in ${Math.ceil(days / 7)} weeks`;
    if (days < 365) return `in ${Math.ceil(days / 30)} months`;
    return `in ${Math.ceil(days / 365)} years`;
  }

  /**
   * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
   */
  getOrdinal(num) {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const value = num % 100;
    return num + (suffix[(value - 20) % 10] || suffix[value] || suffix[0]);
  }

  /**
   * Get upcoming birthdays
   */
  getUpcomingBirthdays() {
    return this.events
      .filter(event => event.type === 'birthday')
      .map(event => ({
        ...event,
        daysUntil: this.getDaysUntilEvent(event.event_date),
        age: this.calculateAge(event.event_date, event.title)
      }))
      .filter(event => event.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }

  /**
   * Get upcoming anniversaries
   */
  getUpcomingAnniversaries() {
    return this.events
      .filter(event => event.type === 'anniversary')
      .map(event => ({
        ...event,
        daysUntil: this.getDaysUntilEvent(event.event_date),
        years: this.calculateAnniversaryYears(event.event_date, event.title)
      }))
      .filter(event => event.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }

  renderBirthdayCard() {
    const upcomingBirthdays = this.getUpcomingBirthdays();

    if (upcomingBirthdays.length === 0) {
      return html`
        <div class="card">
          <div class="card-header">
            <iconify-icon icon="mdi:cake" class="card-icon"></iconify-icon>
            <h3>Upcoming Birthdays</h3>
          </div>
          <div class="card-content">
            <p class="empty-message">No birthdays coming up</p>
          </div>
        </div>
      `;
    }

    return html`
      <div class="card">
        <div class="card-header">
          <iconify-icon icon="mdi:cake" class="card-icon"></iconify-icon>
          <h3>Upcoming Birthdays</h3>
        </div>
        <div class="card-content">
          ${upcomingBirthdays.map(birthday => {
            const name = birthday.title.replace(/['']s?\s*(birthday|Birthday)/i, '').trim();
            return html`
              <div class="event-item">
                <div class="event-info">
                  <span class="event-name">${name} turns ${birthday.age}</span>
                  <span class="event-countdown">${this.formatCountdown(birthday.daysUntil)}</span>
                </div>
                <iconify-icon icon="mdi:cake" class="event-type-icon"></iconify-icon>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  renderAnniversaryCard() {
    const upcomingAnniversaries = this.getUpcomingAnniversaries();

    if (upcomingAnniversaries.length === 0) {
      return html`
        <div class="card">
          <div class="card-header">
            <iconify-icon icon="mdi:heart" class="card-icon"></iconify-icon>
            <h3>Upcoming Anniversaries</h3>
          </div>
          <div class="card-content">
            <p class="empty-message">No anniversaries coming up</p>
          </div>
        </div>
      `;
    }

    return html`
      <div class="card">
        <div class="card-header">
          <iconify-icon icon="mdi:heart" class="card-icon"></iconify-icon>
          <h3>Upcoming Anniversaries</h3>
        </div>
        <div class="card-content">
          ${upcomingAnniversaries.map(anniversary => {
            const title = anniversary.title.replace(/\s*(anniversary|Anniversary)/i, '').trim();
            const ordinal = this.getOrdinal(anniversary.years);
            return html`
              <div class="event-item">
                <div class="event-info">
                  <span class="event-name">${title} ${ordinal} anniversary</span>
                  <span class="event-countdown">${this.formatCountdown(anniversary.daysUntil)}</span>
                </div>
                <iconify-icon icon="mdi:heart" class="event-type-icon"></iconify-icon>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <div class="spinner"></div>
        </div>
      `;
    }

    return html`
      <div class="events-container">
        ${this.renderBirthdayCard()}
        ${this.renderAnniversaryCard()}
      </div>
    `;
  }
}

if (!customElements.get('upcoming-events-card')) {
  customElements.define('upcoming-events-card', UpcomingEventsCard);
}