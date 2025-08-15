// @ts-check
/**
 * @fileoverview Database service layer for FamilyNest
 * Thin wrapper around Supabase with error handling
 */

import { supabase } from '../../web/supabaseClient.js';
import { bootWarn } from '../lib/log.js';

/**
 * Select data from a table with optional query parameters
 * @param {string} table - Table name
 * @param {Object} [query] - Query parameters for filtering
 * @param {string} [select] - Columns to select (default: '*')
 * @param {string} [orderBy] - Order by column
 * @param {boolean} [ascending] - Sort direction (default: true)
 * @returns {Promise<{data: any[], error: any}>}
 */
export async function select(table, query = {}, select = '*', orderBy = null, ascending = true) {
  try {
    let queryBuilder = supabase
      .from(table)
      .select(select);
    
    // Apply filters
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryBuilder = queryBuilder.eq(key, value);
      }
    });
    
    // Apply ordering
    if (orderBy) {
      queryBuilder = queryBuilder.order(orderBy, { ascending });
    }
    
    const result = await queryBuilder;
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return { data: result.data || [], error: null };
  } catch (error) {
    console.error(`Database select error (${table}):`, error);
    return { data: [], error };
  }
}

/**
 * Insert a new row into a table
 * @param {string} table - Table name
 * @param {Object} row - Data to insert
 * @returns {Promise<{data: any, error: any}>}
 */
export async function insert(table, row) {
  try {
    const result = await supabase
      .from(table)
      .insert(row)
      .select()
      .single();
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return { data: result.data, error: null };
  } catch (error) {
    console.error(`Database insert error (${table}):`, error);
    return { data: null, error };
  }
}

/**
 * Update rows in a table
 * @param {string} table - Table name
 * @param {Object} match - Conditions to match for update
 * @param {Object} patch - Data to update
 * @returns {Promise<{data: any[], error: any}>}
 */
export async function update(table, match, patch) {
  try {
    let queryBuilder = supabase
      .from(table)
      .update(patch);
    
    // Apply match conditions
    Object.entries(match).forEach(([key, value]) => {
      queryBuilder = queryBuilder.eq(key, value);
    });
    
    const result = await queryBuilder.select();
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return { data: result.data || [], error: null };
  } catch (error) {
    console.error(`Database update error (${table}):`, error);
    return { data: [], error };
  }
}

/**
 * Delete rows from a table
 * @param {string} table - Table name
 * @param {Object} match - Conditions to match for deletion
 * @returns {Promise<{data: any[], error: any}>}
 */
export async function remove(table, match) {
  try {
    let queryBuilder = supabase
      .from(table)
      .delete();
    
    // Apply match conditions
    Object.entries(match).forEach(([key, value]) => {
      queryBuilder = queryBuilder.eq(key, value);
    });
    
    const result = await queryBuilder.select();
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return { data: result.data || [], error: null };
  } catch (error) {
    console.error(`Database remove error (${table}):`, error);
    return { data: [], error };
  }
}

/**
 * Execute a stored procedure/RPC call
 * @param {string} functionName - Function name
 * @param {Object} [params] - Function parameters
 * @returns {Promise<{data: any, error: any}>}
 */
export async function rpc(functionName, params = {}) {
  try {
    const result = await supabase.rpc(functionName, params);
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return { data: result.data, error: null };
  } catch (error) {
    console.error(`Database RPC error (${functionName}):`, error);
    return { data: null, error };
  }
}

/**
 * Ensure the current user has a family_id via RPC
 * @returns {Promise<string>} - Family ID
 */
export async function ensureFamilyId() {
  const { data, error } = await supabase.rpc('ensure_family_for_user');
  if (error) throw error;
  return data;
}

/**
 * Add family_id to payload, ensuring it exists
 * @param {Object} payload - Base payload object
 * @param {Object} profile - User profile with family_id
 * @returns {Promise<Object>} - Payload with family_id
 */
export async function withFamily(payload = {}, profile) {
  const fam = profile?.family_id ?? await ensureFamilyId();
  return { family_id: fam, ...payload };
}

/**
 * Get the authenticated user's profile from the me view with fallback to profiles
 * @param {Object} supabaseClient - Supabase client instance
 * @param {string} userId - User ID for fallback query
 * @returns {Promise<{data: import('../types.d.ts').Profile|null, error: any}>}
 */
export async function getCurrentUserProfile(supabaseClient = supabase, userId) {
  // 1) Try the me view
  let { data, error, status } = await supabaseClient.from('me').select('*').maybeSingle();
  if (error && status !== 406) console.warn('me view error', { status, error });
  if (error && status === 406) bootWarn('me view returns 406 (likely RLS)', { status, error });
  if (data) return { data, error: null };

  // 2) Fallback to profiles (RLS must allow owner)
  const { data: prof, error: pErr, status: pStatus } = await supabaseClient
    .from('profiles')
    .select('user_id, full_name, dob, family_id, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();
  if (pErr && pStatus !== 406) console.warn('profiles fallback error', { pStatus, pErr });
  if (pErr && pStatus === 406) bootWarn('profiles call returns 406 (likely RLS)', { pStatus, pErr });

  if (!prof) {
    throw new Error('Profile not available. Run latest DB migrations to add `me` view and RLS.');
  }
  return { data: prof, error: null };
}