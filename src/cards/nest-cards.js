/**
 * Nest Cards Module
 * Framework-agnostic utility for rendering family update cards
 * Provides card definitions and utilities for consistent markup across layouts
 */

// Registry for extensible card system
const cardRegistry = new Map();

/**
 * Register a new card component for future extensibility
 * @param {string} id - Unique card identifier
 * @param {Function} renderFn - Function that returns DOM element/fragment
 */
export function registerNestCard(id, renderFn) {
  if (typeof id !== 'string' || typeof renderFn !== 'function') {
    throw new Error('registerNestCard requires string id and function renderFn');
  }
  cardRegistry.set(id, renderFn);
}

/**
 * Get all registered card render functions
 * @returns {Map} Map of card id -> render function
 */
export function getRegisteredCards() {
  return new Map(cardRegistry);
}

/**
 * Get the standard card definitions
 * Returns array of card component names in display order
 * @returns {Array<string>} Array of card component names
 */
export function getStandardCards() {
  return [
    'fn-card-events',
    'fn-card-birthday', 
    'fn-card-tip',
    'fn-card-goal'
  ];
}

/**
 * Core function: Render Nest Cards
 * Returns a DocumentFragment containing all family update cards
 * Ensures identical markup between desktop sidebar and mobile inline layouts
 * @param {Object} options - Rendering options
 * @param {boolean} options.includeQuickActions - Whether to include Quick Actions card
 * @param {Object} options.quickActionsState - State for Quick Actions card
 * @param {Function} options.onQuickActionComplete - Quick Actions completion callback
 * @returns {DocumentFragment} Complete cards fragment ready for insertion
 */
export function renderNestCards({
  includeQuickActions = true,
  quickActionsState = {},
  onQuickActionComplete = () => {}
} = {}) {
  // Type guards and null checks
  if (typeof includeQuickActions !== 'boolean') {
    includeQuickActions = true;
  }
  
  if (!quickActionsState || typeof quickActionsState !== 'object') {
    quickActionsState = {};
  }
  
  if (typeof onQuickActionComplete !== 'function') {
    onQuickActionComplete = () => {};
  }
  
  // Create document fragment for optimal performance
  const fragment = document.createDocumentFragment();
  
  // Create container with semantic section wrapper
  const container = document.createElement('div');
  container.className = 'nest-cards-container';
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Family update cards');
  
  // Standard cards
  const standardCards = getStandardCards();
  standardCards.forEach((cardName, index) => {
    const section = document.createElement('section');
    section.setAttribute('aria-labelledby', `${cardName.replace('fn-card-', '')}-heading`);
    const cardElement = document.createElement(cardName);
    section.appendChild(cardElement);
    container.appendChild(section);
  });
  
  // Quick Actions card (if enabled)
  if (includeQuickActions) {
    const quickSection = document.createElement('section');
    quickSection.setAttribute('aria-labelledby', 'quick-actions-heading');
    const quickCard = createQuickActionsCard({
      completedAction: quickActionsState.completedAction,
      onComplete: onQuickActionComplete
    });
    quickSection.appendChild(quickCard);
    container.appendChild(quickSection);
  }
  
  // Add any registered custom cards
  for (const [id, renderFn] of cardRegistry) {
    try {
      const customSection = document.createElement('section');
      customSection.setAttribute('aria-labelledby', `${id}-heading`);
      const customCard = renderFn();
      if (customCard instanceof HTMLElement) {
        customSection.appendChild(customCard);
        container.appendChild(customSection);
      }
    } catch (error) {
      console.warn(`Failed to render custom card '${id}':`, error);
    }
  }
  
  fragment.appendChild(container);
  return fragment;
}

/**
 * Create Quick Actions card element
 * Extracted from the current "One Gentle Action" functionality
 * @param {Object} options - Card options
 * @param {boolean} options.completedAction - Whether action is completed
 * @param {Function} options.onComplete - Completion callback
 * @returns {HTMLElement} Quick Actions card element
 */
export function createQuickActionsCard({ completedAction = false, onComplete = () => {} } = {}) {
  const card = document.createElement('div');
  card.className = 'action-card';
  card.innerHTML = `
    <div class="action-header">
      <iconify-icon icon="material-symbols:self-improvement"></iconify-icon>
      <h2 class="action-title" id="quick-actions-heading">Quick Actions</h2>
    </div>
    <p>Take a moment to express gratitude to a family member today.</p>
    <button 
      class="action-button ${completedAction ? 'completed' : ''}"
      ${completedAction ? 'disabled' : ''}
    >
      ${completedAction ? 'Completed! ✨' : 'Mark Complete'}
    </button>
  `;
  
  // Add event listener for the button
  const button = card.querySelector('.action-button');
  if (button && !completedAction) {
    button.addEventListener('click', onComplete);
  }
  
  return card;
}

/**
 * Utility: Check if cards container exists in DOM
 * @param {Element} parent - Parent element to check
 * @returns {boolean} True if cards are present
 */
export function hasNestCards(parent) {
  if (!parent || !(parent instanceof Element)) {
    return false;
  }
  return !!parent.querySelector('.nest-cards-container');
}

/**
 * Utility: Count cards in container
 * @param {Element} parent - Parent element containing cards
 * @returns {number} Number of card sections found
 */
export function countNestCards(parent) {
  if (!parent || !(parent instanceof Element)) {
    return 0;
  }
  const container = parent.querySelector('.nest-cards-container');
  return container ? container.querySelectorAll('section').length : 0;
}