/**
 * Events card component
 * Shows upcoming family events and activities
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class FnCardEvents extends LitElement {
  static properties = {
    events: { type: Array }
  };

  static styles = css`
    :host {
      display: block;
    }
    
    .card {
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow);
    }
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .card-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      color: var(--text);
    }
    
    .card-icon {
      color: var(--primary);
      font-size: 1.25rem;
    }
    
    .events-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .event-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
    }
    
    .event-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .event-item:first-child {
      padding-top: 0;
    }
    
    .event-date {
      background: var(--primary);
      color: white;
      border-radius: var(--radius);
      padding: 8px 6px;
      text-align: center;
      min-width: 44px;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1.2;
    }
    
    .event-date-day {
      display: block;
      font-size: 1.125rem;
    }
    
    .event-details {
      flex: 1;
      min-width: 0;
    }
    
    .event-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 4px 0;
      line-height: 1.3;
    }
    
    .event-time {
      font-size: 0.75rem;
      color: var(--text-light);
      margin: 0 0 2px 0;
    }
    
    .event-location {
      font-size: 0.75rem;
      color: var(--text-light);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .no-events {
      text-align: center;
      color: var(--text-light);
      font-size: 0.875rem;
      padding: 24px 0;
    }
    
    .no-events iconify-icon {
      font-size: 2rem;
      margin-bottom: 8px;
      display: block;
      opacity: 0.5;
    }
    
    .add-event-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: var(--radius);
      font-size: 0.75rem;
      cursor: pointer;
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      justify-content: center;
    }
    
    .add-event-btn:hover {
      background: var(--primary-dark);
    }
  `;

  constructor() {
    super();
    // Sample events data - replace with Supabase queries later
    this.events = [
      {
        id: 1,
        title: "Mom's Birthday Dinner",
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        time: "6:00 PM",
        location: "Olive Garden"
      },
      {
        id: 2,
        title: "Soccer Game - Jake",
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        time: "10:00 AM",
        location: "Community Park"
      },
      {
        id: 3,
        title: "Family Movie Night",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        time: "7:30 PM",
        location: "Living Room"
      }
    ];
  }

  /**
   * Format date for display in event card
   */
  formatEventDate(date) {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return { month, day };
  }

  /**
   * Check if event is today
   */
  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Check if event is tomorrow
   */
  isTomorrow(date) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  }

  /**
   * Get relative time description
   */
  getRelativeTime(date) {
    if (this.isToday(date)) return 'Today';
    if (this.isTomorrow(date)) return 'Tomorrow';
    
    const diffTime = date.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Handle adding new event
   */
  addEvent() {
    // TODO: Open event creation modal/form
    console.log('Add new event');
  }

  render() {
    // Filter to upcoming events only
    const upcomingEvents = this.events
      .filter(event => event.date >= new Date())
      .sort((a, b) => a.date - b.date)
      .slice(0, 3); // Show max 3 events

    return html`
      <div class="card">
        <div class="card-header">
          <iconify-icon icon="material-symbols:event" class="card-icon"></iconify-icon>
          <h3 class="card-title">Upcoming Events</h3>
        </div>
        
        ${upcomingEvents.length > 0 ? html`
          <ul class="events-list">
            ${upcomingEvents.map(event => {
              const { month, day } = this.formatEventDate(event.date);
              return html`
                <li class="event-item">
                  <div class="event-date">
                    <span class="event-date-day">${day}</span>
                    ${month}
                  </div>
                  <div class="event-details">
                    <h4 class="event-title">${event.title}</h4>
                    <p class="event-time">
                      ${this.getRelativeTime(event.date)} • ${event.time}
                    </p>
                    <p class="event-location">
                      <iconify-icon icon="material-symbols:location-on" style="font-size: 12px;"></iconify-icon>
                      ${event.location}
                    </p>
                  </div>
                </li>
              `;
            })}
          </ul>
        ` : html`
          <div class="no-events">
            <iconify-icon icon="material-symbols:event-available"></iconify-icon>
            <div>No upcoming events</div>
          </div>
        `}
        
        <button class="add-event-btn" @click=${this.addEvent}>
          <iconify-icon icon="material-symbols:add" style="font-size: 14px;"></iconify-icon>
          Add Event
        </button>
      </div>
    `;
  }
}

customElements.define('fn-card-events', FnCardEvents);