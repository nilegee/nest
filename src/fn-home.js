/**
 * Home/Nest component
 * Main authenticated view with responsive layout and family content
 */

import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { supabase } from '../web/supabaseClient.js';
import { getStandardCards } from './cards/nest-cards.js';

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
    loading: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
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
    
    .route-placeholder p {
      margin: 0;
      color: var(--text-light);
      font-size: 1.125rem;
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
    
    // Listen for window resize
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 767;
      this.showInlineCards = window.innerWidth <= 1023;
    });
    
    // Listen for hash changes for routing
    window.addEventListener('hashchange', () => {
      this.currentRoute = this.getRouteFromHash() || 'nest';
    });
    
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
   * Handle event form submission
   */
  async handleEventSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const title = e.target.querySelector('#event-title').value;
    const dateTime = e.target.querySelector('#event-date').value;
    const location = e.target.querySelector('#event-location').value;
    
    if (!title.trim() || !dateTime) return;
    
    this.loading = true;
    const success = await this.createEvent(title, dateTime, location || null);
    this.loading = false;
    
    if (success) {
      // Clear form
      e.target.reset();
    } else {
      console.error('Failed to create event');
    }
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
    if (!this.userProfile?.family_id) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(full_name)
        `)
        .eq('family_id', this.userProfile.family_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error loading posts:', error);
        return;
      }
      
      this.posts = data || [];
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  }

  /**
   * Load events for user's family
   */
  async loadEvents() {
    if (!this.userProfile?.family_id) return;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          owner:profiles!events_owner_id_fkey(full_name)
        `)
        .eq('family_id', this.userProfile.family_id)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);
      
      if (error) {
        console.error('Error loading events:', error);
        return;
      }
      
      this.events = data || [];
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  /**
   * Load birthdays from profiles for user's family
   */
  async loadBirthdays() {
    if (!this.userProfile?.family_id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, dob')
        .eq('family_id', this.userProfile.family_id)
        .not('dob', 'is', null);
      
      if (error) {
        console.error('Error loading birthdays:', error);
        return;
      }
      
      // Process birthdays into the format expected by the birthday card
      this.birthdays = this.processBirthdaysForCard(data || []);
    } catch (error) {
      console.error('Failed to load birthdays:', error);
    }
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
   * Load acts for user's family
   */
  async loadActs() {
    if (!this.userProfile?.family_id) return;
    
    try {
      const { data, error } = await supabase
        .from('acts')
        .select(`
          *,
          user:profiles!acts_user_id_fkey(full_name)
        `)
        .eq('family_id', this.userProfile.family_id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error loading acts:', error);
        return;
      }
      
      this.acts = data || [];
    } catch (error) {
      console.error('Failed to load acts:', error);
    }
  }

  /**
   * Load current family goal (for now, create a simple goal based on acts)
   */
  async loadCurrentGoal() {
    if (!this.acts || this.acts.length === 0) return;
    
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
  }

  /**
   * Handle navigation click
   */
  handleNavClick(e, route) {
    e.preventDefault();
    this.navigateToRoute(route);
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
        <h1>Family Feed</h1>
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
        ${this.posts.length > 0 ? html`
          ${this.posts.map(post => html`
            <article class="post-card">
              <div class="post-header">
                <span class="post-author">${post.author?.full_name || 'Family Member'}</span>
                <time class="post-date">${this.formatPostDate(post.created_at)}</time>
              </div>
              <div class="post-body">${post.body}</div>
            </article>
          `)}
        ` : html`
          <div class="feed-placeholder">
            <iconify-icon icon="material-symbols:dynamic-feed"></iconify-icon>
            <h3>No posts yet</h3>
            <p>Be the first to share something with your family!</p>
          </div>
        `}
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
        <h1>Family Chores</h1>
      </div>
      <div class="route-placeholder">
        <p>Chores management coming soon...</p>
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
        <h1>Family Events</h1>
      </div>
      
      <!-- Event Creation Form -->
      <div class="creation-form">
        <h3>Add New Event</h3>
        <form @submit=${this.handleEventSubmit}>
          <div class="form-row">
            <input type="text" id="event-title" placeholder="Event title" required>
            <input type="datetime-local" id="event-date" required>
          </div>
          <div class="form-row">
            <input type="text" id="event-location" placeholder="Location (optional)">
            <button type="submit" class="btn btn-primary" ?disabled=${this.loading}>
              ${this.loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>

      <!-- Events List -->
      <div class="events-list">
        ${this.events.length > 0 ? html`
          ${this.events.map(event => html`
            <div class="event-card">
              <div class="event-header">
                <h4 class="event-title">${event.title}</h4>
                <div class="event-meta">
                  <iconify-icon icon="material-symbols:person"></iconify-icon>
                  <span>${event.owner?.full_name || 'Family Member'}</span>
                </div>
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
        ` : html`
          <div class="empty-state">
            <iconify-icon icon="material-symbols:event"></iconify-icon>
            <h3>No upcoming events</h3>
            <p>Create the first event for your family!</p>
          </div>
        `}
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
        <h1>Family Notes</h1>
      </div>
      <div class="route-placeholder">
        <p>Notes functionality coming soon...</p>
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
        <h1>Profile</h1>
      </div>
      <div class="route-placeholder">
        <p>Profile management coming soon...</p>
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
        <h1>Family Insights</h1>
      </div>
      <div class="route-placeholder">
        <p>Insights and analytics coming soon...</p>
      </div>
    `;
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
                 aria-current=${this.currentRoute === 'nest' ? 'page' : null}>
                <iconify-icon icon="material-symbols:home"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Nest</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#feed" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'feed')}
                 aria-current=${this.currentRoute === 'feed' ? 'page' : null}>
                <iconify-icon icon="material-symbols:dynamic-feed"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Feed</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#chores" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'chores')}
                 aria-current=${this.currentRoute === 'chores' ? 'page' : null}>
                <iconify-icon icon="material-symbols:checklist"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Chores</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#events" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'events')}
                 aria-current=${this.currentRoute === 'events' ? 'page' : null}>
                <iconify-icon icon="material-symbols:event"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Events</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#notes" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'notes')}
                 aria-current=${this.currentRoute === 'notes' ? 'page' : null}>
                <iconify-icon icon="material-symbols:note"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Notes</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#profile" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'profile')}
                 aria-current=${this.currentRoute === 'profile' ? 'page' : null}>
                <iconify-icon icon="material-symbols:person"></iconify-icon>
                <span class="nav-text ${this.navExpanded ? 'expanded' : 'collapsed'}">Profile</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#insights" class="nav-link" 
                 @click=${(e) => this.handleNavClick(e, 'insights')}
                 aria-current=${this.currentRoute === 'insights' ? 'page' : null}>
                <iconify-icon icon="material-symbols:insights"></iconify-icon>
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
    `;
  }
}

customElements.define('fn-home', FnHome);