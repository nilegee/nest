/**
 * Goal card component
 * Shows family goal progress with meter visualization
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class FnCardGoal extends LitElement {
  static properties = {
    goal: { type: Object },
    showDetails: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
    }
    
    .card {
      background: linear-gradient(135deg, #e0f2fe 0%, #81d4fa 100%);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
    }
    
    .card::before {
      content: '';
      position: absolute;
      top: -30px;
      right: -30px;
      width: 80px;
      height: 80px;
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }
    
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    
    .card-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .card-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      color: #0c4a6e;
    }
    
    .card-icon {
      color: #0284c7;
      font-size: 1.25rem;
    }
    
    .details-toggle {
      background: rgba(255, 255, 255, 0.3);
      border: none;
      color: #0c4a6e;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    
    .details-toggle:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    .goal-main {
      margin-bottom: 16px;
    }
    
    .goal-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0c4a6e;
      margin: 0 0 8px 0;
    }
    
    .goal-description {
      font-size: 0.75rem;
      color: #075985;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }
    
    .progress-section {
      margin-bottom: 16px;
    }
    
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .progress-label {
      font-size: 0.75rem;
      color: #075985;
      font-weight: 500;
    }
    
    .progress-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0c4a6e;
    }
    
    .progress-bar {
      background: rgba(255, 255, 255, 0.4);
      border-radius: 10px;
      height: 20px;
      position: relative;
      overflow: hidden;
    }
    
    .progress-fill {
      background: linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%);
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s ease;
      position: relative;
    }
    
    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
      animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .milestone-marker {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: rgba(255, 255, 255, 0.8);
      transform: translateX(-1px);
    }
    
    .goal-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .stat-item {
      background: rgba(255, 255, 255, 0.3);
      border-radius: var(--radius);
      padding: 8px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
    
    .stat-value {
      font-size: 1rem;
      font-weight: 600;
      color: #0c4a6e;
      margin: 0;
    }
    
    .stat-label {
      font-size: 0.625rem;
      color: #075985;
      margin: 2px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .goal-actions {
      display: flex;
      gap: 8px;
    }
    
    .goal-btn {
      background: rgba(255, 255, 255, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: #0c4a6e;
      padding: 6px 12px;
      border-radius: var(--radius);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
      font-weight: 500;
    }
    
    .goal-btn:hover {
      background: rgba(255, 255, 255, 0.5);
      border-color: rgba(255, 255, 255, 0.6);
    }
    
    .goal-details {
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius);
      padding: 12px;
      margin-top: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 0.75rem;
      color: #075985;
    }
    
    .detail-item:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      margin-bottom: 4px;
      padding-bottom: 8px;
    }
    
    .detail-label {
      font-weight: 500;
    }
    
    .detail-value {
      font-weight: 600;
      color: #0c4a6e;
    }
    
    /* Respect reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .progress-fill::after {
        animation: none;
      }
    }
  `;

  constructor() {
    super();
    this.showDetails = false;
    
    // Sample goal data - replace with Supabase queries later
    this.goal = {
      id: 1,
      title: "Family Fitness Challenge",
      description: "Walk 10,000 steps together as a family every day this month",
      target: 310000, // 10k steps * 31 days
      current: 186000, // 60% progress
      unit: "steps",
      startDate: new Date(2024, 0, 1), // January 1st
      endDate: new Date(2024, 0, 31), // January 31st
      participants: ["Mom", "Dad", "Jake", "Emma"],
      milestones: [
        { percentage: 25, label: "Quarter way there!" },
        { percentage: 50, label: "Halfway milestone!" },
        { percentage: 75, label: "Almost there!" }
      ]
    };
  }

  /**
   * Calculate progress percentage
   */
  getProgressPercentage() {
    return Math.min(100, Math.round((this.goal.current / this.goal.target) * 100));
  }

  /**
   * Get days remaining
   */
  getDaysRemaining() {
    const today = new Date();
    const endDate = new Date(this.goal.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Get days elapsed
   */
  getDaysElapsed() {
    const today = new Date();
    const startDate = new Date(this.goal.startDate);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays + 1);
  }

  /**
   * Format number with commas
   */
  formatNumber(num) {
    return num.toLocaleString();
  }

  /**
   * Toggle details view
   */
  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  /**
   * Handle contributing to goal
   */
  contribute() {
    // TODO: Open contribution modal/form
    console.log('Contribute to goal');
  }

  /**
   * Handle viewing full goal details
   */
  viewFull() {
    // TODO: Open full goal view
    console.log('View full goal');
  }

  render() {
    const progressPercentage = this.getProgressPercentage();
    const daysRemaining = this.getDaysRemaining();
    const daysElapsed = this.getDaysElapsed();
    
    return html`
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <iconify-icon icon="material-symbols:flag" class="card-icon"></iconify-icon>
            <h3 class="card-title">Family Goal</h3>
          </div>
          <button class="details-toggle" @click=${this.toggleDetails} aria-label="Toggle details">
            <iconify-icon 
              icon=${this.showDetails ? 'material-symbols:expand-less' : 'material-symbols:expand-more'}
              style="font-size: 16px;"
            ></iconify-icon>
          </button>
        </div>
        
        <div class="goal-main">
          <h4 class="goal-title">${this.goal.title}</h4>
          <p class="goal-description">${this.goal.description}</p>
        </div>
        
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">Progress</span>
            <span class="progress-value">${progressPercentage}%</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              style="width: ${progressPercentage}%"
            >
              ${this.goal.milestones.map(milestone => html`
                <div 
                  class="milestone-marker" 
                  style="left: ${milestone.percentage}%"
                  title="${milestone.label}"
                ></div>
              `)}
            </div>
          </div>
        </div>
        
        <div class="goal-stats">
          <div class="stat-item">
            <p class="stat-value">${this.formatNumber(this.goal.current)}</p>
            <p class="stat-label">Current</p>
          </div>
          <div class="stat-item">
            <p class="stat-value">${daysRemaining}</p>
            <p class="stat-label">Days Left</p>
          </div>
        </div>
        
        <div class="goal-actions">
          <button class="goal-btn" @click=${this.contribute}>
            <iconify-icon icon="material-symbols:add" style="font-size: 12px;"></iconify-icon>
            Contribute
          </button>
          <button class="goal-btn" @click=${this.viewFull}>
            <iconify-icon icon="material-symbols:open-in-new" style="font-size: 12px;"></iconify-icon>
            View Full
          </button>
        </div>
        
        ${this.showDetails ? html`
          <div class="goal-details">
            <div class="detail-item">
              <span class="detail-label">Target:</span>
              <span class="detail-value">${this.formatNumber(this.goal.target)} ${this.goal.unit}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Days elapsed:</span>
              <span class="detail-value">${daysElapsed}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Participants:</span>
              <span class="detail-value">${this.goal.participants.length}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Daily average:</span>
              <span class="detail-value">${this.formatNumber(Math.round(this.goal.current / daysElapsed))}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('fn-card-goal', FnCardGoal);