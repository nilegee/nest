// @ts-check
/**
 * @fileoverview Profile View for FamilyNest
 * Wrapper for fn-profile component
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { getSession } from '../services/session-store.js';

// Lazy import the profile component
async function importProfileComponent() {
  try {
    await import('../fn-profile.js');
  } catch (error) {
    console.error('Failed to load profile component:', error);
  }
}

export class ProfileView extends LitElement {
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
    importProfileComponent();
  }

  render() {
    return html`<fn-profile .session=${this.session}></fn-profile>`;
  }
}

customElements.define('profile-view', ProfileView);