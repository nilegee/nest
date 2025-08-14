/**
 * Signal Bus - Event communication system for proactive features
 * Manages in-memory event distribution and optional database logging
 */

import { supabase } from '/web/supabaseClient.js';

class SignalBus {
  constructor() {
    this.listeners = new Set();
  }

  /**
   * Subscribe to signals
   * @param {Function} fn - Listener function
   * @returns {Function} Unsubscribe function
   */
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /**
   * Emit a signal to all listeners and optionally log to database
   * @param {Object} signal - Signal object
   */
  async emit(signal) {
    const s = { ts: Date.now(), ...signal };
    
    // Notify all listeners
    for (const fn of this.listeners) {
      try {
        fn(s);
      } catch (e) {
        console.warn('Signal listener error:', e);
      }
    }
    
    // Optionally log to database (silently fail if DB unavailable)
    try {
      await supabase.from('signals').insert({
        family_id: s.family_id,
        actor_id: s.actor_id ?? null,
        type: s.type,
        data: s.data ?? {}
      });
    } catch (_) {
      // Silent fail for database logging
    }
  }
}

export const signalBus = new SignalBus();