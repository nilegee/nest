/**
 * Mock modules for testing - replaces CDN imports
 */

// Mock Lit exports
export const LitElement = class LitElement extends HTMLElement {
  static properties = {};
  static styles = '';
  constructor() {
    super();
    this.render = () => '';
  }
  connectedCallback() {}
  attributeChangedCallback() {}
};

export const html = (strings, ...values) => {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || '');
  }, '');
};

export const css = (strings, ...values) => {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || '');
  }, '');
};

// Mock Supabase client
export const supabase = {
  auth: {
    signInWithOAuth: () => Promise.resolve({ error: null }),
    signInWithOtp: () => Promise.resolve({ error: null }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: (table) => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: null })
      })
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null })
  })
};