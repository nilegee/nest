// @ts-check
/**
 * @fileoverview Enhanced session state management for FamilyNest
 * Centralized auth state, family context, and activity tracking
 */

import { emit } from './event-bus.js';

/** @type {import('../types.d.ts').Session|null} */
let currentSession = null;

/** @type {string|null} */
let currentFamilyId = null;

/** @type {import('../types.d.ts').Profile|null} */
let currentUserProfile = null;

/** @type {Array<Function>} */
const authChangeCallbacks = [];

// Activity tracking for session timeout
let lastActivityTime = Date.now();
let sessionTimeoutId = null;
let activityCheckInterval = null;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute

/**
 * Initialize activity tracking
 */
function initActivityTracking() {
  if (activityCheckInterval) return; // Already initialized

  // Track various user activity events
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  
  const updateActivity = () => {
    lastActivityTime = Date.now();
    
    // Emit activity event for logging
    if (currentSession) {
      emit('USER_ACTIVITY', {
        userId: currentSession.user.id,
        familyId: currentFamilyId,
        timestamp: lastActivityTime
      });
    }
  };

  // Add event listeners for activity tracking
  activityEvents.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });

  // Start periodic session timeout check
  activityCheckInterval = setInterval(checkSessionTimeout, ACTIVITY_CHECK_INTERVAL);
}

/**
 * Check if session has timed out due to inactivity
 */
function checkSessionTimeout() {
  if (!currentSession) return;

  const timeSinceActivity = Date.now() - lastActivityTime;
  
  if (timeSinceActivity >= SESSION_TIMEOUT_MS) {
    handleSessionTimeout();
  } else {
    // Warn at 5 minutes before timeout
    const warningTime = SESSION_TIMEOUT_MS - 5 * 60 * 1000;
    if (timeSinceActivity >= warningTime) {
      showSessionWarning();
    }
  }
}

/**
 * Handle session timeout
 */
function handleSessionTimeout() {
  if (!currentSession) return;

  const sessionDuration = Date.now() - (currentSession.created_at || Date.now());
  
  // Emit logout event for tracking
  emit('USER_LOGOUT', {
    userId: currentSession.user.id,
    familyId: currentFamilyId,
    sessionDuration,
    reason: 'timeout',
    timestamp: Date.now()
  });

  // Clear session and redirect
  clearSession();
  
  // Show timeout message
  import('../toast-helper.js').then(({ showError }) => {
    showError('Session expired due to inactivity. Please sign in again.');
  });

  // Redirect to login
  setTimeout(() => {
    window.location.hash = '#';
    window.location.reload();
  }, 2000);
}

/**
 * Show session warning before timeout
 */
function showSessionWarning() {
  import('../toast-helper.js').then(({ showWarning }) => {
    showWarning('Your session will expire in 5 minutes due to inactivity.');
  });
}

/**
 * Cleanup activity tracking
 */
function cleanupActivityTracking() {
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
    activityCheckInterval = null;
  }
  
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }
}

/**
 * Get current session
 * @returns {import('../types.d.ts').Session|null}
 */
export function getSession() {
  return currentSession;
}

/**
 * Set current session
 * @param {import('../types.d.ts').Session|null} session
 */
export function setSession(session) {
  const wasLoggedIn = !!currentSession;
  currentSession = session;
  
  if (session) {
    // Add created_at timestamp for session duration tracking
    if (!session.created_at) {
      session.created_at = Date.now();
    }
    
    // Initialize activity tracking for authenticated users
    initActivityTracking();
    
    // Update last activity time
    lastActivityTime = Date.now();
    
    // Emit login event for tracking
    emit('USER_LOGIN', {
      userId: session.user.id,
      familyId: currentFamilyId,
      method: 'session_restored',
      timestamp: Date.now()
    });
  } else if (wasLoggedIn) {
    // Cleanup when logging out
    cleanupActivityTracking();
  }
  
  notifyAuthChange();
}

/**
 * Get current family ID
 * @returns {string|null}
 */
export function getFamilyId() {
  return currentFamilyId;
}

/**
 * Set current family ID
 * @param {string|null} familyId
 */
export function setFamilyId(familyId) {
  currentFamilyId = familyId;
  
  // Emit app ready event when family context is established
  if (familyId) {
    window.dispatchEvent(new CustomEvent('nest:app-ready', {
      detail: { familyId }
    }));
  }
}

/**
 * Get current user
 * @returns {import('../types.d.ts').User|null}
 */
export function getUser() {
  return currentSession?.user || null;
}

/**
 * Get current user profile
 * @returns {import('../types.d.ts').Profile|null}
 */
export function getUserProfile() {
  return currentUserProfile;
}

/**
 * Set current user profile
 * @param {import('../types.d.ts').Profile|null} profile
 */
export function setUserProfile(profile) {
  currentUserProfile = profile;
  
  // Auto-set family ID from profile
  if (profile?.family_id && !currentFamilyId) {
    setFamilyId(profile.family_id);
  }
}

/**
 * Register callback for auth state changes
 * @param {Function} callback - Function to call on auth changes
 */
export function onAuthChange(callback) {
  authChangeCallbacks.push(callback);
}

/**
 * Remove auth change callback
 * @param {Function} callback - Function to remove
 */
export function offAuthChange(callback) {
  const index = authChangeCallbacks.indexOf(callback);
  if (index > -1) {
    authChangeCallbacks.splice(index, 1);
  }
}

/**
 * Notify all registered callbacks of auth state change
 */
function notifyAuthChange() {
  authChangeCallbacks.forEach(callback => {
    try {
      callback(currentSession);
    } catch (error) {
      console.error('Error in auth change callback:', error);
    }
  });
}

/**
 * Clear all session state (for logout)
 */
export function clearSession() {
  const wasLoggedIn = !!currentSession;
  
  if (wasLoggedIn && currentSession) {
    const sessionDuration = Date.now() - (currentSession.created_at || Date.now());
    
    // Emit logout event for tracking
    emit('USER_LOGOUT', {
      userId: currentSession.user.id,
      familyId: currentFamilyId,
      sessionDuration,
      reason: 'manual',
      timestamp: Date.now()
    });
  }
  
  // Cleanup tracking
  cleanupActivityTracking();
  
  // Clear state
  currentSession = null;
  currentFamilyId = null;
  currentUserProfile = null;
  
  notifyAuthChange();
}

/**
 * Get session activity information
 * @returns {Object} Activity information
 */
export function getActivityInfo() {
  if (!currentSession) {
    return { active: false };
  }
  
  const now = Date.now();
  const sessionStart = currentSession.created_at || now;
  const timeSinceActivity = now - lastActivityTime;
  const sessionDuration = now - sessionStart;
  const timeUntilTimeout = SESSION_TIMEOUT_MS - timeSinceActivity;
  
  return {
    active: true,
    lastActivity: lastActivityTime,
    timeSinceActivity,
    sessionDuration,
    timeUntilTimeout: Math.max(0, timeUntilTimeout),
    isNearTimeout: timeSinceActivity >= (SESSION_TIMEOUT_MS - 5 * 60 * 1000)
  };
}

/**
 * Extend session by updating activity time
 */
export function extendSession() {
  if (!currentSession) return false;
  
  lastActivityTime = Date.now();
  
  // Emit activity event
  emit('USER_ACTIVITY', {
    userId: currentSession.user.id,
    familyId: currentFamilyId,
    timestamp: lastActivityTime,
    type: 'manual_extend'
  });
  
  return true;
}