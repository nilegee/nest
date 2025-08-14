// @ts-check
/**
 * @fileoverview Insights View for FamilyNest
 * Wrapper for fn-insights component
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { getSession } from '../services/session-store.js';

// Lazy import the insights component
async function importInsightsComponent() {
  try {
    await import('../fn-insights.js');
  } catch (error) {
    console.error('Failed to load insights component:', error);
  }
}

export class InsightsView extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
    }
  `;

  static properties = {
    session: { type: Object, state: true }
  };

  constructor() {
    super();
    this.session = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.session = getSession();
    
    // Import the component when this view is loaded
    importInsightsComponent();
  }

  render() {
    return html`<fn-insights .session=${this.session}></fn-insights>`;
  }
}

customElements.define('insights-view', InsightsView);