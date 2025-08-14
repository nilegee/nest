/**
 * Notes Management Component
 * Private notes with templates for various purposes
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { showSuccess, showError } from './toast-helper.js';

export class FnNotes extends LitElement {
  static properties = {
    session: { type: Object },
    notes: { type: Array },
    loading: { type: Boolean },
    selectedTemplate: { type: String },
    editingNote: { type: Object },
    noteContent: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--theme-border, #e2e8f0);
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .page-title iconify-icon {
      font-size: 32px;
      color: var(--theme-primary, #6366f1);
    }

    .page-title h1 {
      margin: 0;
      font-size: 28px;
      color: var(--theme-text, #1e293b);
    }

    .section {
      background: var(--theme-bg, #ffffff);
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px var(--theme-shadow, rgba(0,0,0,0.1));
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--theme-text, #1e293b);
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .template-card {
      padding: 16px;
      background: var(--theme-bg-secondary, #f8fafc);
      border: 2px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .template-card:hover {
      border-color: var(--theme-primary, #6366f1);
      background: var(--theme-bg-tertiary, #f1f5f9);
    }

    .template-card.selected {
      border-color: var(--theme-primary, #6366f1);
      background: var(--theme-primary, #6366f1);
      color: white;
    }

    .template-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .template-name {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .template-description {
      font-size: 12px;
      opacity: 0.8;
    }

    .composer {
      margin-bottom: 24px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: var(--theme-text, #1e293b);
    }

    .form-textarea {
      width: 100%;
      min-height: 120px;
      padding: 12px;
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      font-size: 14px;
      background: var(--theme-bg, #ffffff);
      color: var(--theme-text, #1e293b);
      font-family: inherit;
      resize: vertical;
      box-sizing: border-box;
    }

    .form-textarea:focus {
      outline: none;
      border-color: var(--theme-primary, #6366f1);
      box-shadow: 0 0 0 3px var(--theme-primary, #6366f1)20;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: var(--theme-radius, 8px);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn-primary {
      background: var(--theme-primary, #6366f1);
      color: white;
    }

    .btn-primary:hover {
      background: var(--theme-primary-dark, #4f46e5);
    }

    .btn-secondary {
      background: var(--theme-bg-secondary, #f8fafc);
      color: var(--theme-text, #1e293b);
      border: 1px solid var(--theme-border, #e2e8f0);
    }

    .btn-secondary:hover {
      background: var(--theme-bg-tertiary, #f1f5f9);
    }

    .btn-small {
      padding: 6px 12px;
      font-size: 12px;
      min-height: 32px;
    }

    .composer-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .note-card {
      background: var(--theme-bg-secondary, #f8fafc);
      border: 1px solid var(--theme-border, #e2e8f0);
      border-radius: var(--theme-radius, 8px);
      padding: 16px;
      transition: all 0.2s;
    }

    .note-card:hover {
      border-color: var(--theme-border-hover, #cbd5e1);
      box-shadow: 0 2px 8px var(--theme-shadow, rgba(0,0,0,0.1));
    }

    .note-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .note-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--theme-text-secondary, #64748b);
    }

    .note-template {
      background: var(--theme-primary, #6366f1);
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 500;
    }

    .note-date {
      opacity: 0.8;
    }

    .note-actions {
      display: flex;
      gap: 8px;
    }

    .note-content {
      white-space: pre-wrap;
      line-height: 1.5;
      color: var(--theme-text, #1e293b);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--theme-text-secondary, #64748b);
    }

    .empty-state iconify-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .editing-indicator {
      background: var(--theme-secondary, #f59e0b);
      color: white;
      padding: 8px 12px;
      border-radius: var(--theme-radius, 8px);
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 16px;
      text-align: center;
    }

    @media (max-width: 768px) {
      :host {
        padding: 16px;
      }

      .template-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .composer-actions {
        flex-wrap: wrap;
      }
    }
  `;

  constructor() {
    super();
    this.notes = [];
    this.loading = true;
    this.selectedTemplate = '';
    this.editingNote = null;
    this.noteContent = '';

    this.templates = [
      {
        id: 'private-checkin',
        name: 'Personal Check-in',
        icon: '💝',
        description: 'Reflect on your day and feelings',
        starter: 'Today I felt...\n\nWhat went well:\n\nWhat I learned:\n\nGrateful for:'
      },
      {
        id: 'private-reflection',
        name: 'Deep Reflection',
        icon: '🤔',
        description: 'Process thoughts and experiences',
        starter: 'I\'ve been thinking about...\n\nThis situation made me feel...\n\nWhat I want to remember:\n\nNext steps:'
      },
      {
        id: 'weekend-ideas',
        name: 'Weekend Planning',
        icon: '🌟',
        description: 'Plan family activities and fun',
        starter: 'Family activity ideas:\n• \n• \n• \n\nPersonal goals:\n• \n• \n\nThings to prepare:'
      },
      {
        id: 'thank-back',
        name: 'Gratitude Response',
        icon: '🙏',
        description: 'Respond to family appreciation',
        starter: 'I want to thank my family for...\n\nSpecifically, I appreciate...\n\nThis made me feel...\n\nI want to give back by:'
      },
      {
        id: 'gaming-highlight',
        name: 'Gaming Reflection',
        icon: '🎮',
        description: 'Share gaming experiences',
        starter: 'Today I played...\n\nBest moment:\n\nWhat I learned:\n\nBalance check - I also spent time:'
      }
    ];
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadNotes();
  }

  async loadNotes() {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('author_id', this.session.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      this.notes = data || [];
      this.loading = false;
    } catch (error) {
      console.error('Failed to load notes:', error);
      this.loading = false;
    }
  }

  selectTemplate(template) {
    this.selectedTemplate = template.id;
    this.noteContent = template.starter;
    this.editingNote = null;
    this.requestUpdate();
  }

  clearComposer() {
    this.selectedTemplate = '';
    this.noteContent = '';
    this.editingNote = null;
    this.requestUpdate();
  }

  async saveNote() {
    if (!this.noteContent.trim()) {
      showError('Please write something before saving');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('user_id', this.session.user.id)
        .single();

      const noteData = {
        family_id: profile.family_id,
        author_id: this.session.user.id,
        body: this.noteContent.trim(),
        meta: { 
          template: this.selectedTemplate || 'free-form',
          updated_at: new Date().toISOString()
        }
      };

      let result;
      if (this.editingNote) {
        // Update existing note
        const { data, error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', this.editingNote.id)
          .select()
          .single();

        if (error) throw error;
        result = data;

        // Update in local array
        const index = this.notes.findIndex(n => n.id === this.editingNote.id);
        if (index > -1) {
          this.notes[index] = result;
        }
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert(noteData)
          .select()
          .single();

        if (error) throw error;
        result = data;

        // Add to local array
        this.notes = [result, ...this.notes];
      }

      this.clearComposer();
      showSuccess(this.editingNote ? 'Note updated!' : 'Note saved!');
    } catch (error) {
      console.error('Failed to save note:', error);
      showError('Failed to save note');
    }
  }

  editNote(note) {
    this.editingNote = note;
    this.noteContent = note.body;
    this.selectedTemplate = note.meta?.template || '';
    this.requestUpdate();
    
    // Scroll to composer
    this.scrollIntoView({ behavior: 'smooth' });
  }

  async deleteNote(note) {
    if (!confirm('Delete this note? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);

      if (error) throw error;
      
      this.notes = this.notes.filter(n => n.id !== note.id);
      
      if (this.editingNote?.id === note.id) {
        this.clearComposer();
      }
      
      showSuccess('Note deleted');
    } catch (error) {
      console.error('Failed to delete note:', error);
      showError('Failed to delete note');
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }

  getTemplateInfo(templateId) {
    return this.templates.find(t => t.id === templateId) || {
      name: 'Free Form',
      icon: '📝'
    };
  }

  render() {
    if (this.loading) {
      return html`
        <div class="page-header">
          <div class="page-title">
            <iconify-icon icon="material-symbols:note"></iconify-icon>
            <h1>Notes</h1>
          </div>
        </div>
        <div>Loading notes...</div>
      `;
    }

    return html`
      <div class="page-header">
        <div class="page-title">
          <iconify-icon icon="material-symbols:note"></iconify-icon>
          <h1 id="main-content" tabindex="-1">Private Notes</h1>
        </div>
      </div>

      <!-- Template Selector -->
      <div class="section">
        <h2 class="section-title">
          <iconify-icon icon="material-symbols:library-books"></iconify-icon>
          Note Templates
        </h2>
        
        <div class="template-grid">
          ${this.templates.map(template => html`
            <div class="template-card ${this.selectedTemplate === template.id ? 'selected' : ''}"
                 @click=${() => this.selectTemplate(template)}>
              <div class="template-icon">${template.icon}</div>
              <div class="template-name">${template.name}</div>
              <div class="template-description">${template.description}</div>
            </div>
          `)}
        </div>
      </div>

      <!-- Note Composer -->
      ${(this.selectedTemplate || this.editingNote) ? html`
        <div class="section composer">
          <h2 class="section-title">
            <iconify-icon icon="material-symbols:edit"></iconify-icon>
            ${this.editingNote ? 'Edit Note' : 'Write Note'}
          </h2>

          ${this.editingNote ? html`
            <div class="editing-indicator">
              ✏️ Editing note from ${this.formatDate(this.editingNote.updated_at)}
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">
              ${this.selectedTemplate ? 
                this.getTemplateInfo(this.selectedTemplate).name : 
                'Free Form Note'}
            </label>
            <textarea class="form-textarea"
                      placeholder="Write your thoughts here..."
                      .value=${this.noteContent}
                      @input=${(e) => this.noteContent = e.target.value}></textarea>
          </div>

          <div class="composer-actions">
            <button class="btn btn-primary" @click=${this.saveNote}>
              <iconify-icon icon="material-symbols:save"></iconify-icon>
              ${this.editingNote ? 'Update Note' : 'Save Note'}
            </button>
            
            <button class="btn btn-secondary" @click=${this.clearComposer}>
              <iconify-icon icon="material-symbols:close"></iconify-icon>
              Cancel
            </button>

            <div style="margin-left: auto; font-size: 12px; color: var(--theme-text-secondary, #64748b);">
              ${this.noteContent.length} characters
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Notes List -->
      <div class="section">
        <h2 class="section-title">
          <iconify-icon icon="material-symbols:format-list-bulleted"></iconify-icon>
          Your Notes (${this.notes.length})
        </h2>

        ${this.notes.length === 0 ? html`
          <div class="empty-state">
            <iconify-icon icon="material-symbols:note-add"></iconify-icon>
            <h3>No notes yet</h3>
            <p>Choose a template above to start writing your first note!</p>
          </div>
        ` : html`
          <div class="notes-list">
            ${this.notes.map(note => {
              const template = this.getTemplateInfo(note.meta?.template);
              return html`
                <div class="note-card">
                  <div class="note-header">
                    <div class="note-meta">
                      <span class="note-template">
                        ${template.icon} ${template.name}
                      </span>
                      <span class="note-date">
                        ${this.formatDate(note.updated_at)}
                      </span>
                    </div>
                    <div class="note-actions">
                      <button class="btn btn-secondary btn-small" 
                              @click=${() => this.editNote(note)}>
                        <iconify-icon icon="material-symbols:edit"></iconify-icon>
                        Edit
                      </button>
                      <button class="btn btn-secondary btn-small" 
                              @click=${() => this.deleteNote(note)}>
                        <iconify-icon icon="material-symbols:delete"></iconify-icon>
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div class="note-content">${note.body}</div>
                </div>
              `;
            })}
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('fn-notes', FnNotes);