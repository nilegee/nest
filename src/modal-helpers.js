/**
 * Modal Dialog Helpers
 * Provides accessible modal dialogs with focus management
 */

import { html } from 'https://esm.sh/lit@3';

/**
 * Base modal template with accessibility features
 * @param {Object} options - Modal configuration
 * @param {string} options.title - Modal title
 * @param {TemplateResult} options.content - Modal content
 * @param {Array} options.actions - Array of action buttons
 * @param {Function} options.onClose - Close handler
 * @param {boolean} options.closable - Whether modal can be closed (default: true)
 * @returns {TemplateResult} Modal template
 */
export function renderModal({ title, content, actions = [], onClose, closable = true }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closable && onClose) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && closable && onClose) {
      onClose();
    }
  };

  return html`
    <div 
      class="modal-backdrop" 
      @click=${handleBackdropClick}
      @keydown=${handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div class="modal-content">
        <header class="modal-header">
          <h2 id="modal-title" class="modal-title">${title}</h2>
          ${closable ? html`
            <button 
              class="modal-close" 
              @click=${onClose}
              aria-label="Close dialog"
            >
              <iconify-icon icon="material-symbols:close"></iconify-icon>
            </button>
          ` : ''}
        </header>
        
        <div class="modal-body">
          ${content}
        </div>
        
        ${actions.length > 0 ? html`
          <footer class="modal-footer">
            ${actions.map(action => html`
              <button 
                class="btn ${action.variant || 'btn-secondary'}"
                @click=${action.handler}
                ?disabled=${action.disabled}
                ?autofocus=${action.primary}
              >
                ${action.icon ? html`<iconify-icon icon="${action.icon}"></iconify-icon>` : ''}
                ${action.text}
              </button>
            `)}
          </footer>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Confirmation modal for destructive actions
 * @param {Object} options - Confirmation modal options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Confirmation message
 * @param {string} options.confirmText - Confirm button text (default: "Confirm")
 * @param {string} options.cancelText - Cancel button text (default: "Cancel")
 * @param {Function} options.onConfirm - Confirm handler
 * @param {Function} options.onCancel - Cancel handler
 * @param {boolean} options.destructive - Whether action is destructive (default: false)
 * @returns {TemplateResult} Confirmation modal template
 */
export function renderConfirmModal({ 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel,
  destructive = false 
}) {
  const actions = [
    {
      text: cancelText,
      variant: 'btn-secondary',
      handler: onCancel
    },
    {
      text: confirmText,
      variant: destructive ? 'btn-danger' : 'btn-primary',
      handler: onConfirm,
      primary: true
    }
  ];

  const content = html`
    <p class="confirm-message">${message}</p>
  `;

  return renderModal({
    title,
    content,
    actions,
    onClose: onCancel,
    closable: true
  });
}

/**
 * Form modal for data entry
 * @param {Object} options - Form modal options
 * @param {string} options.title - Modal title
 * @param {Array} options.fields - Form field definitions
 * @param {Object} options.data - Initial form data
 * @param {Function} options.onSubmit - Submit handler
 * @param {Function} options.onCancel - Cancel handler
 * @param {string} options.submitText - Submit button text (default: "Save")
 * @param {boolean} options.loading - Whether form is loading (default: false)
 * @returns {TemplateResult} Form modal template
 */
export function renderFormModal({ 
  title, 
  fields = [], 
  data = {}, 
  onSubmit, 
  onCancel, 
  submitText = 'Save',
  loading = false 
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData.entries());
    onSubmit(values);
  };

  const content = html`
    <form @submit=${handleSubmit} class="modal-form">
      ${fields.map(field => renderFormField(field, data[field.name] || field.defaultValue))}
    </form>
  `;

  const actions = [
    {
      text: 'Cancel',
      variant: 'btn-secondary',
      handler: onCancel,
      disabled: loading
    },
    {
      text: loading ? 'Saving...' : submitText,
      variant: 'btn-primary',
      handler: (e) => {
        // Find the form and submit it
        const form = e.target.closest('.modal-content').querySelector('form');
        if (form) form.requestSubmit();
      },
      disabled: loading,
      primary: true
    }
  ];

  return renderModal({
    title,
    content,
    actions,
    onClose: loading ? null : onCancel,
    closable: !loading
  });
}

