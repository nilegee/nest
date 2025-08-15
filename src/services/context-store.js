// @ts-check
/**
 * Context Store - Derived state management for autonomous FamilyNest
 * Manages derived state that updates based on domain events
 */

import { on } from './event-bus.js';

class ContextStore {
  constructor() {
    this.state = new Map();
    this.subscribers = new Map();
    this.computedState = new Map();
    this.initialized = false;
  }

  /**
   * Initialize context store and event listeners
   */
  init() {
    if (this.initialized) return;

    // Listen to domain events that affect derived state
    const eventHandlers = [
      ['POST_CREATED', this.onPostCreated.bind(this)],
      ['EVENT_SCHEDULED', this.onEventScheduled.bind(this)],
      ['GOAL_PROGRESS', this.onGoalProgress.bind(this)],
      ['USER_LOGIN', this.onUserLogin.bind(this)],
      ['FAMILY_MEMBER_ADDED', this.onFamilyMemberAdded.bind(this)]
    ];

    eventHandlers.forEach(([eventType, handler]) => {
      on(eventType, handler);
    });

    this.initialized = true;
  }

  /**
   * Set state value
   * @param {string} key - State key
   * @param {any} value - State value
   */
  setState(key, value) {
    const oldValue = this.state.get(key);
    this.state.set(key, value);
    
    // Notify subscribers if value changed
    if (oldValue !== value) {
      this.notifySubscribers(key, value, oldValue);
      this.updateComputedState(key);
    }
  }

  /**
   * Get state value
   * @param {string} key - State key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} State value
   */
  getState(key, defaultValue = null) {
    return this.state.get(key) ?? defaultValue;
  }

  /**
   * Subscribe to state changes
   * @param {string|string[]} keys - State key(s) to watch
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(keys, callback) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    
    keyArray.forEach(key => {
      if (!this.subscribers.has(key)) {
        this.subscribers.set(key, new Set());
      }
      this.subscribers.get(key).add(callback);
    });

    // Return unsubscribe function
    return () => {
      keyArray.forEach(key => {
        const callbacks = this.subscribers.get(key);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            this.subscribers.delete(key);
          }
        }
      });
    };
  }

  /**
   * Register computed state that derives from other state
   * @param {string} key - Computed state key
   * @param {string[]} dependencies - Keys this computed state depends on
   * @param {Function} compute - Function to compute the value
   */
  registerComputed(key, dependencies, compute) {
    this.computedState.set(key, { dependencies, compute });
    
    // Subscribe to dependency changes
    this.subscribe(dependencies, () => {
      this.updateComputedState(key);
    });
    
    // Initial computation
    this.updateComputedState(key);
  }

  /**
   * Update computed state value
   * @param {string} triggerKey - Key that triggered the update
   */
  updateComputedState(triggerKey) {
    for (const [computedKey, config] of this.computedState.entries()) {
      if (config.dependencies.includes(triggerKey)) {
        try {
          const dependencyValues = config.dependencies.map(dep => this.getState(dep));
          const computedValue = config.compute(...dependencyValues);
          
          // Use setState to trigger notifications
          this.setState(computedKey, computedValue);
        } catch (error) {
          console.warn(`Error computing ${computedKey}:`, error);
        }
      }
    }
  }

  /**
   * Notify subscribers of state changes
   * @param {string} key - Changed state key
   * @param {any} newValue - New value
   * @param {any} oldValue - Previous value
   */
  notifySubscribers(key, newValue, oldValue) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.warn(`Subscriber error for ${key}:`, error);
        }
      });
    }
  }

  /**
   * Handle post created event
   */
  onPostCreated(event) {
    const currentCount = this.getState('dailyPostCount', 0);
    this.setState('dailyPostCount', currentCount + 1);
    this.setState('lastPostTime', event.timestamp);
    this.setState('lastActivity', event.timestamp);
  }

  /**
   * Handle event scheduled
   */
  onEventScheduled(event) {
    const currentCount = this.getState('upcomingEventsCount', 0);
    this.setState('upcomingEventsCount', currentCount + 1);
    this.setState('lastEventCreated', event.timestamp);
    this.setState('lastActivity', event.timestamp);
  }

  /**
   * Handle goal progress
   */
  onGoalProgress(event) {
    const familyGoalProgress = this.getState('familyGoalProgress', new Map());
    const goalId = event.goal?.id || event.goalId;
    
    if (goalId) {
      familyGoalProgress.set(goalId, event.progress);
      this.setState('familyGoalProgress', familyGoalProgress);
    }
    
    this.setState('lastActivity', event.timestamp);
  }

  /**
   * Handle user login
   */
  onUserLogin(event) {
    const activeUsers = this.getState('activeUsers', new Set());
    activeUsers.add(event.userId);
    this.setState('activeUsers', activeUsers);
    this.setState('lastLoginTime', event.timestamp);
  }

  /**
   * Handle family member added
   */
  onFamilyMemberAdded(event) {
    const memberCount = this.getState('familyMemberCount', 0);
    this.setState('familyMemberCount', memberCount + 1);
  }

  /**
   * Get family engagement score (computed state)
   * @returns {number} Engagement score 0-100
   */
  getFamilyEngagement() {
    return this.getState('familyEngagement', 0);
  }

  /**
   * Get activity summary for UI
   * @returns {Object} Activity summary
   */
  getActivitySummary() {
    return {
      dailyPosts: this.getState('dailyPostCount', 0),
      upcomingEvents: this.getState('upcomingEventsCount', 0),
      activeUsers: this.getState('activeUsers', new Set()).size,
      lastActivity: this.getState('lastActivity', null),
      familyEngagement: this.getFamilyEngagement()
    };
  }

  /**
   * Reset daily counters (call at midnight)
   */
  resetDailyCounters() {
    this.setState('dailyPostCount', 0);
    this.setState('dailyGoalProgress', 0);
    this.setState('dailyAppreciations', 0);
  }

  /**
   * Clear all state
   */
  clear() {
    this.state.clear();
    this.computedState.clear();
    // Keep subscribers for reconnection
  }

  /**
   * Get context store statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      stateKeys: Array.from(this.state.keys()),
      subscriberKeys: Array.from(this.subscribers.keys()),
      computedKeys: Array.from(this.computedState.keys()),
      totalSubscribers: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0)
    };
  }
}

// Global context store instance
export const contextStore = new ContextStore();

// Setup computed states
contextStore.registerComputed(
  'familyEngagement',
  ['dailyPostCount', 'upcomingEventsCount', 'activeUsers', 'lastActivity'],
  (dailyPosts, upcomingEvents, activeUsers, lastActivity) => {
    const now = Date.now();
    const hoursSinceActivity = lastActivity ? (now - lastActivity) / (1000 * 60 * 60) : 24;
    
    let score = 0;
    score += Math.min(dailyPosts * 10, 30); // Max 30 points for posts
    score += Math.min(upcomingEvents * 5, 20); // Max 20 points for events
    score += Math.min(activeUsers.size * 15, 30); // Max 30 points for active users
    score += Math.max(0, 20 - hoursSinceActivity * 2); // Activity recency (max 20)
    
    return Math.min(100, Math.max(0, score));
  }
);

// Auto-initialize when imported
contextStore.init();