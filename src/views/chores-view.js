// @ts-check
/**
 * @fileoverview Chores View for FamilyNest
 * Wrapper for fn-chores component
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { waitForSession } from '../lib/session-store.js';
import { getSession } from '../services/session-store.js';

// Lazy import the chores component
async function importChoresComponent() {
  try {
    await import('../fn-chores.js');
  } catch (error) {
    console.error('Failed to load chores component:', error);
  }
}

export class ChoresView extends LitElement {
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

  async connectedCallback() {
    super.connectedCallback();
    this.session = await waitForSession();
    if (!this.session) return; // safety
    
    // Import the component when this view is loaded
    importChoresComponent();
  }

  render() {
    return html`<fn-chores .session=${this.session}></fn-chores>`;
  }
}

customElements.define('chores-view', ChoresView);