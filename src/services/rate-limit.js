/**
 * Rate limiting service using token bucket algorithm
 * Prevents abuse of API endpoints
 */

class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   * @param {number} tokens - Number of tokens to consume
   * @returns {boolean} True if tokens were consumed, false if rate limited
   */
  consume(tokens = 1) {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  /**
   * Refill tokens based on time elapsed
   */
  refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

class RateLimiter {
  constructor() {
    this.buckets = new Map();
    
    // Default rate limits per endpoint type
    this.limits = {
      'posts:create': { capacity: 10, refillRate: 1/60 }, // 10 posts, 1 per minute
      'events:create': { capacity: 20, refillRate: 1/30 }, // 20 events, 1 per 30 seconds
      'goals:update': { capacity: 50, refillRate: 1/10 }, // 50 updates, 1 per 10 seconds
      'notes:create': { capacity: 30, refillRate: 1/20 }, // 30 notes, 1 per 20 seconds
      'appreciation:give': { capacity: 100, refillRate: 1/5 }, // 100 appreciations, 1 per 5 seconds
      'default': { capacity: 100, refillRate: 1/5 } // Default limits
    };
  }

  /**
   * Check if request is allowed under rate limit
   * @param {string} key - Unique key for the rate limit (e.g., 'posts:create:user123')
   * @param {string} [type='default'] - Type of operation for rate limit rules
   * @returns {boolean} True if request is allowed, false if rate limited
   */
  isAllowed(key, type = 'default') {
    const bucketKey = `${type}:${key}`;
    
    if (!this.buckets.has(bucketKey)) {
      const config = this.limits[type] || this.limits.default;
      this.buckets.set(bucketKey, new TokenBucket(config.capacity, config.refillRate));
    }
    
    return this.buckets.get(bucketKey).consume();
  }

  /**
   * Clear expired buckets to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(key);
      }
    }
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup every 10 minutes
setInterval(() => rateLimiter.cleanup(), 600000);

/**
 * Check if operation is rate limited
 * @param {string} operation - Operation type (e.g., 'posts:create')
 * @param {string} userId - User ID for per-user limiting
 * @returns {boolean} True if allowed, false if rate limited
 */
export function checkRateLimit(operation, userId) {
  return rateLimiter.isAllowed(userId, operation);
}