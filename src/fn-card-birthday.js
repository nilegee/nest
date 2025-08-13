/**
 * Birthday card component
 * Shows upcoming birthdays and celebrations
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class FnCardBirthday extends LitElement {
  static properties = {
    birthdays: { type: Array },
    showCelebration: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
    }
    
    .card {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
    }
    
    .card::before {
      content: '';
      position: absolute;
      top: -20px;
      right: -20px;
      width: 60px;
      height: 60px;
      background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
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
      color: #8b5a3c;
    }
    
    .card-icon {
      color: #d97706;
      font-size: 1.25rem;
    }
    
    .birthday-item {
      background: rgba(255, 255, 255, 0.3);
      border-radius: var(--radius);
      padding: 16px;
      margin-bottom: 12px;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
    
    .birthday-item:last-child {
      margin-bottom: 0;
    }
    
    .birthday-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .birthday-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #7c2d12;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .birthday-age {
      background: rgba(255, 255, 255, 0.6);
      color: #7c2d12;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .birthday-date {
      font-size: 0.75rem;
      color: #92400e;
      margin: 0;
    }
    
    .birthday-countdown {
      font-size: 0.75rem;
      color: #d97706;
      font-weight: 500;
      margin: 4px 0 0 0;
    }
    
    .celebration-item {
      background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
      animation: celebrationPulse 2s ease-in-out infinite;
    }
    
    @keyframes celebrationPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
    
    .celebration-text {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }
    
    .celebration-emojis {
      font-size: 1.2rem;
      animation: bounce 1s ease-in-out infinite;
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    
    .no-birthdays {
      text-align: center;
      color: #92400e;
      font-size: 0.875rem;
      padding: 16px 0;
      background: rgba(255, 255, 255, 0.3);
      border-radius: var(--radius);
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
    
    .no-birthdays iconify-icon {
      font-size: 2rem;
      margin-bottom: 8px;
      display: block;
      opacity: 0.6;
    }
    
    .add-birthday-btn {
      background: rgba(255, 255, 255, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.5);
      color: #7c2d12;
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
      font-weight: 500;
    }
    
    .add-birthday-btn:hover {
      background: rgba(255, 255, 255, 0.6);
    }
    
    /* Respect reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .celebration-item {
        animation: none;
      }
      
      .celebration-emojis {
        animation: none;
      }
    }
  `;

  constructor() {
    super();
    this.showCelebration = false;
    
    // Sample birthday data - replace with Supabase queries later
    this.birthdays = [
      {
        id: 1,
        name: "Mom",
        birthDate: new Date(new Date().getFullYear(), 11, 15), // December 15th this year
        avatar: "👩"
      },
      {
        id: 2,
        name: "Jake",
        birthDate: new Date(new Date().getFullYear() + 1, 2, 8), // March 8th next year
        avatar: "👦"
      },
      {
        id: 3,
        name: "Grandpa",
        birthDate: new Date(new Date().getFullYear() + 1, 5, 22), // June 22nd next year
        avatar: "👴"
      }
    ];
  }

  /**
   * Calculate age based on birth date
   */
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age + 1; // Next birthday age
  }

  /**
   * Calculate days until birthday
   */
  daysUntilBirthday(birthDate) {
    const today = new Date();
    const currentYear = today.getFullYear();
    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    // If birthday has passed this year, use next year
    if (nextBirthday < today) {
      nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
    }
    
    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Check if birthday is today
   */
  isBirthdayToday(birthDate) {
    const today = new Date();
    return today.getMonth() === birthDate.getMonth() && 
           today.getDate() === birthDate.getDate();
  }

  /**
   * Get countdown text
   */
  getCountdownText(days) {
    if (days === 0) return "Today! 🎉";
    if (days === 1) return "Tomorrow";
    if (days < 7) return `In ${days} days`;
    if (days < 30) return `In ${Math.floor(days / 7)} weeks`;
    return `In ${Math.floor(days / 30)} months`;
  }

  /**
   * Format birthday date
   */
  formatBirthdayDate(birthDate) {
    return birthDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Handle adding new birthday
   */
  addBirthday() {
    // TODO: Open birthday creation modal/form
    console.log('Add new birthday');
  }

  render() {
    // Sort birthdays by days until next occurrence
    const sortedBirthdays = [...this.birthdays]
      .map(birthday => ({
        ...birthday,
        daysUntil: this.daysUntilBirthday(birthday.birthDate),
        isToday: this.isBirthdayToday(birthday.birthDate)
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3); // Show max 3 upcoming birthdays

    return html`
      <div class="card">
        <div class="card-header">
          <iconify-icon icon="material-symbols:cake" class="card-icon"></iconify-icon>
          <h3 class="card-title">Birthdays & Celebrations</h3>
        </div>
        
        ${sortedBirthdays.length > 0 ? html`
          ${sortedBirthdays.map(birthday => html`
            <div class="birthday-item ${birthday.isToday ? 'celebration-item' : ''}">
              ${birthday.isToday ? html`
                <div class="celebration-text">
                  <span class="celebration-emojis">🎉🎂✨</span>
                  Happy Birthday!
                </div>
              ` : ''}
              
              <div class="birthday-header">
                <div class="birthday-name">
                  <span>${birthday.avatar}</span>
                  ${birthday.name}
                </div>
                <div class="birthday-age">
                  ${this.calculateAge(birthday.birthDate)}
                </div>
              </div>
              
              <p class="birthday-date">
                ${this.formatBirthdayDate(birthday.birthDate)}
              </p>
              
              <p class="birthday-countdown">
                ${this.getCountdownText(birthday.daysUntil)}
              </p>
            </div>
          `)}
        ` : html`
          <div class="no-birthdays">
            <iconify-icon icon="material-symbols:celebration"></iconify-icon>
            <div>No upcoming birthdays</div>
          </div>
        `}
        
        <button class="add-birthday-btn" @click=${this.addBirthday}>
          <iconify-icon icon="material-symbols:add" style="font-size: 14px;"></iconify-icon>
          Add Birthday
        </button>
      </div>
    `;
  }
}

customElements.define('fn-card-birthday', FnCardBirthday);