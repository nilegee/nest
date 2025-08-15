/**
 * Context Store - Derived state management for FamilyNest
 * Maintains cached state and provides selectors for common queries
 */

import { on, emit } from './event-bus.js';
import { supabase } from '../../web/supabaseClient.js';
import { getFamilyId } from './session-store.js';

class ContextStore {
  constructor() {
    this.state = {
      events: [],
      goals: [],
      posts: [],
      notes: [],
      appreciations: [],
      lastUpdated: {}
    };
    
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for state updates
   */
  initializeEventListeners() {
    // Listen for domain events and update relevant state
    on('ACT_LOGGED', (event) => {
      const { act } = event.detail;
      this.handleActLogged(act);
    });

    on('POST_CREATED', () => {
      this.invalidateAndRefresh('posts');
    });

    on('EVENT_SCHEDULED', () => {
      this.invalidateAndRefresh('events');
    });

    on('GOAL_PROGRESS', () => {
      this.invalidateAndRefresh('goals');
    });

    on('NOTE_ADDED', () => {
      this.invalidateAndRefresh('notes');
    });

    on('APPRECIATION_GIVEN', () => {
      this.invalidateAndRefresh('appreciations');
    });
  }

  /**
   * Handle activity logged events
   */
  handleActLogged(act) {
    // Selectively refresh based on activity type
    if (act.type.includes('post')) {
      this.invalidateAndRefresh('posts');
    } else if (act.type.includes('event')) {
      this.invalidateAndRefresh('events');
    } else if (act.type.includes('goal')) {
      this.invalidateAndRefresh('goals');
    } else if (act.type.includes('note')) {
      this.invalidateAndRefresh('notes');
    }
  }

  /**
   * Invalidate and refresh specific state slice
   */
  async invalidateAndRefresh(slice) {
    this.state.lastUpdated[slice] = Date.now();
    
    // Minimal delta refresh - only fetch recent changes
    try {
      await this.refreshSlice(slice);
      emit('context:updated', { slice });
    } catch (error) {
      console.warn(`Failed to refresh ${slice}:`, error);
    }
  }

  /**
   * Refresh a specific state slice
   */
  async refreshSlice(slice) {
    const familyId = getFamilyId();
    if (!familyId) return;

    const lastUpdate = this.state.lastUpdated[slice] || 0;
    const since = new Date(Math.max(lastUpdate - 60000, Date.now() - 86400000)); // 1 hour buffer, max 24h

    switch (slice) {
      case 'events':
        await this.refreshEvents(since);
        break;
      case 'goals':
        await this.refreshGoals(since);
        break;
      case 'posts':
        await this.refreshPosts(since);
        break;
      case 'notes':
        await this.refreshNotes(since);
        break;
    }
  }

  async refreshEvents(since) {
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('updated_at', since.toISOString())
      .order('event_date', { ascending: true });
    
    if (data) {
      // Merge with existing state
      this.mergeState('events', data, 'id');
    }
  }

  async refreshGoals(since) {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .gte('updated_at', since.toISOString())
      .order('created_at', { ascending: false });
    
    if (data) {
      this.mergeState('goals', data, 'id');
    }
  }

  async refreshPosts(since) {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles!inner(display_name, avatar_url)')
      .gte('updated_at', since.toISOString())
      .order('created_at', { ascending: false });
    
    if (data) {
      this.mergeState('posts', data, 'id');
    }
  }

  async refreshNotes(since) {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .gte('updated_at', since.toISOString())
      .order('created_at', { ascending: false });
    
    if (data) {
      this.mergeState('notes', data, 'id');
    }
  }

  /**
   * Merge new data with existing state
   */
  mergeState(slice, newData, keyField) {
    const existing = this.state[slice] || [];
    const existingMap = new Map(existing.map(item => [item[keyField], item]));
    
    // Update or add new items
    newData.forEach(item => {
      existingMap.set(item[keyField], item);
    });
    
    this.state[slice] = Array.from(existingMap.values());
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set state (partial update)
   */
  set(partial) {
    this.state = { ...this.state, ...partial };
    emit('context:updated', { partial });
  }

  // Selectors

  /**
   * Get upcoming events (next 30 days)
   */
  selectUpcomingEvents() {
    const now = new Date();
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return this.state.events
      .filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate >= now && eventDate <= monthFromNow;
      })
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  }

  /**
   * Get goals that haven't been updated recently (stale)
   */
  selectStaleGoals() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return this.state.goals
      .filter(goal => 
        goal.status !== 'completed' && 
        new Date(goal.updated_at) < sevenDaysAgo
      )
      .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
  }

  /**
   * Get family members who have received least appreciation recently
   */
  selectLeastAppreciated() {
    // This would need member data and appreciation counts
    // For now, return empty array - can be implemented when appreciation system is ready
    return [];
  }
}

// Create and export singleton instance
export const contextStore = new ContextStore();

// Convenience exports
export const getState = () => contextStore.getState();
export const setState = (partial) => contextStore.set(partial);
export const selectUpcomingEvents = () => contextStore.selectUpcomingEvents();
export const selectStaleGoals = () => contextStore.selectStaleGoals();
export const selectLeastAppreciated = () => contextStore.selectLeastAppreciated();