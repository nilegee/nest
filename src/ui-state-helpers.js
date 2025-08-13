/**
 * UI State Helpers
 * Unified loading, empty, and error state components for consistent UX
 */

import { html } from 'https://esm.sh/lit@3';

/**
 * Render loading state with spinner and message
 * @param {string} message - Loading message (default: "Loading...")
 * @returns {TemplateResult} Loading template
 */
export function renderLoading(message = 'Loading...') {
  return html`
    <div class="state-container loading-state">
      <div class="spinner"></div>
      <p class="state-message">${message}</p>
    </div>
  `;
}

/**
 * Render empty state with icon, message and optional action
 * @param {Object} options - Empty state configuration
 * @param {string} options.icon - Iconify icon name
 * @param {string} options.title - Title message
 * @param {string} options.description - Description text
 * @param {string} options.actionText - Action button text (optional)
 * @param {Function} options.onAction - Action button handler (optional)
 * @returns {TemplateResult} Empty state template
 */
export function renderEmpty({ 
  icon = 'material-symbols:inbox', 
  title = 'No items yet', 
  description = 'Items will appear here when available.',
  actionText = null,
  onAction = null 
}) {
  return html`
    <div class="state-container empty-state">
      <iconify-icon icon="${icon}" class="state-icon"></iconify-icon>
      <h3 class="state-title">${title}</h3>
      <p class="state-description">${description}</p>
      ${actionText && onAction ? html`
        <button class="btn btn-primary" @click=${onAction}>
          ${actionText}
        </button>
      ` : ''}
    </div>
  `;
}

/**
 * Render error state with message and retry button
 * @param {Object} options - Error state configuration
 * @param {string} options.message - Error message
 * @param {string} options.retryText - Retry button text (default: "Try Again")
 * @param {Function} options.onRetry - Retry button handler
 * @returns {TemplateResult} Error state template
 */
export function renderError({ 
  message = 'Something went wrong', 
  retryText = 'Try Again',
  onRetry 
}) {
  return html`
    <div class="state-container error-state">
      <iconify-icon icon="material-symbols:error" class="state-icon error"></iconify-icon>
      <h3 class="state-title">Unable to load content</h3>
      <p class="state-description">${message}</p>
      ${onRetry ? html`
        <button class="btn btn-secondary" @click=${onRetry}>
          <iconify-icon icon="material-symbols:refresh"></iconify-icon>
          ${retryText}
        </button>
      ` : ''}
    </div>
  `;
}

/**
 * Get loading skeleton for card content
 * @param {number} lines - Number of skeleton lines (default: 3)
 * @returns {TemplateResult} Skeleton template
 */
export function renderSkeleton(lines = 3) {
  const skeletonLines = Array.from({ length: lines }, (_, i) => html`
    <div class="skeleton-line" style="width: ${Math.random() * 40 + 60}%"></div>
  `);
  
  return html`
    <div class="skeleton-container">
      ${skeletonLines}
    </div>
  `;
}

/**
 * CSS styles for state components (to be included in component styles)
 */
export const stateStyles = `
  .state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    min-height: 120px;
  }

  .state-icon {
    font-size: 2.5rem;
    color: var(--text-light);
    margin-bottom: 1rem;
  }

  .state-icon.error {
    color: var(--error);
  }

  .state-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text);
  }

  .state-description {
    margin: 0 0 1.5rem 0;
    color: var(--text-light);
    line-height: 1.5;
    max-width: 300px;
  }

  .loading-state .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border);
    border-top: 2px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .loading-state .state-message {
    margin: 0;
    color: var(--text-light);
    font-size: 0.875rem;
  }

  .skeleton-container {
    padding: 1rem;
  }

  .skeleton-line {
    height: 1rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 0.75rem;
  }

  .skeleton-line:last-child {
    margin-bottom: 0;
    width: 60% !important;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner, .skeleton-line {
      animation: none;
    }
    
    .skeleton-line {
      background: #f0f0f0;
    }
  }
`;