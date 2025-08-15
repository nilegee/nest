import { supabase } from '../../web/supabaseClient.js';

let _session = null;
let _resolvers = [];
let _initialized = false;

export async function init() {
  if (_initialized) return;
  try {
    await getSession();
    _initialized = true;
    // Emit initial state
    window.dispatchEvent(new CustomEvent('session-changed', { detail: _session }));
  } catch (error) {
    // Never throw on auth skew, just log and continue
    console.warn('Session init warning:', error);
    _initialized = true;
  }
}

export async function getSession() {
  if (_session) return _session;
  try {
    const { data } = await supabase.auth.getSession();
    _session = data?.session ?? null;
    return _session;
  } catch (error) {
    // Never throw on auth errors, return null session
    console.warn('Session get warning:', error);
    return null;
  }
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