/**
 * Namespaced logger utility with debug flag support
 * Only logs info/warn in debug mode, errors always print
 */

import { ENV } from '../../web/env.js';

const isDebug =
  (ENV?.DEBUG === true) ||
  (typeof localStorage !== 'undefined' && localStorage.getItem('DEBUG') === '1');

export const logger = (ns) => {
  const p = (lvl, ...args) => {
    const prefix = `[${ns}]`;
    // Errors always print; info/warn gated by debug
    if (lvl === 'error' || isDebug) console[lvl === 'info' ? 'log' : lvl](prefix, ...args);
  };
  return {
    info: (...a) => p('info', ...a),
    warn: (...a) => p('warn', ...a),
    error: (...a) => p('error', ...a),
  };
};