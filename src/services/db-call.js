/**
 * Database call wrapper for consistent error handling and UX
 * Provides unified error handling and success feedback
 */

import { emit } from './event-bus.js';
import { showToast } from '../toast-helper.js';

/**
 * Wrap database operations with consistent error handling
 * @param {Function} run - Async function that performs the database operation
 * @param {Object} options - Configuration options
 * @param {string} [options.label] - Label for tracking/logging (format: 'module:action')
 * @param {boolean} [options.silent] - If true, don't show error toast
 * @returns {Promise<any>} Result from the operation or { error } object
 */
export async function dbCall(run, { label, silent = false } = {}) {
  try {
    const result = await run();
    
    // Emit success event
    emit('DB_OK', { label });
    
    return result;
  } catch (error) {
    console.error(`DB operation failed${label ? ` (${label})` : ''}:`, error);
    
    // Show user-friendly error message
    if (!silent) {
      showToast('Something went wrong. Try again.', 'error');
    }
    
    // Emit error event
    emit('DB_ERROR', { label, error });
    
    return { error };
  }
}