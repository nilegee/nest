// @ts-check
/**
 * Event Bus - Central event coordination system for autonomous FamilyNest
 * Coordinates all system components through domain events
 */

import { supabase } from '../../web/supabaseClient.js';

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.middleware = [];
  }

  /**
   * Subscribe to specific event types
   * @param {string|string[]} eventTypes - Event type(s) to listen for
   * @param {Function} handler - Event handler function
   * @returns {Function} Unsubscribe function
   */
  on(eventTypes, handler) {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
    
    types.forEach(type => {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type).add(handler);
    });

    // Return unsubscribe function
    return () => {
      types.forEach(type => {
        const handlers = this.listeners.get(type);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            this.listeners.delete(type);
          }
        }
      });
    };
  }

  /**
   * Emit a domain event to all relevant listeners
   * @param {string} eventType - Event type (e.g., 'POST_CREATED', 'EVENT_SCHEDULED')
   * @param {Object} payload - Event payload
   */
  async emit(eventType, payload = {}) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      ...payload
    };

    // Apply middleware for logging, validation, etc.
    for (const middleware of this.middleware) {
      try {
        await middleware(event);
      } catch (error) {
        console.warn('Event middleware error:', error);
      }
    }

    // Notify listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const promises = Array.from(listeners).map(handler => {
        try {
          return Promise.resolve(handler(event));
        } catch (error) {
          console.warn(`Event listener error for ${eventType}:`, error);
          return Promise.resolve();
        }
      });
      
      await Promise.allSettled(promises);
    }

    // Log significant events to database (optional, fail silently)
    if (this.shouldLogEvent(eventType)) {
      try {
        await supabase.from('activity_log').insert({
          family_id: payload.familyId,
          user_id: payload.userId,
          event_type: eventType,
          data: payload
        });
      } catch (_) {
        // Silent fail for activity logging
      }
    }
  }

  /**
   * Add middleware for event processing
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Check if event should be logged to database
   * @param {string} eventType - Event type
   * @returns {boolean}
   */
  shouldLogEvent(eventType) {
    const loggedEvents = [
      'POST_CREATED', 'EVENT_SCHEDULED', 'GOAL_PROGRESS', 
      'NOTE_ADDED', 'CHORE_COMPLETED', 'APPRECIATION_SENT'
    ];
    return loggedEvents.includes(eventType);
  }

  /**
   * Get event statistics (for debugging)
   * @returns {Object} Event statistics
   */
  getStats() {
    return {
      listenerTypes: Array.from(this.listeners.keys()),
      totalListeners: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0),
      middlewareCount: this.middleware.length
    };
  }
}

// Global event bus instance
export const eventBus = new EventBus();

// Convenience functions for common event patterns
export const emit = (eventType, payload) => eventBus.emit(eventType, payload);
export const on = (eventTypes, handler) => eventBus.on(eventTypes, handler);

// Export class for testing
export { EventBus };