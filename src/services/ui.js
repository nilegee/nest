// @ts-check
/**
 * @fileoverview UI service layer for FamilyNest
 * Toast notifications, loading states, and dialog helpers
 */

import { showSuccess, showError, showLoading } from '../toast-helper.js';

/**
 * Show success toast message
 * @param {string} message - Success message to display
 */
export function toastSuccess(message) {
  showSuccess(message);
}

/**
 * Show error toast message
 * @param {string} message - Error message to display
 */
export function toastError(message) {
  showError(message);
}

/**
 * Show loading toast message
 * @param {string} message - Loading message to display
 */
export function toastLoading(message) {
  showLoading(message);
}

/**
 * Show loading state on element during promise execution
 * @param {HTMLElement} element - Element to show loading state on
 * @param {Promise} promise - Promise to await
 * @param {string} [loadingText] - Optional loading text
 * @returns {Promise<any>} Result of the promise
 */
export async function withLoading(element, promise, loadingText = 'Loading...') {
  const originalContent = element.innerHTML;
  const wasDisabled = element.disabled;
  
  // Show loading state
  element.innerHTML = `
    <iconify-icon icon="material-symbols:progress-activity" style="animation: spin 1s linear infinite;"></iconify-icon>
    ${loadingText}
  `;
  element.disabled = true;
  
  try {
    const result = await promise;
    return result;
  } catch (error) {
    throw error;
  } finally {
    // Restore original state
    element.innerHTML = originalContent;
    element.disabled = wasDisabled;
  }
}

/**
 * Create a simple confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} [title] - Dialog title
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export async function confirm(message, title = 'Confirm') {
  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      margin: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    dialog.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 1.25rem;">${title}</h3>
      <p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-btn" style="
          background: #f1f5f9; 
          border: 1px solid #e2e8f0; 
          border-radius: 6px; 
          padding: 8px 16px; 
          cursor: pointer;
          color: #475569;
        ">Cancel</button>
        <button id="confirm-btn" style="
          background: #dc2626; 
          border: 1px solid #dc2626; 
          border-radius: 6px; 
          padding: 8px 16px; 
          cursor: pointer;
          color: white;
        ">Confirm</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Focus management
    const confirmBtn = dialog.querySelector('#confirm-btn');
    const cancelBtn = dialog.querySelector('#cancel-btn');
    
    confirmBtn?.focus();
    
    // Handle clicks
    const cleanup = (result) => {
      document.body.removeChild(overlay);
      resolve(result);
    };
    
    confirmBtn?.addEventListener('click', () => cleanup(true));
    cancelBtn?.addEventListener('click', () => cleanup(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false);
    });
    
    // Handle keyboard
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        cleanup(false);
      } else if (e.key === 'Enter') {
        cleanup(true);
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    
    // Clean up event listener when dialog closes
    const originalCleanup = cleanup;
    cleanup = (result) => {
      document.removeEventListener('keydown', handleKeydown);
      originalCleanup(result);
    };
  });
}

/**
 * Create loading skeleton placeholder
 * @param {number} [lines=3] - Number of skeleton lines
 * @returns {string} HTML string for skeleton
 */
export function createSkeleton(lines = 3) {
  const skeletonLines = Array.from({ length: lines }, (_, i) => {
    const width = i === lines - 1 ? '60%' : '100%';
    return `
      <div style="
        height: 16px;
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
        margin-bottom: 8px;
        width: ${width};
      "></div>
    `;
  }).join('');
  
  return `
    <div class="skeleton-container">
      <style>
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      </style>
      ${skeletonLines}
    </div>
  `;
}