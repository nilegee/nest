/**
 * Activity logging service
 * Logs user activities and emits domain events
 */

import { supabase } from '../../web/supabaseClient.js';
import { emit } from './event-bus.js';
import { getFamilyId } from './session-store.js';

/**
 * Log an activity and emit ACT_LOGGED event
 * @param {Object} actData - Activity data
 * @param {string} actData.type - Activity type (e.g., 'post_created', 'goal_updated')
 * @param {string} actData.ref_table - Referenced table name
 * @param {string} actData.ref_id - Referenced record ID
 * @param {Object} [actData.meta] - Additional metadata
 * @returns {Promise<Object|null>} Created activity record or null on error
 */
export async function logAct({ type, ref_table, ref_id, meta = {} }) {
  try {
    const familyId = getFamilyId();
    if (!familyId) {
      console.warn('Cannot log activity: no family ID');
      return null;
    }

    const { data, error } = await supabase
      .from('acts')
      .insert({
        family_id: familyId,
        type,
        ref_table,
        ref_id,
        meta
      })
      .select()
      .single();

    if (error) throw error;

    // Emit domain event
    emit('ACT_LOGGED', { act: data });
    
    return data;
  } catch (error) {
    console.error('Failed to log activity:', error);
    emit('DB_ERROR', { label: 'acts:log', error });
    return null;
  }
}