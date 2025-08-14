/**
 * Nudge Engine - Process signals and create nudges based on rules
 * Listens to signal bus and generates appropriate nudges
 */

import { supabase } from '/web/supabaseClient.js';
import { signalBus } from './signal-bus.js';
import { RULES } from './nudge-rules.js';

const dayMs = 86400000;

/**
 * Check if a signal matches rule conditions
 * @param {Object} when - Rule conditions
 * @param {Object} sig - Signal to check
 * @returns {boolean}
 */
function match(when, sig) {
  if (when.type && when.type !== sig.type) return false;
  
  if (when.withinDays && sig.data?.date) {
    const d = (new Date(sig.data.date) - Date.now()) / dayMs;
    if (d < 0 || d > when.withinDays) return false;
  }
  
  return true;
}

export class NudgeEngine {
  constructor({ familyId }) {
    this.familyId = familyId;
    this.cooldowns = new Map();
    this.unsub = signalBus.subscribe(s => this.onSignal(s));
  }

  /**
   * Process incoming signal and potentially create nudges
   * @param {Object} sig - Signal to process
   */
  async onSignal(sig) {
    for (const rule of RULES) {
      if (!match(rule.when, sig)) continue;
      
      // Check cooldown (6 hours per rule per family)
      const key = `${rule.id}:${this.familyId}`;
      if (Date.now() - (this.cooldowns.get(key) || 0) < 6 * 60 * 60 * 1000) continue;
      
      const nudge = rule.produce(sig);
      
      try {
        const { data, error } = await supabase.from('nudges').insert({
          family_id: this.familyId,
          target_id: sig.actor_id ?? null,
          type: nudge.type,
          payload: nudge.payload,
          status: 'pending'
        }).select().single();
        
        if (!error) {
          this.cooldowns.set(key, Date.now());
          signalBus.emit({
            type: 'ui.nudge.created',
            family_id: this.familyId,
            data
          });
        }
      } catch (_) {
        // Silent fail for nudge creation
      }
    }
  }

  /**
   * Cleanup when destroying the engine
   */
  destroy() {
    this.unsub?.();
  }
}