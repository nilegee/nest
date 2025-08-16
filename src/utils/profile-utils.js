/**
 * Profile utilities for ensuring user profile exists
 */

import { supabase } from '../../web/supabaseClient.js';

/**
 * Ensure user profile exists, create if not found
 * @param {string} userId - User ID from auth
 * @param {string} userEmail - User email from auth
 * @param {Object} userMetadata - User metadata from auth
 * @returns {Promise<Object|null>} User profile or null if error
 */
export async function ensureUserProfile(userId, userEmail, userMetadata = {}) {
  if (!userId || !userEmail) return null;
  
  try {
    // Try to get existing profile
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Handle 403 errors gracefully
    if (profileError && (profileError.code === 'PGRST301' || profileError.message?.includes('403'))) {
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
    
    // Handle 403 errors gracefully for family lookup
    if (familyError && (familyError.code === 'PGRST301' || familyError.message?.includes('403'))) {
      return null;
    }
    
    if (familyError || !familyData) {
      // Create default family if it doesn't exist
      const { data: newFamily, error: createFamilyError } = await supabase
        .from('families')
        .insert([{ name: 'G Family' }])
        .select('id')
        .single();
      
      // Handle 403 errors gracefully for family creation
      if (createFamilyError && (createFamilyError.code === 'PGRST301' || createFamilyError.message?.includes('403'))) {
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

    // Handle 403 errors gracefully for profile creation
    if (createProfileError && (createProfileError.code === 'PGRST301' || createProfileError.message?.includes('403'))) {
      return null;
    }

    if (createProfileError) {
      return null;
    }

    return newProfile;
    
  } catch (error) {
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