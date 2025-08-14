/**
 * Proactive System Bootstrap
 * Initializes the proactive layer when enabled and family is ready
 */

import { NudgeEngine } from './nudge-engine.js';
import { signalBus } from './signal-bus.js';

let engine = null;

/**
 * Initialize proactive system for a family
 * @param {string} familyId - Family ID to initialize for
 */
function init(familyId) {
  if (!window.NEST_PROACTIVE_ENABLED) return;
  if (engine) return;
  
  try {
    engine = new NudgeEngine({ familyId });
    
    // Demo mode - emit test signal
    if (window.NEST_PROACTIVE_DEMO) {
      signalBus.emit({
        type: 'event.tomorrow',
        family_id: familyId,
        data: { event_id: 'demo' }
      });
    }
    
    console.info('[Proactive] started for family', familyId);
  } catch (e) {
    console.warn('[Proactive] init failed', e);
  }
}

// Listen for app ready event from fn-home.js
window.addEventListener('nest:app-ready', ev => {
  const id = ev?.detail?.familyId;
  if (id) init(id);
});