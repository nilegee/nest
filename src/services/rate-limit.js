// @ts-check
/**
 * Rate Limiting Service - Token bucket implementation for abuse prevention
 * Protects all write operations with user-friendly error messages
 */

import { showError } from '../toast-helper.js';

class RateLimiter {
  constructor() {
    this.buckets = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Check if operation is allowed for user
   * @param {string} userId - User ID
   * @param {string} operation - Operation type (e.g., 'post_create', 'event_create')
   * @param {Object} options - Rate limit options
   * @returns {boolean} Whether operation is allowed
   */
  checkLimit(userId, operation, options = {}) {
    const {
      maxTokens = 10,     // Max tokens in bucket
      refillRate = 1,     // Tokens per minute
      cost = 1            // Tokens consumed per operation
    } = options;

    const key = `${userId}:${operation}`;
    const now = Date.now();
    
    let bucket = this.buckets.get(key);
    
    if (!bucket) {
      bucket = {
        tokens: maxTokens,
        lastRefill: now,
        maxTokens,
        refillRate
      };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time elapsed
    const timeDelta = now - bucket.lastRefill;
    const tokensToAdd = Math.floor((timeDelta / 60000) * bucket.refillRate); // per minute
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Check if enough tokens available
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return true;
    }

    return false;
  }

  /**
   * Enforce rate limit with user-friendly error message
   * @param {string} userId - User ID
   * @param {string} operation - Operation type
   * @param {Object} options - Rate limit options
   * @returns {boolean} Whether operation is allowed
   */
  enforce(userId, operation, options = {}) {
    const allowed = this.checkLimit(userId, operation, options);
    
    if (!allowed) {
      const message = this.getErrorMessage(operation);
      showError(message);
    }
    
    return allowed;
  }

  /**
   * Get user-friendly error message for rate limit
   * @param {string} operation - Operation type
   * @returns {string} Error message
   */
  getErrorMessage(operation) {
    const messages = {
      'post_create': 'Slow down! You\'re posting too quickly. Please wait a moment.',
      'event_create': 'Too many events created. Please wait before creating more.',
      'goal_create': 'Goal creation rate exceeded. Take a breather!',
      'note_create': 'You\'re adding notes very quickly. Please pace yourself.',
      'comment_create': 'Too many comments. Please wait before commenting again.',
      'appreciation_create': 'Appreciation rate exceeded. Quality over quantity!',
      'invite_send': 'Invitation limit reached. Please wait before sending more.',
      'nudge_create': 'Nudge creation rate exceeded. Please be patient.',
      'default': 'You\'re doing that too often. Please slow down.'
    };

    return messages[operation] || messages.default;
  }

  /**
   * Get rate limit configuration for different operations
   * @param {string} operation - Operation type
   * @returns {Object} Rate limit configuration
   */
  getConfig(operation) {
    const configs = {
      // Content creation - moderate limits
      'post_create': { maxTokens: 5, refillRate: 2, cost: 1 },
      'event_create': { maxTokens: 10, refillRate: 5, cost: 1 },
      'goal_create': { maxTokens: 8, refillRate: 3, cost: 1 },
      'note_create': { maxTokens: 15, refillRate: 5, cost: 1 },
      
      // Interactive actions - higher limits
      'comment_create': { maxTokens: 10, refillRate: 3, cost: 1 },
      'appreciation_create': { maxTokens: 5, refillRate: 1, cost: 1 },
      'chore_complete': { maxTokens: 20, refillRate: 10, cost: 1 },
      
      // System actions - stricter limits
      'invite_send': { maxTokens: 3, refillRate: 0.5, cost: 1 },
      'nudge_create': { maxTokens: 2, refillRate: 0.2, cost: 1 },
      'profile_update': { maxTokens: 5, refillRate: 1, cost: 1 },
      
      // Default conservative limits
      'default': { maxTokens: 5, refillRate: 1, cost: 1 }
    };

    return configs[operation] || configs.default;
  }

  /**
   * Check rate limit for specific operation with auto-config
   * @param {string} userId - User ID
   * @param {string} operation - Operation type
   * @returns {boolean} Whether operation is allowed
   */
  check(userId, operation) {
    const config = this.getConfig(operation);
    return this.enforce(userId, operation, config);
  }

  /**
   * Get remaining tokens for user operation
   * @param {string} userId - User ID
   * @param {string} operation - Operation type
   * @returns {number} Remaining tokens
   */
  getRemaining(userId, operation) {
    const key = `${userId}:${operation}`;
    const bucket = this.buckets.get(key);
    
    if (!bucket) {
      const config = this.getConfig(operation);
      return config.maxTokens;
    }
    
    return Math.max(0, bucket.tokens);
  }

  /**
   * Get time until next token refill
   * @param {string} userId - User ID
   * @param {string} operation - Operation type
   * @returns {number} Milliseconds until next refill
   */
  getTimeToRefill(userId, operation) {
    const key = `${userId}:${operation}`;
    const bucket = this.buckets.get(key);
    
    if (!bucket) return 0;
    
    const timeSinceRefill = Date.now() - bucket.lastRefill;
    const refillInterval = 60000 / bucket.refillRate; // ms per token
    
    return Math.max(0, refillInterval - timeSinceRefill);
  }

  /**
   * Reset rate limits for a user (admin function)
   * @param {string} userId - User ID
   * @param {string} [operation] - Specific operation to reset, or all if omitted
   */
  reset(userId, operation = null) {
    if (operation) {
      const key = `${userId}:${operation}`;
      this.buckets.delete(key);
    } else {
      // Reset all operations for user
      for (const key of this.buckets.keys()) {
        if (key.startsWith(`${userId}:`)) {
          this.buckets.delete(key);
        }
      }
    }
  }

  /**
   * Start cleanup of old buckets
   */
  startCleanup() {
    if (this.cleanupInterval) return;
    
    // Clean up old buckets every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up old unused buckets
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Stop rate limiter and cleanup
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.buckets.clear();
  }

  /**
   * Get rate limiter statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      activeBuckets: this.buckets.size,
      hasCleanupInterval: !!this.cleanupInterval
    };
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Convenience function for checking rate limits
export const checkRateLimit = (userId, operation) => rateLimiter.check(userId, operation);