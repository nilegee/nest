/**
 * Tip card component
 * Shows "Do You Know?" tips with swap/got it functionality
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';

export class FnCardTip extends LitElement {
  static properties = {
    currentTip: { type: Number },
    dismissed: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
    }
    
    .card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
    }
    
    .card::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      pointer-events: none;
    }
    
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }
    
    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    
    .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .tip-content {
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 16px;
      opacity: 0.95;
    }
    
    .tip-actions {
      display: flex;
      gap: 8px;
    }
    
    .tip-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 6px 12px;
      border-radius: var(--radius);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
    }
    
    .tip-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
    }
    
    .dismissed-state {
      text-align: center;
      opacity: 0.8;
    }
    
    .dismissed-state iconify-icon {
      font-size: 2rem;
      margin-bottom: 8px;
      display: block;
    }
    
    .restore-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 8px 16px;
      border-radius: var(--radius);
      font-size: 0.75rem;
      cursor: pointer;
      margin-top: 12px;
    }
  `;

  constructor() {
    super();
    this.currentTip = 0;
    this.dismissed = false;
    
    this.tips = [
      {
        title: "Family Communication",
        content: "Regular family meetings can improve communication by 40%. Try scheduling a weekly 15-minute check-in where everyone shares one highlight and one challenge."
      },
      {
        title: "Gratitude Practice",
        content: "Expressing gratitude increases family satisfaction by 25%. Consider starting dinner with everyone sharing one thing they're grateful for today."
      },
      {
        title: "Quality Time",
        content: "Families who eat together 5+ times per week have children who are 40% more likely to get A's and B's in school. Turn off devices during meals!"
      },
      {
        title: "Conflict Resolution",
        content: "The 24-hour rule: When upset, wait 24 hours before discussing big issues. This reduces emotional reactivity and improves problem-solving by 60%."
      },
      {
        title: "Shared Responsibilities",
        content: "Children who do chores have higher self-esteem and better academic performance. Start with 10-15 minutes of age-appropriate tasks daily."
      }
    ];
  }

  /**
   * Get next tip in rotation
   */
  swapTip() {
    this.currentTip = (this.currentTip + 1) % this.tips.length;
  }

  /**
   * Mark tip as understood and dismiss
   */
  gotIt() {
    this.dismissed = true;
  }

  /**
   * Restore tip view
   */
  restore() {
    this.dismissed = false;
  }

  /**
   * Close entire card
   */
  close() {
    this.style.display = 'none';
  }

  render() {
    const tip = this.tips[this.currentTip];
    
    return html`
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <iconify-icon icon="material-symbols:lightbulb"></iconify-icon>
            Tip of the Day (Static)
          </h3>
          <button class="close-btn" @click=${this.close} aria-label="Close tip">
            <iconify-icon icon="material-symbols:close" style="font-size: 16px;"></iconify-icon>
          </button>
        </div>
        
        ${!this.dismissed ? html`
          <div class="tip-content">
            <strong>${tip.title}</strong><br>
            ${tip.content}
          </div>
          
          <div class="tip-actions">
            <button class="tip-btn" @click=${this.swapTip}>
              <iconify-icon icon="material-symbols:swap-horiz" style="font-size: 14px;"></iconify-icon>
              Swap
            </button>
            <button class="tip-btn" @click=${this.gotIt}>
              <iconify-icon icon="material-symbols:check" style="font-size: 14px;"></iconify-icon>
              Got it
            </button>
          </div>
        ` : html`
          <div class="dismissed-state">
            <iconify-icon icon="material-symbols:check-circle"></iconify-icon>
            <div>Thanks for reading!</div>
            <button class="restore-btn" @click=${this.restore}>
              Show More Tips
            </button>
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('fn-card-tip', FnCardTip);