/**
 * Theme System for FamilyNest
 * Provides CSS custom properties for different visual themes
 */

const ALLOWED = new Set(['classic','pubg-lite','roblox-lite']);

export const THEMES = {
  'classic': {
    // Warm, family-friendly colors
    '--theme-primary': '#6366f1',
    '--theme-primary-light': '#818cf8',
    '--theme-primary-dark': '#4f46e5',
    '--theme-secondary': '#f59e0b',
    '--theme-accent': '#10b981',
    '--theme-bg': '#ffffff',
    '--theme-bg-secondary': '#f8fafc',
    '--theme-bg-tertiary': '#f1f5f9',
    '--theme-text': '#1e293b',
    '--theme-text-secondary': '#64748b',
    '--theme-border': '#e2e8f0',
    '--theme-border-hover': '#cbd5e1',
    '--theme-shadow': 'rgba(0, 0, 0, 0.1)',
    '--theme-radius': '8px',
    '--theme-font-family': 'system-ui, -apple-system, sans-serif'
  },

  'roblox-lite': {
    // Blocky, colorful theme inspired by Roblox
    '--theme-primary': '#ff6b35',
    '--theme-primary-light': '#ff8c69',
    '--theme-primary-dark': '#e55534',
    '--theme-secondary': '#4ecdc4',
    '--theme-accent': '#45b7d1',
    '--theme-bg': '#f7f9fc',
    '--theme-bg-secondary': '#e8f4f8',
    '--theme-bg-tertiary': '#d6edf2',
    '--theme-text': '#2c3e50',
    '--theme-text-secondary': '#5a6c7d',
    '--theme-border': '#bdd3de',
    '--theme-border-hover': '#9cb4c4',
    '--theme-shadow': 'rgba(255, 107, 53, 0.15)',
    '--theme-radius': '4px',
    '--theme-font-family': '"Comic Sans MS", cursive, system-ui'
  },

  'minecraft-lite': {
    // Pixelated, earthy theme inspired by Minecraft
    '--theme-primary': '#8b4513',
    '--theme-primary-light': '#a0522d',
    '--theme-primary-dark': '#654321',
    '--theme-secondary': '#228b22',
    '--theme-accent': '#daa520',
    '--theme-bg': '#f5f5dc',
    '--theme-bg-secondary': '#f0f8e8',
    '--theme-bg-tertiary': '#e6f3d6',
    '--theme-text': '#2f4f2f',
    '--theme-text-secondary': '#556b2f',
    '--theme-border': '#9acd32',
    '--theme-border-hover': '#7ba428',
    '--theme-shadow': 'rgba(139, 69, 19, 0.2)',
    '--theme-radius': '2px',
    '--theme-font-family': '"Courier New", monospace, system-ui'
  },

  'pubg-lite': {
    // Tactical, focused theme inspired by PUBG
    '--theme-primary': '#ff6600',
    '--theme-primary-light': '#ff8533',
    '--theme-primary-dark': '#cc5200',
    '--theme-secondary': '#333333',
    '--theme-accent': '#00cc66',
    '--theme-bg': '#1a1a1a',
    '--theme-bg-secondary': '#2a2a2a',
    '--theme-bg-tertiary': '#3a3a3a',
    '--theme-text': '#ffffff',
    '--theme-text-secondary': '#cccccc',
    '--theme-border': '#555555',
    '--theme-border-hover': '#777777',
    '--theme-shadow': 'rgba(255, 102, 0, 0.3)',
    '--theme-radius': '3px',
    '--theme-font-family': '"Roboto", system-ui, sans-serif'
  },

  'sims-lite': {
    // Social, friendly theme inspired by The Sims
    '--theme-primary': '#00b4d8',
    '--theme-primary-light': '#48cae4',
    '--theme-primary-dark': '#0096c7',
    '--theme-secondary': '#f72585',
    '--theme-accent': '#4cc9f0',
    '--theme-bg': '#ffffff',
    '--theme-bg-secondary': '#f0f9ff',
    '--theme-bg-tertiary': '#e0f2fe',
    '--theme-text': '#0f172a',
    '--theme-text-secondary': '#475569',
    '--theme-border': '#bae6fd',
    '--theme-border-hover': '#7dd3fc',
    '--theme-shadow': 'rgba(0, 180, 216, 0.15)',
    '--theme-radius': '12px',
    '--theme-font-family': '"Open Sans", system-ui, sans-serif'
  }
};

/**
 * Apply a theme to the document root
 * @param {HTMLElement} root - The root element (usually document.documentElement)
 * @param {string} themeName - Name of the theme to apply
 */
export function applyTheme(root, themeName = 'classic') {
  if (!ALLOWED.has(themeName)) themeName = 'classic';
  
  const theme = THEMES[themeName];
  if (!theme) {
    console.warn(`Theme "${themeName}" not found, falling back to classic`);
    applyTheme(root, 'classic');
    return;
  }

  // Apply all CSS custom properties
  Object.entries(theme).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Store current theme for reference
  root.setAttribute('data-theme', themeName);
  
  console.log('Applied theme:', themeName);
}

/**
 * Get current active theme name
 * @param {HTMLElement} root - The root element
 * @returns {string} Current theme name
 */
export function getCurrentTheme(root = document.documentElement) {
  return root.getAttribute('data-theme') || 'classic';
}

/**
 * Get theme preview data for UI selection
 * @param {string} themeName 
 * @returns {Object} Theme preview data
 */
export function getThemePreview(themeName) {
  const theme = THEMES[themeName];
  if (!theme) return null;

  return {
    name: themeName,
    displayName: themeName.replace('-lite', '').replace(/^\w/, c => c.toUpperCase()),
    primary: theme['--theme-primary'],
    secondary: theme['--theme-secondary'],
    accent: theme['--theme-accent'],
    background: theme['--theme-bg'],
    textColor: theme['--theme-text'],
    fontFamily: theme['--theme-font-family']
  };
}

/**
 * Get all available themes for selection UI
 * @returns {Array} Array of theme preview objects
 */
export function getAllThemes() {
  return Object.keys(THEMES).map(getThemePreview).filter(Boolean);
}

/**
 * Initialize default theme on page load
 */
export function initializeDefaultTheme() {
  const savedTheme = localStorage.getItem('familynest-theme');
  const defaultTheme = savedTheme && THEMES[savedTheme] ? savedTheme : 'classic';
  applyTheme(document.documentElement, defaultTheme);
}

// Auto-initialize on import
if (typeof document !== 'undefined') {
  // Initialize theme when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDefaultTheme);
  } else {
    initializeDefaultTheme();
  }
}