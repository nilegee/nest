// @ts-check
/**
 * @fileoverview Minimal hash-based router for FamilyNest
 * Provides client-side routing without page reloads
 */

import { html, render } from 'https://esm.sh/lit@3';

/** @type {Map<string, import('../types.d.ts').RouteRenderer>} */
const routes = new Map();

/** @type {HTMLElement|null} */
let outlet = null;

/** @type {string|null} */
let currentRouteName = null;

/**
 * Register a route with its renderer function
 * @param {string} name - Route name (e.g., 'nest', 'feed')
 * @param {import('../types.d.ts').RouteRenderer} renderer - Function that returns template
 */
export function registerRoute(name, renderer) {
  routes.set(name, renderer);
}

/**
 * Initialize the router with DOM outlet element
 * @param {HTMLElement} outletEl - Element to render routes into
 */
export function initRouter(outletEl) {
  outlet = outletEl;
  
  // Listen for hash changes
  window.addEventListener('hashchange', onRoute);
  
  // Handle initial route
  onRoute();
}

/**
 * Handle route changes
 */
function onRoute() {
  if (!outlet) return;
  
  const route = getRouteFromHash() || 'nest';
  const renderer = routes.get(route) || routes.get('nest');
  
  if (renderer) {
    // Render the route
    render(renderer(), outlet);
    
    // Update current route
    currentRouteName = route;
    
    // Emit route change event for components that need to react
    outlet.dispatchEvent(new CustomEvent('nest:route-changed', {
      detail: { route },
      bubbles: true
    }));
    
    // Handle focus management for accessibility
    setMainFocus();
  }
}

/**
 * Navigate to a specific route
 * @param {string} name - Route name
 * @param {string|null} [template] - Optional template parameter
 */
export function navigate(name, template = null) {
  const url = template ? `${name}?template=${template}` : name;
  window.location.hash = `#${url}`;
}

/**
 * Get current route name
 * @returns {string|null} Current route name
 */
export function currentRoute() {
  return currentRouteName;
}

/**
 * Get route from URL hash
 * @returns {string|null} Route name or null
 */
function getRouteFromHash() {
  const hash = window.location.hash.slice(1);
  const [route] = hash.split('?');
  return route || null;
}

/**
 * Get template parameter from hash
 * @returns {string|null} Template parameter or null
 */
export function getTemplateFromHash() {
  const hash = window.location.hash;
  const urlParams = new URLSearchParams(hash.split('?')[1] || '');
  return urlParams.get('template');
}

/**
 * Set focus on main heading when route changes (accessibility)
 */
function setMainFocus() {
  // Wait for DOM update
  setTimeout(() => {
    if (!outlet) return;
    
    const mainHeading = outlet.querySelector('h1');
    if (mainHeading) {
      mainHeading.focus();
      mainHeading.tabIndex = -1; // Make it focusable programmatically but not via tab
    }
  }, 0);
}