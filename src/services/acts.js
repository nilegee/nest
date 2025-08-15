// @ts-check
/**
 * Automatic Activity Logging Service
 * Listens to domain events and logs user activities
 */

import { on } from './event-bus.js';
import { supabase } from '../../web/supabaseClient.js';

class ActivityLogger {
  constructor() {
    this.initialized = false;
    this.activityBuffer = [];
    this.flushInterval = null;
  }

  /**
   * Initialize activity logging
   */
  init() {
    if (this.initialized) return;

    // Listen to all significant domain events
    const eventHandlers = [
      ['POST_CREATED', this.logPostActivity.bind(this)],
      ['EVENT_SCHEDULED', this.logEventActivity.bind(this)],
      ['GOAL_PROGRESS', this.logGoalActivity.bind(this)],
      ['NOTE_ADDED', this.logNoteActivity.bind(this)],
      ['CHORE_COMPLETED', this.logChoreActivity.bind(this)],
      ['APPRECIATION_SENT', this.logAppreciationActivity.bind(this)],
      ['USER_LOGIN', this.logLoginActivity.bind(this)],
      ['USER_LOGOUT', this.logLogoutActivity.bind(this)]
    ];

    eventHandlers.forEach(([eventType, handler]) => {
      on(eventType, handler);
    });

    // Start buffer flushing
    this.startBufferFlush();
    this.initialized = true;
  }

  /**
   * Log post creation activity
   */
  async logPostActivity(event) {
    this.bufferActivity({
      user_id: event.userId,
      family_id: event.familyId,
      activity_type: 'post_created',
      description: `Posted: "${this.truncateText(event.post?.body || event.content)}"`,
      metadata: {
        post_id: event.post?.id || event.postId,
        visibility: event.post?.visibility || 'family'
      }
    });
  }

  /**
   * Log event scheduling activity
   */
  async logEventActivity(event) {
    this.bufferActivity({
      user_id: event.userId,
      family_id: event.familyId,
      activity_type: 'event_scheduled',
      description: `Scheduled event: "${event.event?.title || 'Untitled'}"`,
      metadata: {
        event_id: event.event?.id || event.eventId,
        starts_at: event.event?.starts_at
      }
    });
  }

  /**
   * Log goal progress activity
   */
  async logGoalActivity(event) {
    this.bufferActivity({
      user_id: event.userId,
      family_id: event.familyId,
      activity_type: 'goal_progress',
      description: `Updated goal progress: ${event.progress}%`,
      metadata: {
        goal_id: event.goal?.id || event.goalId,
        progress: event.progress,
        goal_title: event.goal?.title
      }
    });
  }

  /**
   * Log note creation activity
   */
  async logNoteActivity(event) {
    this.bufferActivity({
      user_id: event.userId,
      family_id: event.familyId,
      activity_type: 'note_added',
      description: `Added note: "${this.truncateText(event.note?.content || event.content)}"`,
      metadata: {
        note_id: event.note?.id || event.noteId,
        note_type: event.note?.type || 'personal'
      }
    });
  }

  /**
   * Log chore completion activity
   */
  async logChoreActivity(event) {
    this.bufferActivity({
      user_id: event.userId,
      family_id: event.familyId,
      activity_type: 'chore_completed',
      description: `Completed chore: "${event.chore?.title || 'Untitled'}"`,
      metadata: {
        chore_id: event.chore?.id || event.choreId,
        completed_at: event.completedAt || new Date().toISOString()
      }
    });
  }

  /**
   * Log appreciation activity
   */
  async logAppreciationActivity(event) {
    this.bufferActivity({
      user_id: event.userId,
      family_id: event.familyId,
      activity_type: 'appreciation_sent',
      description: `Sent appreciation to ${event.recipientName || 'family member'}`,
      metadata: {
        appreciation_id: event.appreciation?.id || event.appreciationId,
        recipient_id: event.recipientId,
        message: this.truncateText(event.message)
      }
    });
  }

  /**
   * Log login activity
   */
  async logLoginActivity(event) {
    this.bufferActivity({
      user_id: event.userId,
      family_id: event.familyId,
      activity_type: 'user_login',
      description: 'Logged in to FamilyNest',
      metadata: {
        login_method: event.method || 'unknown',
        timestamp: event.timestamp
      }
    });
  }

  /**
   * Log logout activity
   */
  async logLogoutActivity(event) {
    this.bufferActivity({
      user_id: event.userId,
      family_id: event.familyId,
      activity_type: 'user_logout',
      description: 'Logged out of FamilyNest',
      metadata: {
        session_duration: event.sessionDuration,
        timestamp: event.timestamp
      }
    });
  }

  /**
   * Buffer activity for batch insertion
   */
  bufferActivity(activity) {
    this.activityBuffer.push({
      ...activity,
      created_at: new Date().toISOString()
    });

    // Flush immediately if buffer is getting large
    if (this.activityBuffer.length >= 10) {
      this.flushBuffer();
    }
  }

  /**
   * Start periodic buffer flushing
   */
  startBufferFlush() {
    if (this.flushInterval) return;
    
    // Flush buffer every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, 30000);
  }

  /**
   * Flush activity buffer to database
   */
  async flushBuffer() {
    if (this.activityBuffer.length === 0) return;

    const activities = [...this.activityBuffer];
    this.activityBuffer = [];

    try {
      await supabase.from('activity_log').insert(activities);
    } catch (error) {
      console.warn('Failed to log activities:', error);
      // Don't re-buffer on failure to avoid infinite loops
    }
  }

  /**
   * Truncate text for activity descriptions
   */
  truncateText(text, maxLength = 50) {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }

  /**
   * Stop activity logging and flush remaining buffer
   */
  async stop() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    await this.flushBuffer();
    this.initialized = false;
  }

  /**
   * Get activity statistics (for debugging)
   */
  getStats() {
    return {
      initialized: this.initialized,
      bufferSize: this.activityBuffer.length,
      hasFlushInterval: !!this.flushInterval
    };
  }
}

// Global activity logger instance
export const activityLogger = new ActivityLogger();

// Auto-initialize when imported
activityLogger.init();