/**
 * Render form field based on field definition
 * @param {Object} field - Field definition
 * @param {any} value - Field value
 * @returns {TemplateResult} Field template
 */
function renderFormField(field, value = '') {
  const { 
    name, 
    label, 
    type = 'text', 
    required = false, 
    placeholder = '', 
    options = [],
    min,
    max,
    step
  } = field;

  const baseProps = {
    name,
    id: `field-${name}`,
    required,
    placeholder,
    min,
    max,
    step
  };

  let input;
  
  switch (type) {
    case 'select':
      input = html`
        <select ...${baseProps} .value=${value}>
          <option value="" ?selected=${!value}>${placeholder || 'Select...'}</option>
          ${options.map(option => html`
            <option 
              value="${option.value}" 
              ?selected=${value === option.value}
            >
              ${option.label}
            </option>
          `)}
        </select>
      `;
      break;
      
    case 'textarea':
      input = html`
        <textarea ...${baseProps} .value=${value}></textarea>
      `;
      break;
      
    case 'date':
      input = html`
        <input type="date" ...${baseProps} .value=${value} />
      `;
      break;
      
    case 'number':
      input = html`
        <input type="number" ...${baseProps} .value=${value} />
      `;
      break;
      
    default:
      input = html`
        <input type="${type}" ...${baseProps} .value=${value} />
      `;
  }

  return html`
    <div class="form-field">
      <label for="field-${name}" class="form-label">
        ${label}${required ? html`<span class="required">*</span>` : ''}
      </label>
      ${input}
    </div>
  `;
}

/**
 * Focus management helper for modals
 */
export class ModalManager {
  constructor() {
    this.activeModal = null;
    this.previousFocus = null;
    this.focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
  }

  /**
   * Open modal with focus management
   * @param {Element} modalElement - Modal element
   */
  open(modalElement) {
    // Store previous focus
    this.previousFocus = document.activeElement;
    
    // Set current modal
    this.activeModal = modalElement;
    
    // Focus first focusable element or modal itself
    const firstFocusable = modalElement.querySelector(this.focusableSelectors);
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      modalElement.focus();
    }
    
    // Add event listeners
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close modal and restore focus
   */
  close() {
    if (this.activeModal) {
      // Remove event listeners
      document.removeEventListener('keydown', this.handleKeyDown.bind(this));
      document.body.style.overflow = '';
      
      // Restore previous focus
      if (this.previousFocus) {
        this.previousFocus.focus();
      }
      
      // Clear modal reference
      this.activeModal = null;
      this.previousFocus = null;
    }
  }

  /**
   * Handle keyboard navigation in modal
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    if (!this.activeModal) return;

    if (e.key === 'Tab') {
      this.trapFocus(e);
    }
  }

  /**
   * Trap focus within modal
   * @param {KeyboardEvent} e - Tab key event
   */
  trapFocus(e) {
    const focusableElements = Array.from(
      this.activeModal.querySelectorAll(this.focusableSelectors)
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
}

/**
 * CSS styles for modals (to be included in component styles)
 */
export const modalStyles = `
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    backdrop-filter: blur(2px);
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 0 1.5rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
  }

  .modal-close {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--text-light);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-close:hover {
    background: var(--secondary);
    color: var(--text);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .confirm-message {
    margin: 0;
    line-height: 1.6;
    color: var(--text);
  }

  .modal-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-weight: 500;
    color: var(--text);
    font-size: 0.875rem;
  }

  .form-label .required {
    color: var(--error);
    margin-left: 0.25rem;
  }

  .form-field input,
  .form-field select,
  .form-field textarea {
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  .form-field input:focus,
  .form-field select:focus,
  .form-field textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .form-field textarea {
    resize: vertical;
    min-height: 80px;
  }

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0.5rem;
    }
    
    .modal-content {
      max-height: 95vh;
    }
    
    .modal-header,
    .modal-body,
    .modal-footer {
      padding-left: 1rem;
      padding-right: 1rem;
    }
    
    .modal-footer {
      flex-direction: column;
    }
    
    .modal-footer .btn {
      width: 100%;
    }
  }
`;