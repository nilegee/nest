/**
 * Profile utilities for ensuring user profile exists
 */

import { supabase } from '../../web/supabaseClient.js';
import { WHITELISTED_EMAILS } from '../../web/env.js';

/**
 * Check if user has valid authentication and is whitelisted
 * @param {string} userEmail - User email from auth
 * @returns {boolean} - True if user should have access
 */
function isUserAuthorized(userEmail) {
  return userEmail && WHITELISTED_EMAILS.includes(userEmail);
}

/**
 * Ensure user profile exists, create if not found
 * @param {string} userId - User ID from auth
 * @param {string} userEmail - User email from auth
 * @param {Object} userMetadata - User metadata from auth
 * @returns {Promise<Object|null>} User profile or null if error
 */
export async function ensureUserProfile(userId, userEmail, userMetadata = {}) {
  if (!userId || !userEmail) return null;
  
  // Early check: if user is not whitelisted, don't make any requests
  if (!isUserAuthorized(userEmail)) {
    return null;
  }
  
  try {
    // Verify current session before making requests
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user?.id || session.user.id !== userId) {
      return null;
    }
    
    // Double-check that we have a valid session token
    if (!session.access_token) {
      return null;
    }
    
    // Try to get existing profile
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Handle any authorization errors gracefully - return null instead of logging
    if (profileError && (profileError.code === 'PGRST301' || profileError.message?.includes('403') || profileError.message?.includes('Forbidden'))) {
      return null;
    }
    
    if (!profileError && existingProfile) {
      return existingProfile;
    }
    
    // Profile doesn't exist, create it
    
    // First, ensure the default family exists
    let familyId;
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .select('id')
      .eq('name', 'G Family')
      .single();
    
    // Handle any authorization errors gracefully for family lookup
    if (familyError && (familyError.code === 'PGRST301' || familyError.message?.includes('403') || familyError.message?.includes('Forbidden'))) {
      return null;
    }
    
    if (familyError || !familyData) {
      // Create default family if it doesn't exist
      const { data: newFamily, error: createFamilyError } = await supabase
        .from('families')
        .insert([{ name: 'G Family' }])
        .select('id')
        .single();
      
      // Handle any authorization errors gracefully for family creation
      if (createFamilyError && (createFamilyError.code === 'PGRST301' || createFamilyError.message?.includes('403') || createFamilyError.message?.includes('Forbidden'))) {
        return null;
      }
      
      if (createFamilyError) {
        return null;
      }
      familyId = newFamily.id;
    } else {
      familyId = familyData.id;
    }

    // Create user profile
    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert([{
        user_id: userId,
        family_id: familyId,
        full_name: userMetadata?.full_name || 
                   userEmail?.split('@')[0] || 
                   'Family Member',
        role: 'member'
      }])
      .select('*')
      .single();

    // Handle any authorization errors gracefully for profile creation
    if (createProfileError && (createProfileError.code === 'PGRST301' || createProfileError.message?.includes('403') || createProfileError.message?.includes('Forbidden'))) {
      return null;
    }

    if (createProfileError) {
      return null;
    }

    return newProfile;
    
  } catch (error) {
    // Silent error handling - don't log anything to console
    return null;
  }
}

/**
 * Get user's family ID, ensuring profile exists first
 * @param {string} userId - User ID from auth
 * @param {string} userEmail - User email from auth
 * @param {Object} userMetadata - User metadata from auth
 * @returns {Promise<string|null>} Family ID or null if error
 */
export async function getUserFamilyId(userId, userEmail, userMetadata = {}) {
  const profile = await ensureUserProfile(userId, userEmail, userMetadata);
  return profile?.family_id || null;
}