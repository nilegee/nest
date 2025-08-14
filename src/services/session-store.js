// @ts-check
/**
 * @fileoverview Session state management for FamilyNest
 * Centralized auth state and family context
 */

/** @type {import('../types.d.ts').Session|null} */
let currentSession = null;

/** @type {string|null} */
let currentFamilyId = null;

/** @type {import('../types.d.ts').Profile|null} */
let currentUserProfile = null;

/** @type {Array<Function>} */
const authChangeCallbacks = [];

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
  currentSession = session;
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
  currentSession = null;
  currentFamilyId = null;
  currentUserProfile = null;
  notifyAuthChange();
}