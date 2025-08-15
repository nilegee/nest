import { supabase } from '../../web/supabaseClient.js';

let _session = null;
let _resolvers = [];

/**
 * Initialize session store - calls supabase.auth.getSession() and never throws
 */
export async function init() {
  // first attempt
  let { data: { session }, error } = await supabase.auth.getSession();

  // handle skew: if we just returned from OAuth and session is null or future-dated, retry
  const fromOAuth = /access_token=/.test(location.hash);
  if ((!session || /issued in the future/i.test(error?.message || '')) && fromOAuth) {
    await new Promise(r => setTimeout(r, 2500));
    ({ data: { session } } = await supabase.auth.refreshSession());
  }

  _session = session ?? null;   // never throw
  notify();                     // notify state change
}

function notify() {
  window.dispatchEvent(new CustomEvent('session-changed', { detail: _session }));
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
    notify();
  });
}