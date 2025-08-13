/**
 * Home/Nest component
 * Main authenticated view with responsive layout and family content
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { getStandardCards } from './cards/nest-cards.js';
import { showSuccess, showError, showLoading } from './toast-helper.js';
import { renderLoading, renderEmpty, renderError, stateStyles } from './ui-state-helpers.js';
import { dataOps, withToast } from './db-helpers.js';
import { renderModal, renderConfirmModal, renderFormModal, ModalManager, modalStyles } from './modal-helpers.js';

export class FnHome extends LitElement {
  static properties = {
    session: { type: Object },
    navExpanded: { type: Boolean },
    completedAction: { type: Boolean },
    feedText: { type: String },
    isMobile: { type: Boolean },
    showInlineCards: { type: Boolean },
    currentRoute: { type: String },
    userProfile: { type: Object },
    posts: { type: Array },
    events: { type: Array },
    birthdays: { type: Array },
    acts: { type: Array },
    currentGoal: { type: Object },
    loading: { type: Boolean },
    postsLoading: { type: Boolean },
    eventsLoading: { type: Boolean },
    birthdaysLoading: { type: Boolean },
    goalsLoading: { type: Boolean },
    editingEvent: { type: Object },
    
    // Error states
    postsError: { type: Object },
    eventsError: { type: Object },
    birthdaysError: { type: Object },
    actsError: { type: Object },
    
    // Modal states
    showBirthdayModal: { type: Boolean },
    showEventModal: { type: Boolean },
    showActModal: { type: Boolean },
    showConfirmModal: { type: Boolean },
    confirmModalData: { type: Object },
    
    // Form data
    birthdayFormData: { type: Object },
    eventFormData: { type: Object },
    actFormData: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }
    
    ${stateStyles}
    ${modalStyles}
    
    /* Screen reader only content */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    
    .layout {
      display: grid;
      grid-template-columns: 76px 1fr 320px;
      height: 100vh;
      transition: grid-template-columns 0.3s ease;
    }
    
    .layout.nav-expanded {
      grid-template-columns: 240px 1fr 320px;
    }
    
    @media (max-width: 1023px) {
      .layout {
        grid-template-columns: 60px 1fr;
      }
      
      .layout.nav-expanded {
        grid-template-columns: 60px 1fr;
      }
      
      .sidebar {
        display: none !important;
      }
    }
    
    @media (max-width: 767px) {
      .layout {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr 60px;
      }
      
      .nav {
        order: 2;
        grid-column: 1;
        grid-row: 2;
      }
      
      .main {
        grid-column: 1;
        grid-row: 1;
      }
    }
    
    /* Navigation */
    .nav {
      background: white;
      border-right: 1px solid var(--border);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: hidden;
      z-index: 100;
    }
    
    @media (max-width: 767px) {
      .nav {
        height: 60px;
        border-right: none;
        border-top: 1px solid var(--border);
        position: static;
        overflow: visible;
      }
    }
    
    .nav-header {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    @media (max-width: 767px) {
      .nav-header {
        display: none;
      }
    }
    
    .nav-toggle {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: var(--radius);
    }
    
    .nav-logo {
      font-size: 1.5rem;
      transition: opacity 0.3s;
    }
    
    .nav-logo.expanded {
      opacity: 1;
    }
    
    .nav-logo.collapsed {
      opacity: 0;
    }
    
    .nav-menu {
      padding: 16px 0;
      list-style: none;
      margin: 0;
    }
    
    @media (max-width: 767px) {
      .nav-menu {
        display: flex;
        justify-content: space-around;
        padding: 0;
        height: 60px;
        align-items: center;
      }
    }
    
    .nav-item {
      margin-bottom: 4px;
    }
    
    @media (max-width: 767px) {
      .nav-item {
        margin: 0;
      }
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: var(--text);
      text-decoration: none;
      border-radius: var(--radius);
      margin: 0 8px;
      transition: all 0.2s;
    }
    
    @media (max-width: 767px) {
      .nav-link {
        flex-direction: column;
        gap: 4px;
        padding: 8px;
        margin: 0;
        font-size: 0.75rem;
      }
    }
    
    .nav-link:hover {
      background: var(--secondary);
    }
    
    .nav-link[aria-current="page"] {
      background: var(--primary);
      color: white;
    }
    
    .nav-text {
      transition: opacity 0.3s;
      white-space: nowrap;
    }
    
    .nav-text.expanded {
      opacity: 1;
    }
    
    .nav-text.collapsed {
      opacity: 0;
    }
    
    @media (max-width: 767px) {
      .nav-text {
        opacity: 1;
      }
    }
    
    /* Main Content */
    .main {
      padding: 24px;
      overflow-y: auto;
    }
    
    @media (max-width: 767px) {
      .main {
        padding: 16px;
      }
    }
    
    .greeting-section {
      margin-bottom: 32px;
    }
    
    .greeting {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 8px 0;
    }
    
    @media (max-width: 767px) {
      .greeting {
        font-size: 1.5rem;
      }
    }
    
    .date {
      color: var(--text-light);
      font-size: 1rem;
    }
    
    .action-card {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 32px;
      border: 1px solid var(--border);
    }
    
    .action-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .action-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }
    
    .action-button {
      background: var(--primary);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.3s;
    }
    
    .action-button:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }
    
    .action-button.completed {
      background: var(--success);
    }
    
    .celebration {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 3rem;
      pointer-events: none;
      z-index: 1000;
      opacity: 0;
      animation: celebrate 0.6s ease-out;
    }
    
    @keyframes celebrate {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
    }
    
    .composer {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 32px;
      border: 1px solid var(--border);
    }
    
    .composer-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .composer-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }
    
    .composer-textarea {
      width: 100%;
      min-height: 100px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-family: inherit;
      font-size: 1rem;
      resize: vertical;
    }
    
    .composer-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
    }
    
    .composer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }
    
    .btn {
      padding: 8px 16px;
      border-radius: var(--radius);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-secondary {
      background: var(--secondary);
      border: 1px solid var(--border);
      color: var(--text);
    }
    
    .btn-primary {
      background: var(--primary);
      border: 1px solid var(--primary);
      color: white;
    }
    
    .btn:hover {
      transform: translateY(-1px);
    }
    
    .feed-placeholder {
      background: white;
      border-radius: var(--radius);
      padding: 48px 24px;
      box-shadow: var(--shadow);
      text-align: center;
      border: 1px solid var(--border);
    }
    
    .feed-placeholder iconify-icon {
      font-size: 3rem;
      color: var(--text-light);
      margin-bottom: 16px;
    }
    
    .feed-placeholder h3 {
      margin: 0 0 8px 0;
      color: var(--text);
    }
    
    .feed-placeholder p {
      margin: 0;
      color: var(--text-light);
    }
    
    /* Route Pages */
    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    
    .page-header iconify-icon {
      font-size: 2rem;
      color: var(--primary);
    }
    
    .page-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
    }
    
    .route-placeholder {
      background: white;
      border-radius: var(--radius);
      padding: 48px 24px;
      text-align: center;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }
    
    .route-placeholder h3 {
      margin: 0 0 24px 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text);
    }
    
    .route-placeholder p {
      margin: 16px 0;
      color: var(--text-light);
      font-size: 1.125rem;
      line-height: 1.6;
    }
    
    .route-placeholder ul {
      text-align: left;
      max-width: 600px;
      margin: 24px auto;
      padding: 0;
      list-style: none;
    }
    
    .route-placeholder li {
      margin: 12px 0;
      padding-left: 20px;
      position: relative;
      color: var(--text);
      line-height: 1.5;
    }
    
    .route-placeholder li::before {
      content: '•';
      color: var(--primary);
      font-weight: bold;
      position: absolute;
      left: 0;
    }
    
    /* Posts Feed */
    .posts-feed {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .post-card {
      background: white;
      border-radius: var(--radius);
      padding: 20px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }
    
    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .post-author {
      font-weight: 600;
      color: var(--text);
    }
    
    .post-date {
      font-size: 0.875rem;
      color: var(--text-light);
    }
    
    .post-body {
      color: var(--text);
      line-height: 1.5;
      white-space: pre-wrap;
    }
    
    /* Events */
    .creation-form {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 32px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }
    
    .creation-form h3 {
      margin: 0 0 16px 0;
      color: var(--text);
    }
    
    .form-row {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .form-row input {
      flex: 1;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.9rem;
    }
    
    .form-row input:focus {
      outline: none;
      border-color: var(--primary);
    }
    
    .form-actions {
      display: flex;
      gap: 8px;
    }
    
    .events-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .event-card {
      background: white;
      border-radius: var(--radius);
      padding: 20px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }
    
    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .event-actions {
      display: flex;
      gap: 8px;
    }
    
    .btn-icon {
      background: none;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-light);
      transition: all 0.2s;
      min-width: 32px;
      min-height: 32px;
    }
    
    .btn-icon:hover {
      background: var(--secondary);
      color: var(--text);
    }
    
    .btn-icon.btn-danger:hover {
      background: var(--error);
      color: white;
      border-color: var(--error);
    }
    
    .btn-icon:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
    
    /* Goals and Acts styles */
    .goal-card {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      margin-bottom: 24px;
    }
    
    .goal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .goal-header h3 {
      margin: 0;
      color: var(--text);
    }
    
    .goal-progress {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .progress-bar {
      width: 120px;
      height: 8px;
      background: var(--secondary);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: var(--primary);
      transition: width 0.3s ease;
    }
    
    .progress-text {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
    }
    
    .goal-description {
      margin: 0;
      color: var(--text-light);
    }
    
    .acts-section {
      margin-top: 32px;
    }
    
    .acts-section h3 {
      margin: 0 0 16px 0;
      color: var(--text);
    }
    
    .acts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .act-card {
      background: white;
      border-radius: var(--radius);
      padding: 16px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }
    
    .act-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .act-info {
      flex: 1;
    }
    
    .act-description {
      font-weight: 500;
      color: var(--text);
      display: block;
      margin-bottom: 4px;
    }
    
    .act-meta {
      display: flex;
      gap: 16px;
      font-size: 0.875rem;
      color: var(--text-light);
    }
    
    .act-points {
      background: var(--primary);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .event-title {
      margin: 0;
      color: var(--text);
      font-size: 1.125rem;
    }
    
    .event-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-light);
      font-size: 0.875rem;
    }
    
    .event-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .event-date,
    .event-location {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
      font-size: 0.9rem;
    }
    
    .event-date iconify-icon,
    .event-location iconify-icon {
      color: var(--primary);
    }
    
    /* Loading states */
    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(99, 102, 241, 0.3);
      border-top: 2px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      color: var(--text-light);
      gap: 12px;
    }
    
    .data-panel-loading {
      background: white;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--text-light);
    }
    
    .empty-state iconify-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      color: var(--text-light);
    }
    
    .empty-state h3 {
      margin: 0 0 8px 0;
      color: var(--text);
    }
    
    .empty-state p {
      margin: 0;
    }
    
    /* Sidebar */
    .sidebar {
      background: white;
      border-left: 1px solid var(--border);
      padding: 24px 16px;
    }
    
    .sticky-col {
      position: sticky;
      top: 80px;
      height: calc(100vh - 80px);
      overflow-y: auto;
    }
    
    .sidebar-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 24px 0;
      color: var(--text);
    }
    
    .sidebar-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    /* Mobile & Tablet Inline Cards */
    .mobile-cards {
      display: grid;
      gap: 16px;
      margin-bottom: 32px;
    }
    
    /* Tablet: 2 column grid when space allows */
    @media (min-width: 768px) and (max-width: 1023px) {
      .mobile-cards {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }
    }
    
    /* Mobile: single column */
    @media (max-width: 767px) {
      .mobile-cards {
        grid-template-columns: 1fr;
      }
      
      .floating-add {
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--primary);
        color: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 4px 12px rgb(0 0 0 / 0.25);
        z-index: 100;
      }
    }
  `;

  constructor() {
    super();
    this.navExpanded = false;
    this.completedAction = false;
    this.feedText = '';
    this.isMobile = window.innerWidth <= 767;
    this.showInlineCards = window.innerWidth <= 1023; // Include tablet for inline cards
    this.currentRoute = this.getRouteFromHash() || 'nest';
    this.userProfile = null;
    this.posts = [];
    this.events = [];
    this.birthdays = [];
    this.acts = [];
    this.currentGoal = null;
    this.loading = false;
    this.postsLoading = true;
    this.eventsLoading = true;
    this.birthdaysLoading = true;
    this.goalsLoading = true;
    this.editingEvent = null;
    
    // Error states
    this.postsError = null;
    this.eventsError = null;
    this.birthdaysError = null;
    this.actsError = null;
    
    // Modal states
    this.showBirthdayModal = false;
    this.showEventModal = false;
    this.showActModal = false;
    this.showConfirmModal = false;
    this.confirmModalData = null;
    
    // Form data
    this.birthdayFormData = {};
    this.eventFormData = {};
    this.actFormData = {};
    
    // Modal manager for accessibility
    this.modalManager = new ModalManager();
    
    // Listen for window resize
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 767;
      this.showInlineCards = window.innerWidth <= 1023;
    });
    
    // Listen for hash changes for routing
    window.addEventListener('hashchange', () => {
      const newRoute = this.getRouteFromHash() || 'nest';
      if (newRoute !== this.currentRoute) {
        this.currentRoute = newRoute;
        this.setMainFocus();
      }
    });
  }
    window.addEventListener('hashchange', () => {
      this.currentRoute = this.getRouteFromHash() || 'nest';
      this.setMainFocus();
    });
    
    // Add keyboard navigation support
    window.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Initialize data when component is ready
    this.initializeData();
  }

  /**
   * React to property changes
   */
  updated(changedProperties) {
    if (changedProperties.has('session') && this.session?.user) {
      this.initializeData();
    }
  }

  /**
   * Get greeting based on time of day
   */
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  /**
   * Set focus on main heading when route changes (accessibility)
   */
  setMainFocus() {
    // Wait for DOM update
    setTimeout(() => {
      const mainHeading = this.shadowRoot.querySelector('h1');
      if (mainHeading) {
        mainHeading.focus();
        mainHeading.tabIndex = -1; // Make it focusable programmatically but not via tab
      }
    }, 0);
  }

  /**
   * Handle keyboard navigation (accessibility)
   */
  handleKeydown(event) {
    // Handle keyboard activation for navigation links
    if (event.key === 'Enter' || event.key === ' ') {
      const target = event.target.closest('.nav-link');
      if (target) {
        event.preventDefault();
        target.click();
      }
    }
  }

  /**
   * Get current date formatted
   */
  getCurrentDate() {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get user's first name
   */
  getUserName() {
    const fullName = this.session?.user?.user_metadata?.full_name || 
                     this.session?.user?.email?.split('@')[0] || 
                     'Family Member';
    return fullName.split(' ')[0];
  }

  /**
   * Format post creation date for display
   */
  formatPostDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  /**
   * Format event date for display
   */
  formatEventDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  /**
   * Handle event form submission with validation
   */
  async handleEventSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const title = e.target.querySelector('#event-title').value;
    const dateTime = e.target.querySelector('#event-date').value;
    const location = e.target.querySelector('#event-location').value;
    
    if (!title.trim() || !dateTime) {
      showError('Please provide both title and date for the event.');
      return;
    }
    
    // Validate date is not in the past (allow same day)
    const eventDate = new Date(dateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      showError('Event date cannot be in the past.');
      return;
    }
    
    const loadingToast = showLoading(this.editingEvent ? 'Updating event...' : 'Creating event...');
    
    try {
      let success;
      if (this.editingEvent) {
        success = await this.updateEvent(this.editingEvent.id, title, dateTime, location || null);
      } else {
        success = await this.createEvent(title, dateTime, location || null);
      }
      
      if (success) {
        loadingToast.success(this.editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
        // Clear form and editing state
        e.target.reset();
        this.editingEvent = null;
      } else {
        loadingToast.error('Failed to save event. Please try again.');
      }
    } catch (error) {
      loadingToast.error('An error occurred while saving the event.');
      console.error('Event submission error:', error);
    }
  }

  /**
   * Handle act form submission
   */
  async handleActSubmit(e) {
    e.preventDefault();
    
    const description = e.target.querySelector('#act-description').value;
    const points = parseInt(e.target.querySelector('#act-points').value);
    const kind = e.target.querySelector('#act-kind').value;
    
    if (!description.trim() || !kind || points < 1) {
      showError('Please fill in all fields with valid values.');
      return;
    }
    
    const loadingToast = showLoading('Logging act...');
    
    try {
      const success = await this.createAct(kind, points, { description: description.trim() });
      
      if (success) {
        loadingToast.success('Act logged successfully!');
        // Clear form
        e.target.reset();
        e.target.querySelector('#act-points').value = '1'; // Reset to default
      } else {
        loadingToast.error('Failed to log act. Please try again.');
      }
    } catch (error) {
      loadingToast.error('An error occurred while logging the act.');
      console.error('Act submission error:', error);
    }
  }

  /**
   * Start editing an event
   */
  editEvent(event) {
    this.editingEvent = event;
    
    // Populate form with event data
    const form = this.shadowRoot.querySelector('form');
    if (form) {
      form.querySelector('#event-title').value = event.title;
      form.querySelector('#event-location').value = event.location || '';
      
      // Format date for datetime-local input
      const eventDate = new Date(event.starts_at);
      const formattedDate = eventDate.toISOString().slice(0, 16);
      form.querySelector('#event-date').value = formattedDate;
    }
    
    // Scroll to form
    const creationForm = this.shadowRoot.querySelector('.creation-form');
    if (creationForm) {
      creationForm.scrollIntoView({ behavior: 'smooth' });
      // Focus the title field
      setTimeout(() => {
        form.querySelector('#event-title').focus();
      }, 300);
    }
  }

  /**
   * Cancel editing an event
   */
  cancelEditEvent() {
    this.editingEvent = null;
    const form = this.shadowRoot.querySelector('form');
    if (form) {
      form.reset();
    }
  }

  /**
   * Delete an event with confirmation
   */
  async deleteEvent(event) {
    this.confirmModalData = {
      title: 'Delete Event',
      message: `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await dataOps.delete(
            () => supabase.from('events').delete().eq('id', event.id),
            this,
            'events',
            event.id,
            {
              optimistic: true,
              successMessage: 'Event deleted successfully',
              errorMessage: 'Failed to delete event'
            }
          );
          this.closeAllModals();
        } catch (error) {
          // Error handled by dataOps
        }
      },
      onCancel: () => this.closeAllModals()
    };
    this.showConfirmModal = true;
  }

  /**
   * Edit an act
   */
  editAct(act) {
    this.actFormData = {
      id: act.id,
      description: act.description,
      points: act.points,
      kind: act.kind
    };
    this.showActModal = true;
  }

  /**
   * Delete an act with confirmation
   */
  async deleteAct(act) {
    this.confirmModalData = {
      title: 'Delete Act',
      message: `Are you sure you want to delete this act: "${act.description || act.kind}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await dataOps.delete(
            () => supabase.from('acts').delete().eq('id', act.id),
            this,
            'acts',
            act.id,
            {
              optimistic: true,
              successMessage: 'Act deleted successfully',
              errorMessage: 'Failed to delete act'
            }
          );
          this.closeAllModals();
          // Reload goal after act changes
          this.loadCurrentGoal();
        } catch (error) {
          // Error handled by dataOps
        }
      },
      onCancel: () => this.closeAllModals()
    };
    this.showConfirmModal = true;
  }

  /**
   * Toggle navigation expanded state
   */
  toggleNav() {
    this.navExpanded = !this.navExpanded;
  }

  /**
   * Complete gentle action with celebration
   */
  async completeAction() {
    this.completedAction = true;
    
    // Create an act for completing the gentle action
    await this.createAct('gentle_action', 1, { 
      description: 'Completed daily gentle action' 
    });
    
    // Show celebration animation
    const celebration = this.shadowRoot.querySelector('.celebration');
    if (celebration) {
      celebration.style.display = 'block';
      setTimeout(() => {
        celebration.style.display = 'none';
      }, 600);
    }
    
    // Reset after delay
    setTimeout(() => {
      this.completedAction = false;
    }, 3000);
  }

  /**
   * Handle feed post submission
   */
  async handleFeedSubmit() {
    if (this.feedText.trim()) {
      this.loading = true;
      const success = await this.createPost(this.feedText);
      this.loading = false;
      
      if (success) {
        this.feedText = '';
      } else {
        // Show error message to user
        console.error('Failed to create post');
      }
    }
  }

  /**
   * Handle sign out
   */
  async handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  /**
   * Initialize data from Supabase
   */
  async initializeData() {
    if (!this.session?.user) return;
    
    try {
      await this.loadUserProfile();
      await this.loadPosts();
      await this.loadEvents();
      await this.loadBirthdays();
      await this.loadActs();
      await this.loadCurrentGoal();
    } catch (error) {
      console.error('Failed to initialize data:', error);
    }
  }

  /**
   * Load current user profile from public.me view
   */
  async loadUserProfile() {
    try {
      const { data, error } = await supabase
        .from('me')
        .select('*')
        .single();
      
      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }
      
      this.userProfile = data;
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  /**
   * Load posts for user's family
   */
  async loadPosts() {
    if (!this.userProfile?.family_id) {
      this.postsLoading = false;
      return;
    }
    
    try {
      await dataOps.load(
        () => supabase
          .from('posts')
          .select(`
            *,
            author:profiles!posts_author_id_fkey(full_name)
          `)
          .eq('family_id', this.userProfile.family_id)
          .order('created_at', { ascending: false })
          .limit(10),
        this,
        'postsLoading',
        'posts',
        { 
          errorMessage: 'Failed to load family posts',
          showToast: false // We'll handle errors in the UI
        }
      );
      this.postsError = null;
    } catch (error) {
      this.postsError = error;
    }
  }

  /**
   * Retry loading posts
   */
  retryLoadPosts() {
    this.postsError = null;
    this.loadPosts();
  }

  /**
   * Load events for user's family
   */
  async loadEvents() {
    if (!this.userProfile?.family_id) {
      this.eventsLoading = false;
      return;
    }
    
    try {
      await dataOps.load(
        () => supabase
          .from('events')
          .select(`
            *,
            owner:profiles!events_owner_id_fkey(full_name)
          `)
          .eq('family_id', this.userProfile.family_id)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(5),
        this,
        'eventsLoading',
        'events',
        { 
          errorMessage: 'Failed to load upcoming events',
          showToast: false
        }
      );
      this.eventsError = null;
    } catch (error) {
      this.eventsError = error;
    }
  }

  /**
   * Retry loading events
   */
  retryLoadEvents() {
    this.eventsError = null;
    this.loadEvents();
  }

  /**
   * Load birthdays from profiles for user's family
   */
  async loadBirthdays() {
    if (!this.userProfile?.family_id) {
      this.birthdaysLoading = false;
      return;
    }
    
    try {
      const data = await dataOps.load(
        () => supabase
          .from('profiles')
          .select('full_name, dob')
          .eq('family_id', this.userProfile.family_id)
          .not('dob', 'is', null),
        this,
        'birthdaysLoading',
        'birthdays', // We'll process this data before setting it
        { 
          errorMessage: 'Failed to load family birthdays',
          showToast: false
        }
      );
      
      // Process birthdays into the format expected by the birthday card
      this.birthdays = this.processBirthdaysForCard(data || []);
      this.birthdaysError = null;
    } catch (error) {
      this.birthdaysError = error;
      this.birthdays = [];
    }
  }

  /**
   * Retry loading birthdays
   */
  retryLoadBirthdays() {
    this.birthdaysError = null;
    this.loadBirthdays();
  }

  /**
   * Process raw birthday data into format expected by birthday card
   */
  processBirthdaysForCard(profiles) {
    const now = new Date();
    
    const processed = profiles.map(profile => {
      const birthDate = this.parseUTCDate(profile.dob);
      const { nextOccurrence, turningAge } = this.getNextOccurrence(birthDate, now);
      const daysUntil = this.getDaysUntil(nextOccurrence, now);
      
      return {
        name: profile.full_name,
        dob: profile.dob,
        birthDate,
        nextOccurrence,
        turningAge,
        daysUntil,
        avatar: this.getAvatar(profile.full_name),
        dateText: this.formatBirthdayDate(nextOccurrence),
        countdownText: this.formatCountdown(daysUntil),
        isToday: daysUntil === 0
      };
    });
    
    // Sort by days until next occurrence and limit to 3
    return processed
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }

  /**
   * Parse date of birth as UTC to avoid timezone issues
   */
  parseUTCDate(dobString) {
    const [year, month, day] = dobString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  /**
   * Get the next occurrence of a birthday
   */
  getNextOccurrence(birthDate, now = new Date()) {
    const currentYear = now.getUTCFullYear();
    const birthMonth = birthDate.getUTCMonth();
    const birthDay = birthDate.getUTCDate();
    const birthYear = birthDate.getUTCFullYear();
    
    let nextOccurrence = new Date(Date.UTC(currentYear, birthMonth, birthDay));
    
    if (nextOccurrence < now) {
      nextOccurrence = new Date(Date.UTC(currentYear + 1, birthMonth, birthDay));
    }
    
    const turningAge = nextOccurrence.getUTCFullYear() - birthYear;
    
    return { nextOccurrence, turningAge };
  }

  /**
   * Calculate days until a date
   */
  getDaysUntil(targetDate, now = new Date()) {
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Format countdown text for display
   */
  formatCountdown(daysUntil) {
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'in 1 day';
    return `in ${daysUntil} days`;
  }

  /**
   * Format birthday date for display
   */
  formatBirthdayDate(date) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    });
  }

  /**
   * Get avatar emoji based on name
   */
  getAvatar(name) {
    const avatars = {
      'Mariem': '👩',
      'Yazid': '👦',
      'Yahya': '👶',
      'Ghassan': '👨'
    };
    // Default to first letter of name if not in predefined list
    return avatars[name] || name.charAt(0).toUpperCase();
  }

  /**
   * Create a new post
   */
  async createPost(body) {
    if (!this.userProfile?.family_id || !body.trim()) return false;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          family_id: this.userProfile.family_id,
          author_id: this.session.user.id,
          body: body.trim(),
          visibility: 'family'
        })
        .select(`
          *,
          author:profiles!posts_author_id_fkey(full_name)
        `)
        .single();
      
      if (error) {
        console.error('Error creating post:', error);
        return false;
      }
      
      // Add new post to the beginning of the posts array
      this.posts = [data, ...this.posts];
      return true;
    } catch (error) {
      console.error('Failed to create post:', error);
      return false;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(title, startsAt, location = null) {
    if (!this.userProfile?.family_id || !title.trim()) return false;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          family_id: this.userProfile.family_id,
          owner_id: this.session.user.id,
          title: title.trim(),
          location,
          starts_at: startsAt
        })
        .select(`
          *,
          owner:profiles!events_owner_id_fkey(full_name)
        `)
        .single();
      
      if (error) {
        console.error('Error creating event:', error);
        return false;
      }
      
      // Add new event to the events array and re-sort
      this.events = [...this.events, data].sort((a, b) => 
        new Date(a.starts_at) - new Date(b.starts_at)
      );
      return true;
    } catch (error) {
      console.error('Failed to create event:', error);
      return false;
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId, title, startsAt, location = null) {
    if (!this.userProfile?.family_id || !title.trim()) return false;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          title: title.trim(),
          location,
          starts_at: startsAt
        })
        .eq('id', eventId)
        .eq('family_id', this.userProfile.family_id)
        .select(`
          *,
          owner:profiles!events_owner_id_fkey(full_name)
        `)
        .single();
      
      if (error) {
        console.error('Error updating event:', error);
        return false;
      }
      
      // Update the event in the events array
      this.events = this.events.map(event => 
        event.id === eventId ? data : event
      ).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      
      return true;
    } catch (error) {
      console.error('Failed to update event:', error);
      return false;
    }
  }

  /**
   * Remove an event
   */
  async removeEvent(eventId) {
    if (!this.userProfile?.family_id) return false;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('family_id', this.userProfile.family_id);
      
      if (error) {
        console.error('Error deleting event:', error);
        return false;
      }
      
      // Remove event from the events array
      this.events = this.events.filter(event => event.id !== eventId);
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      return false;
    }
  }
    } catch (error) {
      console.error('Failed to create event:', error);
      return false;
    }
  }

  /**
   * Load acts for user's family
   */
  async loadActs() {
    if (!this.userProfile?.family_id) {
      this.goalsLoading = false;
      return;
    }
    
    try {
      await dataOps.load(
        () => supabase
          .from('acts')
          .select(`
            *,
            user:profiles!acts_user_id_fkey(full_name)
          `)
          .eq('family_id', this.userProfile.family_id)
          .order('created_at', { ascending: false })
          .limit(20),
        this,
        'goalsLoading',
        'acts',
        { 
          errorMessage: 'Failed to load family acts',
          showToast: false
        }
      );
      this.actsError = null;
    } catch (error) {
      this.actsError = error;
    }
  }

  /**
   * Retry loading acts
   */
  retryLoadActs() {
    this.actsError = null;
    this.loadActs();
  }

  /**
   * Load current family goal (for now, create a simple goal based on acts)
   */
  async loadCurrentGoal() {
    this.goalsLoading = true;
    try {
      if (!this.acts || this.acts.length === 0) {
        this.currentGoal = null;
        return;
      }
      
      // For now, create a simple goal based on recent acts
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(thisMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const monthlyActs = this.acts.filter(act => 
        new Date(act.created_at) >= thisMonth
      );
      
      const totalPoints = monthlyActs.reduce((sum, act) => sum + (act.points || 1), 0);
      
      this.currentGoal = {
        id: 'monthly-kindness',
        title: "Monthly Family Kindness",
        description: "Perform acts of kindness together as a family this month",
        target: 50,
        current: totalPoints,
        unit: "points",
        startDate: thisMonth,
        endDate: nextMonth,
        participants: [...new Set(monthlyActs.map(act => act.user?.full_name).filter(Boolean))],
        milestones: [
          { percentage: 25, label: "Getting started!" },
          { percentage: 50, label: "Halfway there!" },
          { percentage: 75, label: "Almost done!" }
        ]
      };
    } catch (error) {
      console.error('Failed to load current goal:', error);
    } finally {
      this.goalsLoading = false;
    }
  }

  /**
   * Create a new act (goal contribution)
   */
  async createAct(kind, points = 1, meta = {}) {
    if (!this.userProfile?.family_id) return false;
    
    try {
      const { data, error } = await supabase
        .from('acts')
        .insert({
          family_id: this.userProfile.family_id,
          user_id: this.session.user.id,
          kind,
          points,
          meta
        })
        .select(`
          *,
          user:profiles!acts_user_id_fkey(full_name)
        `)
        .single();
      
      if (error) {
        console.error('Error creating act:', error);
        return false;
      }
      
      // Add new act to the beginning of the acts array
      this.acts = [data, ...this.acts];
      
      // Reload current goal to update progress
      await this.loadCurrentGoal();
      
      return true;
    } catch (error) {
      console.error('Failed to create act:', error);
      return false;
    }
  }

  /**
   * Render cards ensuring parity between mobile and desktop layouts
   * Uses the cards utility to maintain consistent card definitions
   * @param {boolean} includeQuickActions - Whether to include Quick Actions card
   * @returns {TemplateResult} LitElement template with cards
   */
  renderCards(includeQuickActions = false) {
    return html`
      <section aria-labelledby="events-heading">
        <fn-card-events></fn-card-events>
      </section>
      <section aria-labelledby="birthday-heading">
        <fn-card-birthday .birthdays=${this.birthdays}></fn-card-birthday>
      </section>
      <section aria-labelledby="tip-heading">
        <fn-card-tip></fn-card-tip>
      </section>
      <section aria-labelledby="goal-heading">
        <fn-card-goal .goal=${this.currentGoal} .acts=${this.acts}></fn-card-goal>
      </section>
      ${includeQuickActions ? html`
        <section aria-labelledby="quick-actions-heading">
          <div class="action-card">
            <div class="action-header">
              <iconify-icon icon="material-symbols:self-improvement"></iconify-icon>
              <h2 class="action-title" id="quick-actions-heading">Quick Actions</h2>
            </div>
            <p>Take a moment to express gratitude to a family member today.</p>
            <button 
              class="action-button ${this.completedAction ? 'completed' : ''}"
              @click=${this.completeAction}
              ?disabled=${this.completedAction}
            >
              ${this.completedAction ? 'Completed! ✨' : 'Mark Complete'}
            </button>
          </div>
        </section>
      ` : ''}
    `;
  }

  /**
   * Set focus to main content heading for accessibility
   */
  setMainFocus() {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      const mainHeading = this.shadowRoot?.querySelector('#main-content');
      if (mainHeading) {
        mainHeading.focus();
        mainHeading.tabIndex = -1; // Remove from tab order after focus
      }
    });
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(e) {
    // Global keyboard shortcuts
    switch (e.key) {
      case 'Escape':
        // Close any open modals
        if (this.showBirthdayModal || this.showEventModal || this.showActModal || this.showConfirmModal) {
          this.closeAllModals();
          e.preventDefault();
        }
        break;
    }
  }

  /**
   * Close all modals
   */
  closeAllModals() {
    this.showBirthdayModal = false;
    this.showEventModal = false;
    this.showActModal = false;
    this.showConfirmModal = false;
    this.confirmModalData = null;
    this.modalManager.close();
  }

  /**
   * Get current route from window location hash
   */
  getRouteFromHash() {
    return window.location.hash.slice(1) || null;
  }

  /**
   * Navigate to a specific route
   */
  navigateToRoute(route) {
    window.location.hash = route;
    this.setMainFocus(); // Set focus to main content when route changes
  }

  /**
   * Handle navigation click
   */
  handleNavClick(e, route) {
    e.preventDefault();
    this.navigateToRoute(route);
  }

  /**
   * Handle navigation keyboard events
   */
  handleNavKeyDown(e, route) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.navigateToRoute(route);
    }
  }

  /**
   * Render the main content based on current route
   */
  renderRouteContent() {
    switch (this.currentRoute) {
      case 'feed':
        return this.renderFeedView();
      case 'chores':
        return this.renderChoresView();
      case 'events':
        return this.renderEventsView();
      case 'goals':
        return this.renderGoalsView();
      case 'notes':
        return this.renderNotesView();
      case 'profile':
        return this.renderProfileView();
      case 'insights':
        return this.renderInsightsView();
      case 'nest':
      default:
        return this.renderNestView();
    }
  }

  /**
   * Render Nest (default) view
   */
  renderNestView() {
    return html`
      <!-- Page Title -->
      <fn-page-title></fn-page-title>

      <!-- Mobile/Tablet Cards (shown above feed when no sidebar) -->
      ${this.showInlineCards ? html`
        <div class="mobile-cards">
          ${this.renderCards(false)}
        </div>
      ` : ''}

      <!-- Composer -->
      <div class="composer">
        <div class="composer-header">
          <iconify-icon icon="material-symbols:edit"></iconify-icon>
          <h3 class="composer-title">Share with Family</h3>
        </div>
        <textarea 
          class="composer-textarea"
          placeholder="What's on your mind?"
          .value=${this.feedText}
          @input=${(e) => this.feedText = e.target.value}
        ></textarea>
        <div class="composer-actions">
          <button class="btn btn-secondary" @click=${() => this.feedText = ''}>
            Clear
          </button>
          <button class="btn btn-primary" @click=${this.handleFeedSubmit}>
            Share
          </button>
        </div>
      </div>

      <!-- Feed Placeholder -->
      <div class="feed-placeholder">
        <iconify-icon icon="material-symbols:dynamic-feed"></iconify-icon>
        <h3>Family Feed Coming Soon</h3>
        <p>This is where family updates and shared moments will appear.</p>
      </div>
    `;
  }

  /**
   * Render Feed view
   */
  renderFeedView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:dynamic-feed"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Family Feed</h1>
      </div>
      
      <!-- Composer -->
      <div class="composer">
        <div class="composer-header">
          <iconify-icon icon="material-symbols:edit"></iconify-icon>
          <h3 class="composer-title">Share with Family</h3>
        </div>
        <textarea 
          class="composer-textarea"
          placeholder="What's on your mind?"
          .value=${this.feedText}
          @input=${(e) => this.feedText = e.target.value}
        ></textarea>
        <div class="composer-actions">
          <button class="btn btn-secondary" @click=${() => this.feedText = ''}>
            Clear
          </button>
          <button class="btn btn-primary" @click=${this.handleFeedSubmit} 
                  ?disabled=${this.loading}>
            ${this.loading ? 'Posting...' : 'Share'}
          </button>
        </div>
      </div>

      <!-- Posts Feed -->
      <div class="posts-feed">
        ${this.postsLoading ? 
          renderLoading('Loading family posts...') :
          this.postsError ? 
          renderError({
            message: 'Failed to load family posts',
            onRetry: () => this.retryLoadPosts()
          }) :
          this.posts.length > 0 ? html`
            ${this.posts.map(post => html`
              <article class="post-card">
                <div class="post-header">
                  <span class="post-author">${post.author?.full_name || 'Family Member'}</span>
                  <time class="post-date">${this.formatPostDate(post.created_at)}</time>
                </div>
                <div class="post-body">${post.body}</div>
              </article>
            `)}
          ` : 
          renderEmpty({
            icon: 'material-symbols:dynamic-feed',
            title: 'No posts yet',
            description: 'Be the first to share something with your family!',
            actionText: 'Create a Post',
            onAction: () => {
              const textarea = this.shadowRoot.querySelector('.composer-textarea');
              if (textarea) textarea.focus();
            }
          })
        }
      </div>
    `;
  }

  /**
   * Render Chores view
   */
  renderChoresView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:checklist"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Family Chores</h1>
      </div>
      <div class="route-placeholder">
        <h3>📋 Family Chores & Responsibilities</h3>
        <p>This feature will help organize and track family chores with gentle accountability. Each family member will be able to:</p>
        <ul>
          <li>View assigned daily and weekly tasks</li>
          <li>Mark chores as complete</li>
          <li>Earn appreciation points for contributions</li>
          <li>See family progress toward shared goals</li>
        </ul>
        <p><strong>Coming Soon:</strong> Integration with the family points system and celebration features.</p>
      </div>
    `;
  }

  /**
   * Render Events view
   */
  renderEventsView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:event"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Family Events</h1>
      </div>
      
      <!-- Event Creation Form -->
      <div class="creation-form">
        <h3>${this.editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
        <form @submit=${this.handleEventSubmit}>
          <div class="form-row">
            <input type="text" id="event-title" placeholder="Event title" required>
            <input type="datetime-local" id="event-date" required>
          </div>
          <div class="form-row">
            <input type="text" id="event-location" placeholder="Location (optional)">
            <div class="form-actions">
              ${this.editingEvent ? html`
                <button type="button" class="btn btn-secondary" @click=${this.cancelEditEvent}>
                  Cancel
                </button>
              ` : ''}
              <button type="submit" class="btn btn-primary" ?disabled=${this.loading}>
                ${this.loading ? 'Saving...' : this.editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Events List -->
      <div class="events-list">
        ${this.eventsLoading ? 
          renderLoading('Loading family events...') :
          this.eventsError ? 
          renderError({
            message: 'Failed to load family events',
            onRetry: () => this.retryLoadEvents()
          }) :
          this.events.length > 0 ? html`
            ${this.events.map(event => html`
              <div class="event-card">
                <div class="event-header">
                  <h4 class="event-title">${event.title}</h4>
                  <div class="event-actions">
                    <button class="btn-icon" @click=${() => this.editEvent(event)} 
                            aria-label="Edit event">
                      <iconify-icon icon="material-symbols:edit"></iconify-icon>
                    </button>
                    <button class="btn-icon btn-danger" @click=${() => this.deleteEvent(event)} 
                            aria-label="Delete event">
                      <iconify-icon icon="material-symbols:delete"></iconify-icon>
                    </button>
                  </div>
                </div>
                <div class="event-meta">
                  <iconify-icon icon="material-symbols:person"></iconify-icon>
                  <span>${event.owner?.full_name || 'Family Member'}</span>
                </div>
                <div class="event-details">
                  <div class="event-date">
                    <iconify-icon icon="material-symbols:schedule"></iconify-icon>
                    <span>${this.formatEventDate(event.starts_at)}</span>
                  </div>
                  ${event.location ? html`
                    <div class="event-location">
                      <iconify-icon icon="material-symbols:location-on"></iconify-icon>
                      <span>${event.location}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `)}
          ` : 
          renderEmpty({
            icon: 'material-symbols:event',
            title: 'No upcoming events',
            description: 'Create the first event for your family!',
            actionText: 'Create Event',
            onAction: () => {
              const titleInput = this.shadowRoot.querySelector('#event-title');
              if (titleInput) titleInput.focus();
            }
          })
        }
      </div>
    `;
  }

  /**
   * Render Goals view
   */
  renderGoalsView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:flag"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Family Goals & Acts</h1>
      </div>
      
      <!-- Current Goal Display -->
      ${this.goalsLoading ? 
        renderLoading('Loading family goal...') :
        this.actsError ? 
        renderError({
          message: 'Failed to load family acts',
          onRetry: () => this.retryLoadActs()
        }) :
        this.currentGoal ? html`
          <div class="goal-card">
            <div class="goal-header">
              <h3>${this.currentGoal.title}</h3>
              <div class="goal-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${Math.min((this.currentGoal.current / this.currentGoal.target) * 100, 100)}%"></div>
                </div>
                <span class="progress-text">${this.currentGoal.current}/${this.currentGoal.target} ${this.currentGoal.unit}</span>
              </div>
            </div>
            <p class="goal-description">${this.currentGoal.description}</p>
          </div>
        ` : 
        renderEmpty({
          icon: 'material-symbols:flag',
          title: 'No active goal',
          description: 'Create your first family goal by logging some acts of kindness below!',
          actionText: 'Log an Act',
          onAction: () => {
            const actInput = this.shadowRoot.querySelector('#act-description');
            if (actInput) actInput.focus();
          }
        })
      }
      
      <!-- Act Creation Form -->
      <div class="creation-form">
        <h3>Log Family Act</h3>
        <form @submit=${this.handleActSubmit}>
          <div class="form-row">
            <input type="text" id="act-description" placeholder="What kind act did you do?" required>
            <input type="number" id="act-points" placeholder="Points" value="1" min="1" max="10" required>
          </div>
          <div class="form-row">
            <select id="act-kind" required>
              <option value="">Select category...</option>
              <option value="kindness">Act of Kindness</option>
              <option value="help">Helping Others</option>
              <option value="chore">Completed Chore</option>
              <option value="learning">Learning Together</option>
              <option value="creativity">Creative Activity</option>
              <option value="exercise">Physical Activity</option>
              <option value="other">Other</option>
            </select>
            <button type="submit" class="btn btn-primary" ?disabled=${this.loading}>
              ${this.loading ? 'Logging...' : 'Log Act'}
            </button>
          </div>
        </form>
      </div>

      <!-- Recent Acts List -->
      <div class="acts-section">
        <h3>Recent Family Acts</h3>
        <div class="acts-list">
          ${this.acts.length > 0 ? html`
            ${this.acts.slice(0, 10).map(act => html`
              <div class="act-card">
                <div class="act-header">
                  <div class="act-info">
                    <span class="act-description">${act.description || act.kind}</span>
                    <div class="act-meta">
                      <span class="act-author">${act.user?.full_name || 'Family Member'}</span>
                      <span class="act-date">${this.formatPostDate(act.created_at)}</span>
                    </div>
                  </div>
                  <div class="act-points">+${act.points}</div>
                </div>
                <div class="act-actions">
                  <button class="btn-icon" @click=${() => this.editAct(act)} 
                          aria-label="Edit act">
                    <iconify-icon icon="material-symbols:edit"></iconify-icon>
                  </button>
                  <button class="btn-icon btn-danger" @click=${() => this.deleteAct(act)} 
                          aria-label="Delete act">
                    <iconify-icon icon="material-symbols:delete"></iconify-icon>
                  </button>
                </div>
              </div>
            `)}
          ` : 
          renderEmpty({
            icon: 'material-symbols:volunteer-activism',
            title: 'No acts recorded yet',
            description: 'Start logging your family\'s acts of kindness and achievements!',
            actionText: 'Log First Act',
            onAction: () => {
              const actInput = this.shadowRoot.querySelector('#act-description');
              if (actInput) actInput.focus();
            }
          })
          }
        </div>
      </div>
    `;
  }

  /**
   * Render Notes view
   */
  renderNotesView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:note"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Family Notes</h1>
      </div>
      <div class="route-placeholder">
        <h3>📝 Shared Family Notes & Lists</h3>
        <p>Keep important family information organized and accessible to everyone. This space will include:</p>
        <ul>
          <li>Shopping lists and meal planning notes</li>
          <li>Important reminders and announcements</li>
          <li>Memory keeping and family stories</li>
          <li>Collaborative planning documents</li>
          <li>Emergency contacts and information</li>
        </ul>
        <p><strong>Features in development:</strong> Real-time collaboration, category organization, and search functionality.</p>
      </div>
    `;
  }

  /**
   * Render Profile view
   */
  renderProfileView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:person"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Profile</h1>
      </div>
      <div class="route-placeholder">
        <h3>👨‍👩‍👧‍👦 Family Profile Management</h3>
        <p>Manage your family member profiles and account settings. This section will allow you to:</p>
        <ul>
          <li>Update profile information and photos</li>
          <li>Set notification preferences</li>
          <li>Manage family member access and roles</li>
          <li>Configure privacy and sharing settings</li>
          <li>View account activity and security options</li>
        </ul>
        <p><strong>Current Status:</strong> Basic profile data is managed through your authentication provider. Enhanced profile management is planned.</p>
      </div>
    `;
  }

  /**
   * Render Insights view
   */
  renderInsightsView() {
    return html`
      <div class="page-header">
        <iconify-icon icon="material-symbols:insights"></iconify-icon>
        <h1 id="main-content" tabindex="-1">Family Insights</h1>
      </div>
      <div class="route-placeholder">
        <h3>📊 Family Activity & Progress Insights</h3>
        <p>Discover meaningful patterns in your family's shared journey. This dashboard will provide:</p>
        <ul>
          <li>Goal progress tracking and celebration milestones</li>
          <li>Activity trends and engagement patterns</li>
          <li>Gratitude and kindness statistics</li>
          <li>Communication frequency and quality metrics</li>
          <li>Personal growth indicators for each family member</li>
        </ul>
        <p><strong>Data Privacy:</strong> All insights respect your family's privacy and are never shared outside your family circle.</p>
        <p><strong>Next Steps:</strong> Analytics engine development and visualization design are in progress.</p>
      </div>
    `;
  }

  /**
   * Render birthday modal
   */
  renderBirthdayModal() {
    const fields = [
      {
        name: 'full_name',
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'Enter full name'
      },
      {
        name: 'dob',
        label: 'Date of Birth',
        type: 'date',
        required: true
      },
      {
        name: 'avatar_url',
        label: 'Avatar URL',
        type: 'url',
        placeholder: 'Optional profile picture URL'
      }
    ];

    return renderFormModal({
      title: this.birthdayFormData.id ? 'Edit Birthday' : 'Add Birthday',
      fields,
      data: this.birthdayFormData,
      onSubmit: (data) => this.handleBirthdaySubmit(data),
      onCancel: () => this.closeAllModals(),
      loading: this.loading
    });
  }

  /**
   * Render event modal
   */
  renderEventModal() {
    const fields = [
      {
        name: 'title',
        label: 'Event Title',
        type: 'text',
        required: true,
        placeholder: 'Enter event title'
      },
      {
        name: 'starts_at',
        label: 'Start Date & Time',
        type: 'datetime-local',
        required: true
      },
      {
        name: 'location',
        label: 'Location',
        type: 'text',
        placeholder: 'Optional location'
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Optional description'
      }
    ];

    return renderFormModal({
      title: this.eventFormData.id ? 'Edit Event' : 'Add Event',
      fields,
      data: this.eventFormData,
      onSubmit: (data) => this.handleEventSubmit(data),
      onCancel: () => this.closeAllModals(),
      loading: this.loading
    });
  }

  /**
   * Render act modal
   */
  renderActModal() {
    const fields = [
      {
        name: 'description',
        label: 'What did you do?',
        type: 'text',
        required: true,
        placeholder: 'Describe your act of kindness or achievement'
      },
      {
        name: 'points',
        label: 'Points',
        type: 'number',
        required: true,
        min: 1,
        max: 10,
        defaultValue: '1'
      },
      {
        name: 'kind',
        label: 'Category',
        type: 'select',
        required: true,
        options: [
          { value: 'kindness', label: 'Act of Kindness' },
          { value: 'help', label: 'Helping Others' },
          { value: 'chore', label: 'Completed Chore' },
          { value: 'learning', label: 'Learning Together' },
          { value: 'creativity', label: 'Creative Activity' },
          { value: 'exercise', label: 'Physical Activity' },
          { value: 'other', label: 'Other' }
        ]
      }
    ];

    return renderFormModal({
      title: this.actFormData.id ? 'Edit Act' : 'Log Act',
      fields,
      data: this.actFormData,
      onSubmit: (data) => this.handleActSubmit(data),
      onCancel: () => this.closeAllModals(),
      loading: this.loading
    });
  }

  /**
   * Handle birthday form submission
   */
  async handleBirthdaySubmit(data) {
    this.loading = true;
    
    try {
      const isEdit = !!this.birthdayFormData.id;
      
      if (isEdit) {
        await dataOps.update(
          () => supabase.from('profiles').update(data).eq('id', this.birthdayFormData.id),
          this,
          'birthdays',
          this.birthdayFormData.id,
          data,
          {
            successMessage: 'Birthday updated successfully',
            errorMessage: 'Failed to update birthday'
          }
        );
      } else {
        // For new birthdays, we need to create or update the profile
        const profileData = {
          ...data,
          family_id: this.userProfile.family_id
        };
        
        await dataOps.create(
          () => supabase.from('profiles').insert([profileData]),
          this,
          'birthdays',
          profileData,
          {
            successMessage: 'Birthday added successfully',
            errorMessage: 'Failed to add birthday'
          }
        );
      }
      
      this.closeAllModals();
      this.loadBirthdays(); // Reload birthdays
    } catch (error) {
      // Error handled by dataOps
    } finally {
      this.loading = false;
    }
  }

  /**
   * Handle act form submission
   */
  async handleActSubmit(data) {
    this.loading = true;
    
    try {
      const isEdit = !!this.actFormData.id;
      
      if (isEdit) {
        await dataOps.update(
          () => supabase.from('acts').update(data).eq('id', this.actFormData.id),
          this,
          'acts',
          this.actFormData.id,
          data,
          {
            successMessage: 'Act updated successfully',
            errorMessage: 'Failed to update act'
          }
        );
      } else {
        const actData = {
          ...data,
          family_id: this.userProfile.family_id,
          user_id: this.userProfile.id
        };
        
        await dataOps.create(
          () => supabase.from('acts').insert([actData]),
          this,
          'acts',
          actData,
          {
            successMessage: 'Act logged successfully',
            errorMessage: 'Failed to log act'
          }
        );
      }
      
      this.closeAllModals();
      this.loadCurrentGoal(); // Reload goal after act changes
    } catch (error) {
      // Error handled by dataOps
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="layout ${this.navExpanded ? 'nav-expanded' : ''}">
        <!-- Navigation -->
        <nav class="nav" role="navigation" aria-label="Main navigation">
          ${!this.isMobile ? html`
            <div class="nav-header">
              <button class="nav-toggle" @click=${this.toggleNav} aria-label="Toggle navigation">
                <iconify-icon icon="material-symbols:menu"></iconify-icon>
              </button>
              <div class="nav-logo ${this.navExpanded ? 'expanded' : 'collapsed'}">🏠 FamilyNest</div>
            </div>
          ` : ''}
          
          <ul class="nav-menu">
            <li class="nav-item">
              <a href="#nest" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'nest')}
                 @keydown=${(e) => this.handleNavKeyDown(e, 'nest')}
                 aria-current=${this.currentRoute === 'nest' ? 'page' : null}
                 tabindex="0">
                <iconify-icon icon="material-symbols:home" aria-hidden="true"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Nest</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#feed" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'feed')}
                 @keydown=${(e) => this.handleNavKeyDown(e, 'feed')}
                 aria-current=${this.currentRoute === 'feed' ? 'page' : null}
                 tabindex="0">
                <iconify-icon icon="material-symbols:dynamic-feed" aria-hidden="true"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Feed</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#chores" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'chores')}
                 @keydown=${(e) => this.handleNavKeyDown(e, 'chores')}
                 aria-current=${this.currentRoute === 'chores' ? 'page' : null}
                 tabindex="0">
                <iconify-icon icon="material-symbols:checklist" aria-hidden="true"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Chores</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#events" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'events')}
                 @keydown=${(e) => this.handleNavKeyDown(e, 'events')}
                 aria-current=${this.currentRoute === 'events' ? 'page' : null}
                 tabindex="0">
                <iconify-icon icon="material-symbols:event" aria-hidden="true"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Events</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#notes" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'notes')}
                 @keydown=${(e) => this.handleNavKeyDown(e, 'notes')}
                 aria-current=${this.currentRoute === 'notes' ? 'page' : null}
                 tabindex="0">
                <iconify-icon icon="material-symbols:note" aria-hidden="true"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Notes</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#profile" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'profile')}
                 @keydown=${(e) => this.handleNavKeyDown(e, 'profile')}
                 aria-current=${this.currentRoute === 'profile' ? 'page' : null}
                 tabindex="0">
                <iconify-icon icon="material-symbols:person" aria-hidden="true"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Profile</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#insights" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'insights')}
                 @keydown=${(e) => this.handleNavKeyDown(e, 'insights')}
                 aria-current=${this.currentRoute === 'insights' ? 'page' : null}
                 tabindex="0">
                <iconify-icon icon="material-symbols:insights" aria-hidden="true"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Insights</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link" @click=${this.handleSignOut}>
                <iconify-icon icon="material-symbols:logout"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Sign Out</span>
              </a>
            </li>
          </ul>
        </nav>

        <!-- Main Content -->
        <main class="main" role="main">
          ${this.renderRouteContent()}
        </main>

        <!-- Sidebar (Desktop only) -->
        ${!this.showInlineCards ? html`
          <aside class="sidebar sticky-col" role="complementary" aria-label="Family updates">
            <h2 class="sidebar-title">Family Updates</h2>
            <div class="sidebar-cards">
              ${this.renderCards(true)}
            </div>
          </aside>
        ` : ''}

        <!-- Mobile Floating Add Button -->
        ${this.isMobile ? html`
          <button class="floating-add" aria-label="Quick add">
            <iconify-icon icon="material-symbols:add"></iconify-icon>
          </button>
        ` : ''}
      </div>

      <!-- Celebration Animation -->
      <div class="celebration" style="display: none;">
        🎉✨🎊
      </div>

      <!-- Aria-live region for screen readers -->
      <div aria-live="polite" aria-atomic="true" class="sr-only"></div>

      <!-- Modals -->
      ${this.showConfirmModal && this.confirmModalData ? renderConfirmModal({
        title: this.confirmModalData.title,
        message: this.confirmModalData.message,
        onConfirm: this.confirmModalData.onConfirm,
        onCancel: this.confirmModalData.onCancel,
        destructive: true
      }) : ''}

      ${this.showBirthdayModal ? this.renderBirthdayModal() : ''}
      ${this.showEventModal ? this.renderEventModal() : ''}
      ${this.showActModal ? this.renderActModal() : ''}
    `;
  }
}

customElements.define('fn-home', FnHome);