/**
 * Centralized toast notification system
 * Provides consistent success/error messaging for DB operations
 */

let toastContainer = null;

/**
 * Initialize toast container
 */
function initToastContainer() {
  if (toastContainer) return;
  
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
  const liveRegion = document.querySelector('[aria-live="polite"]');
  if (liveRegion) {
    // Clear existing content first
    liveRegion.textContent = '';
    
    // Set new content after a brief delay to ensure it's announced
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
    
    // Clear the message after it's been announced
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 3000);
  }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - success | error | info | warning
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
  initToastContainer();
  
  // Announce to screen readers
  announceToScreenReader(message);
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const colors = {
    success: { bg: '#10b981', text: '#ffffff' },
    error: { bg: '#ef4444', text: '#ffffff' },
    warning: { bg: '#f59e0b', text: '#ffffff' },
    info: { bg: '#3b82f6', text: '#ffffff' }
  };
  
  const color = colors[type] || colors.info;
  
  toast.style.cssText = `
    background: ${color.bg};
    color: ${color.text};
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 14px;
    font-weight: 500;
    max-width: 320px;
    pointer-events: auto;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    cursor: pointer;
  `;
  
  // Add icon based on type
  const icons = {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">${icons[type] || icons.info}</span>
      <span>${message}</span>
    </div>
  `;
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: inherit;
    font-size: 18px;
    font-weight: bold;
    margin-left: 8px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  toast.appendChild(closeBtn);
  toastContainer.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });
  
  // Remove function
  const removeToast = () => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  };
  
  // Auto remove after duration
  const autoRemoveTimer = setTimeout(removeToast, duration);
  
  // Click to dismiss
  toast.addEventListener('click', () => {
    clearTimeout(autoRemoveTimer);
    removeToast();
  });
  
  // Close button
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearTimeout(autoRemoveTimer);
    removeToast();
  });
}

/**
 * Show success toast
 * @param {string} message 
 */
export function showSuccess(message) {
  showToast(message, 'success');
}

/**
 * Show error toast
 * @param {string} message 
 */
export function showError(message) {
  showToast(message, 'error', 6000); // Errors stay longer
}

/**
 * Show warning toast
 * @param {string} message 
 */
export function showWarning(message) {
  showToast(message, 'warning');
}

/**
 * Show info toast
 * @param {string} message 
 */
export function showInfo(message) {
  showToast(message, 'info');
}

/**
 * Show loading toast (returns a function to update/dismiss it)
 * @param {string} message 
 */
export function showLoading(message) {
  initToastContainer();
  
  const toast = document.createElement('div');
  toast.className = 'toast toast-loading';
  
  toast.style.cssText = `
    background: #6366f1;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 14px;
    font-weight: 500;
    max-width: 320px;
    pointer-events: auto;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-right: 8px;
  `;
  
  // Add spinner animation if not already added
  if (!document.querySelector('#toast-spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-spinner-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center;">
      <div style="width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
      <span id="loading-message">${message}</span>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });
  
  // Return control functions
  return {
    update: (newMessage) => {
      const messageEl = toast.querySelector('#loading-message');
      if (messageEl) {
        messageEl.textContent = newMessage;
      }
    },
    success: (message) => {
      toast.style.background = '#10b981';
      toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">✅</span>
          <span>${message}</span>
        </div>
      `;
      setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, 2000);
    },
    error: (message) => {
      toast.style.background = '#ef4444';
      toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">❌</span>
          <span>${message}</span>
        </div>
      `;
      setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, 4000);
    },
    dismiss: () => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  };
}