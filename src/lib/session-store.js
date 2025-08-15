import { supabase } from '../../web/supabaseClient.js';

let _session = null;
let _resolvers = [];

/**
 * Initialize session store - calls supabase.auth.getSession() and never throws
 */
export async function init() {
  try {
    const { data } = await supabase.auth.getSession();
    _session = data?.session ?? null;
  } catch (error) {
    console.warn('Session init failed:', error);
    _session = null;
  }
}

export async function getSession() {
  if (_session) return _session;
  const { data } = await supabase.auth.getSession();
  _session = data?.session ?? null;
  return _session;
}

export async function waitForSession() {
  const s = await getSession();
  if (s) return s;
  return new Promise(res => _resolvers.push(res));
}

/**
 * Get current auth.uid() easily
 */
export function getCurrentUserId() {
  return _session?.user?.id ?? null;
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