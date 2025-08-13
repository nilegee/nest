/**
 * Database Operation Helpers
 * Centralized error handling and toast feedback for Supabase operations
 */

import { showSuccess, showError, showLoading } from './toast-helper.js';

/**
 * Wrap async database operation with toast feedback
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} options - Configuration options
 * @param {string} options.loadingMessage - Loading toast message
 * @param {string} options.successMessage - Success toast message
 * @param {string} options.errorMessage - Base error message
 * @param {boolean} options.showLoading - Show loading toast (default: false)
 * @returns {Promise<any>} Result of the async operation
 */
export async function withToast(asyncFn, options = {}) {
  const {
    loadingMessage = 'Processing...',
    successMessage = 'Operation completed successfully',
    errorMessage = 'Operation failed',
    showLoading: shouldShowLoading = false
  } = options;

  let loadingToast = null;
  
  try {
    if (shouldShowLoading) {
      loadingToast = showLoading(loadingMessage);
    }
    
    const result = await asyncFn();
    
    if (loadingToast) {
      loadingToast.dismiss();
    }
    
    if (successMessage) {
      showSuccess(successMessage);
    }
    
    return result;
  } catch (error) {
    if (loadingToast) {
      loadingToast.dismiss();
    }
    
    console.error('Database operation failed:', error);
    
    // Provide user-friendly error messages
    const userMessage = getUserFriendlyError(error, errorMessage);
    showError(userMessage);
    
    throw error; // Re-throw for component error handling
  }
}

/**
 * Convert Supabase errors to user-friendly messages
 * @param {Error} error - The error object
 * @param {string} baseMessage - Base error message
 * @returns {string} User-friendly error message
 */
function getUserFriendlyError(error, baseMessage) {
  // Handle common Supabase error codes
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        return 'No data found. The requested item may have been deleted.';
      case 'PGRST301':
        return 'Permission denied. You may not have access to this resource.';
      case '23505':
        return 'This item already exists. Please choose a different value.';
      case '23503':
        return 'Cannot complete operation due to related data constraints.';
      case '42501':
        return 'Permission denied. Please check your access rights.';
      default:
        break;
    }
  }
  
  // Handle network errors
  if (error.message?.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Handle auth errors
  if (error.message?.includes('JWT') || error.message?.includes('auth')) {
    return 'Authentication error. Please sign in again.';
  }
  
  // Return base message with error details for debugging
  return `${baseMessage}. ${error.message || 'Please try again.'}`;
}

/**
 * Execute Supabase query with error handling and retry capability
 * @param {Function} queryFn - Function that returns a Supabase query
 * @param {Object} options - Configuration options
 * @returns {Promise<{data: any, error: Error|null, retry: Function}>}
 */
export async function executeQuery(queryFn, options = {}) {
  const retry = () => executeQuery(queryFn, options);
  
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null, retry };
  } catch (error) {
    return { data: null, error, retry };
  }
}

/**
 * Data operation helpers for common patterns
 */
export const dataOps = {
  /**
   * Load data with loading state management
   */
  async load(queryFn, component, loadingProperty, dataProperty, options = {}) {
    component[loadingProperty] = true;
    
    try {
      const { data, error } = await executeQuery(queryFn, options);
      
      if (error) {
        throw error;
      }
      
      component[dataProperty] = data || [];
      component[loadingProperty] = false;
      
      return data;
    } catch (error) {
      component[loadingProperty] = false;
      
      if (options.showToast !== false) {
        const message = getUserFriendlyError(error, options.errorMessage || 'Failed to load data');
        showError(message);
      }
      
      throw error;
    }
  },

  /**
   * Create data with optimistic updates
   */
  async create(queryFn, component, dataProperty, newItem, options = {}) {
    const originalData = component[dataProperty];
    
    // Optimistic update
    if (options.optimistic) {
      component[dataProperty] = [...originalData, newItem];
    }
    
    try {
      const result = await withToast(queryFn, {
        loadingMessage: options.loadingMessage || 'Creating...',
        successMessage: options.successMessage || 'Created successfully',
        errorMessage: options.errorMessage || 'Failed to create item',
        showLoading: true
      });
      
      // Update with server response
      if (!options.optimistic && result.data) {
        component[dataProperty] = [...originalData, result.data[0]];
      }
      
      return result;
    } catch (error) {
      // Revert optimistic update on error
      if (options.optimistic) {
        component[dataProperty] = originalData;
      }
      throw error;
    }
  },

  /**
   * Update data with optimistic updates
   */
  async update(queryFn, component, dataProperty, itemId, updates, options = {}) {
    const originalData = component[dataProperty];
    
    // Optimistic update
    if (options.optimistic) {
      component[dataProperty] = originalData.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );
    }
    
    try {
      const result = await withToast(queryFn, {
        loadingMessage: options.loadingMessage || 'Updating...',
        successMessage: options.successMessage || 'Updated successfully',
        errorMessage: options.errorMessage || 'Failed to update item',
        showLoading: true
      });
      
      return result;
    } catch (error) {
      // Revert optimistic update on error
      if (options.optimistic) {
        component[dataProperty] = originalData;
      }
      throw error;
    }
  },

  /**
   * Delete data with optimistic updates
   */
  async delete(queryFn, component, dataProperty, itemId, options = {}) {
    const originalData = component[dataProperty];
    
    // Optimistic update
    if (options.optimistic) {
      component[dataProperty] = originalData.filter(item => item.id !== itemId);
    }
    
    try {
      const result = await withToast(queryFn, {
        loadingMessage: options.loadingMessage || 'Deleting...',
        successMessage: options.successMessage || 'Deleted successfully',
        errorMessage: options.errorMessage || 'Failed to delete item',
        showLoading: true
      });
      
      return result;
    } catch (error) {
      // Revert optimistic update on error
      if (options.optimistic) {
        component[dataProperty] = originalData;
      }
      throw error;
    }
  }
};