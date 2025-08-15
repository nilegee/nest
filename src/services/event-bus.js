/**
 * Event Bus - Domain event system for FamilyNest
 * Manages communication between components and services
 */

export const bus = new EventTarget();

/**
 * Emit a domain event
 * @param {string} type - Event type
 * @param {Object} detail - Event payload
 */
export const emit = (type, detail = {}) => {
  bus.dispatchEvent(new CustomEvent(type, { detail }));
};

/**
 * Subscribe to domain events
 * @param {string} type - Event type to listen for
 * @param {Function} fn - Event handler function
 * @returns {Function} Unsubscribe function
 */
export const on = (type, fn) => {
  bus.addEventListener(type, fn);
  return () => bus.removeEventListener(type, fn);
};

// Domain events:
// ACT_LOGGED - Activity has been logged
// POST_CREATED - New post in family feed
// EVENT_SCHEDULED - New event added to calendar
// GOAL_PROGRESS - Progress made on a goal
// NOTE_ADDED - New note added
// APPRECIATION_GIVEN - Appreciation shared
// PREF_UPDATED - User preferences changed
// DB_OK - Database operation succeeded
// DB_ERROR - Database operation failed