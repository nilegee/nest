/**
 * @fileoverview Fetch wrapper with hardened Accept headers
 */

/**
 * Fetch wrapper that ensures Accept: application/json is always included
 * @param {string | URL} input - URL or Request object
 * @param {RequestInit} [opts] - Fetch options
 * @returns {Promise<Response>}
 */
export async function fetchJSON(input, opts) {
  const headers = {
    'Accept': 'application/json',
    ...(opts?.headers || {})
  };

  return fetch(input, {
    ...opts,
    headers
  });
}