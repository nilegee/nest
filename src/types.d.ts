/**
 * @fileoverview JSDoc type definitions for FamilyNest
 * These provide better editor support for the zero-build CDN app
 */

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {Object} user_metadata - User metadata from auth
 */

/**
 * @typedef {Object} Session
 * @property {User} user - Authenticated user
 * @property {string} access_token - JWT access token
 */

/**
 * @typedef {Object} Family
 * @property {string} id - Family ID  
 * @property {string} name - Family name
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Profile
 * @property {string} id - Profile ID (matches user ID)
 * @property {string} family_id - Associated family ID
 * @property {string} display_name - Display name
 * @property {string} [avatar_url] - Profile avatar URL
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Event
 * @property {string} id - Event ID
 * @property {string} family_id - Associated family ID
 * @property {string} title - Event title
 * @property {string} starts_at - Event start time (ISO string)
 * @property {string} [location] - Event location
 * @property {string} created_by - Creator user ID
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Post
 * @property {string} id - Post ID
 * @property {string} family_id - Associated family ID
 * @property {string} content - Post content
 * @property {string} created_by - Creator user ID
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Act
 * @property {string} id - Act ID
 * @property {string} family_id - Associated family ID
 * @property {string} kind - Act type/category
 * @property {number} points - Points value
 * @property {Object} meta - Additional metadata
 * @property {string} created_by - Creator user ID
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Goal
 * @property {string} id - Goal ID
 * @property {string} family_id - Associated family ID
 * @property {string} title - Goal title
 * @property {number} target - Target value
 * @property {number} current - Current progress
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Birthday
 * @property {string} id - Birthday ID
 * @property {string} family_id - Associated family ID
 * @property {string} name - Person's name
 * @property {string} date_of_birth - Birth date (ISO string)
 * @property {number} daysUntil - Days until next birthday
 */

/**
 * @typedef {Object} RouteChangeEvent
 * @property {string} detail.route - The new route name
 */

/**
 * @typedef {Function} RouteRenderer
 * @returns {TemplateResult} Lit template result for the route
 */