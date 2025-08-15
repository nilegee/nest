import { supabase, getFreshSession } from '../../web/supabaseClient.js';

let _session = null;
let _resolvers = [];
let _initialized = false;

export async function getSession() {
  if (_session) return _session;
  const session = await getFreshSession();
  _session = session;
  return _session;
}

export async function waitForSession() {
  const s = await getSession();
  if (s) return s;
  return new Promise(res => _resolvers.push(res));
}

export function wireAuthListener() {
  supabase.auth.onAuthStateChange((_event, session) => {
    _session = session ?? null;
    if (_session && _resolvers.length) {
      const rs = _resolvers.slice(); 
      _resolvers.length = 0;
      rs.forEach(r => r(_session));
    }
    window.dispatchEvent(new CustomEvent('session-changed', { detail: _session }));
  });
}

// Ensure one-time init that resolves before first render
export async function init() {
  if (_initialized) return;
  _initialized = true;
  
  wireAuthListener();
  const session = await getFreshSession();
  _session = session;
  
  // Emit session change to notify components
  window.dispatchEvent(new CustomEvent('session-changed', { detail: _session }));
}