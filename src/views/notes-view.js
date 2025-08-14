// @ts-check
/**
 * @fileoverview Notes View for FamilyNest
 * Wrapper for fn-notes component with template support
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { getSession } from '../services/session-store.js';
import { getTemplateFromHash } from '../router/router.js';

// Lazy import the notes component
async function importNotesComponent() {
  try {
    await import('../fn-notes.js');
  } catch (error) {
    console.error('Failed to load notes component:', error);
  }
}

export class NotesView extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
    }
  `;

  static properties = {
    session: { type: Object, state: true },
    template: { type: String, state: true }
  };

  constructor() {
    super();
    this.session = null;
    this.template = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.session = getSession();
    this.template = getTemplateFromHash();
    
    // Import the component when this view is loaded
    importNotesComponent();
  }

  render() {
    return html`<fn-notes .session=${this.session} .selectedTemplate=${this.template}></fn-notes>`;
  }
}

customElements.define('notes-view', NotesView);