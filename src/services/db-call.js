// @ts-check
/**
 * Database Call Wrapper - Unified error handling and event emission
 * Ensures consistent error handling across all database operations
 */

import { supabase } from '../../web/supabaseClient.js';
import { emit } from './event-bus.js';
import { showError, showSuccess } from '../toast-helper.js';

/**
 * Database operation wrapper with automatic error handling and event emission
 * @param {Function} operation - Database operation function
 * @param {Object} options - Operation options
 * @returns {Promise<any>} Operation result
 */
export async function dbCall(operation, options = {}) {
  const {
    successMessage = null,
    errorMessage = 'Operation failed',
    emitEvent = null,
    emitPayload = {},
    silent = false
  } = options;

  try {
    const result = await operation();
    
    if (result.error) {
      throw new Error(result.error.message || result.error);
    }

    // Show success message if provided
    if (successMessage && !silent) {
      showSuccess(successMessage);
    }

    // Emit domain event if specified
    if (emitEvent) {
      await emit(emitEvent, {
        data: result.data,
        ...emitPayload
      });
    }

    return result;
  } catch (error) {
    console.error('Database operation failed:', error);
    
    if (!silent) {
      showError(errorMessage);
    }
    
    // Emit error event for monitoring
    await emit('DB_ERROR', {
      error: error.message,
      operation: emitEvent || 'unknown',
      ...emitPayload
    });

    throw error;
  }
}

/**
 * Insert data with automatic error handling and event emission
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @param {Object} options - Operation options
 * @returns {Promise<any>} Insert result
 */
export async function insertWithEvents(table, data, options = {}) {
  return dbCall(
    () => supabase.from(table).insert(data).select().single(),
    options
  );
}

/**
 * Update data with automatic error handling and event emission
 * @param {string} table - Table name
 * @param {Object} match - Match conditions
 * @param {Object} updates - Updates to apply
 * @param {Object} options - Operation options
 * @returns {Promise<any>} Update result
 */
export async function updateWithEvents(table, match, updates, options = {}) {
  return dbCall(
    () => {
      let query = supabase.from(table).update(updates);
      Object.entries(match).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      return query.select();
    },
    options
  );
}

/**
 * Delete data with automatic error handling and event emission
 * @param {string} table - Table name
 * @param {Object} match - Match conditions
 * @param {Object} options - Operation options
 * @returns {Promise<any>} Delete result
 */
export async function deleteWithEvents(table, match, options = {}) {
  return dbCall(
    () => {
      let query = supabase.from(table).delete();
      Object.entries(match).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      return query.select();
    },
    options
  );
}

/**
 * Select data with automatic error handling
 * @param {string} table - Table name
 * @param {Object} match - Match conditions
 * @param {string} select - Columns to select
 * @param {Object} options - Operation options
 * @returns {Promise<any>} Select result
 */
export async function selectWithEvents(table, match = {}, select = '*', options = {}) {
  return dbCall(
    () => {
      let query = supabase.from(table).select(select);
      Object.entries(match).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
      return query;
    },
    { ...options, silent: true } // Selects shouldn't show toast messages by default
  );
}

/**
 * Execute RPC with automatic error handling and event emission
 * @param {string} functionName - RPC function name
 * @param {Object} params - Function parameters
 * @param {Object} options - Operation options
 * @returns {Promise<any>} RPC result
 */
export async function rpcWithEvents(functionName, params = {}, options = {}) {
  return dbCall(
    () => supabase.rpc(functionName, params),
    options
  );
}

/**
 * Batch operation with transaction-like behavior
 * @param {Function[]} operations - Array of operation functions
 * @param {Object} options - Operation options
 * @returns {Promise<any[]>} Array of results
 */
export async function batchWithEvents(operations, options = {}) {
  const results = [];
  
  try {
    for (const operation of operations) {
      const result = await operation();
      results.push(result);
    }
    
    if (options.successMessage) {
      showSuccess(options.successMessage);
    }
    
    if (options.emitEvent) {
      await emit(options.emitEvent, {
        results,
        ...options.emitPayload
      });
    }
    
    return results;
  } catch (error) {
    if (options.errorMessage && !options.silent) {
      showError(options.errorMessage);
    }
    
    await emit('BATCH_ERROR', {
      error: error.message,
      completedOperations: results.length,
      totalOperations: operations.length,
      ...options.emitPayload
    });
    
    throw error;
  }
}