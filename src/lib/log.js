/**
 * @fileoverview Centralized logging for boot warnings
 */

/**
 * Log a boot warning with consistent format
 * @param {string} msg - Warning message
 * @param {any} [ctx] - Optional context
 */
export function bootWarn(msg, ctx) {
  console.warn('[Boot]', msg, ctx || '');
}