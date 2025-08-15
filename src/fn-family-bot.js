/**
 * FamilyBot - Autonomous family engagement system
 * Event-driven bot with intelligent nudging and rate limiting
 */

import { supabase } from '../web/supabaseClient.js';
import { showSuccess, showError } from './toast-helper.js';
import { withFamily } from './services/db.js';
import { on, emit } from './services/event-bus.js';
import { checkRateLimit } from './services/rate-limit.js';

// Message content for different themes and packs
const MESSAGE_TEMPLATES = {
  // Core nudge types
  birthday_pre: {
    standard: {
      en: "🎂 {{name}}'s birthday is in 30 days! Time to update their wishlist?",
      ar: "🎂 عيد ميلاد {{name}} بعد 30 يوم! وقت تحديث قائمة الأماني؟",
      mix: "🎂 {{name}}'s birthday في 30 days! Time to update wishlist؟"
    },
    arabic_values: {
      en: "🎂 {{name}}'s special day approaches in 30 days. Shall we prepare something meaningful?",
      ar: "🎂 يوم {{name}} المميز يقترب خلال 30 يوم. هل نحضر شيء له معنى؟"
    }
  },
  gratitude_post: {
    standard: {
      en: "✨ What made you smile about {{name}} today?",
      ar: "✨ ما الذي جعلك تبتسم بسبب {{name}} اليوم؟",
      mix: "✨ What made you smile about {{name}} today؟"
    }
  },
  chores_streak: {
    standard: {
      en: "🔥 Amazing! {{days}} days in a row! Ready to share your success?",
      ar: "🔥 رائع! {{days}} أيام متتالية! جاهز لمشاركة نجاحك؟"
    }
  },
  kindness_prompt: {
    standard: {
      en: "💫 Small kindness idea: Leave a note for someone special",
      ar: "💫 فكرة لطف صغيرة: اترك رسالة لشخص مميز"
    }
  },
  right_hand_nudge: {
    arabic_values: {
      en: "🤲 Gentle reminder: Try eating with your right hand today",
      ar: "🤲 تذكير لطيف: جرب الأكل باليد اليمنى اليوم"
    }
  },
  gaming_break: {
    standard: {
      en: "🎮 Time for a quick stretch! Your eyes will thank you",
      ar: "🎮 وقت لتمدد سريع! عيونك ستشكرك"
    }
  }
};

// Theme-specific styling tokens  
const THEME_CONTEXTS = {
  'classic': { accent: 'gentle', tone: 'warm' },
  'roblox-lite': { accent: 'blocky', tone: 'friendly' },
  'minecraft-lite': { accent: 'pixelated', tone: 'adventurous' },
  'pubg-lite': { accent: 'tactical', tone: 'focused' },
  'sims-lite': { accent: 'social', tone: 'chatty' }
};

class FamilyBotAPI {
  constructor() {
    this.preferencesCache = new Map();
    this.schedulerInterval = null;
    this.nudgeThrottleMap = new Map(); // For intelligent throttling
    this.eventListeners = new Map();
    this.initialized = false;
  }

  /**
   * Initialize autonomous FamilyBot with event listeners
   */
  init() {
    if (this.initialized) return;

    // Set up event listeners for autonomous operation
    this.setupEventListeners();
    this.startNudgeScheduler();
    this.initialized = true;
  }

  /**
   * Setup event listeners for autonomous responses
   */
  setupEventListeners() {
    // Post-related events
    const postCreatedHandler = on('POST_CREATED', (event) => {
      this.handlePostCreated(event);
    });
    this.eventListeners.set('POST_CREATED', postCreatedHandler);

    // Goal-related events
    const goalProgressHandler = on('GOAL_PROGRESS', (event) => {
      this.handleGoalProgress(event);
    });
    this.eventListeners.set('GOAL_PROGRESS', goalProgressHandler);

    // Event-related events
    const eventScheduledHandler = on('EVENT_SCHEDULED', (event) => {
      this.handleEventScheduled(event);
    });
    this.eventListeners.set('EVENT_SCHEDULED', eventScheduledHandler);

    // Activity-related events
    const appreciationHandler = on('APPRECIATION_SENT', (event) => {
      this.handleAppreciationSent(event);
    });
    this.eventListeners.set('APPRECIATION_SENT', appreciationHandler);

    // User engagement events
    const loginHandler = on('USER_LOGIN', (event) => {
      this.handleUserLogin(event);
    });
    this.eventListeners.set('USER_LOGIN', loginHandler);
  }

  /**
   * Handle post creation - respond with appreciation or engagement
   */
  async handlePostCreated(event) {
    const { userId, familyId, post } = event;
    
    // Check throttling - max 1 response per user per day for posts
    if (!this.shouldRespondToEvent(userId, 'post_response')) {
      return;
    }

    // Rate limiting check
    if (!checkRateLimit('familybot', 'nudge_create')) {
      return;
    }

    // Schedule appreciation prompt for other family members
    try {
      const { data: familyMembers } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('family_id', familyId)
        .neq('user_id', userId);

      for (const member of familyMembers || []) {
        const prefs = await this.getMemberPrefs(member.user_id);
        
        if (this.isInQuietHours(prefs)) continue;

        // Schedule appreciation prompt in 2-4 hours
        const scheduleTime = new Date(Date.now() + (2 + Math.random() * 2) * 60 * 60 * 1000);
        
        await this.scheduleNudge(
          member.user_id,
          'appreciation_prompt',
          scheduleTime,
          { 
            authorName: await this.getUserName(userId),
            postPreview: post.body?.slice(0, 50) + '...'
          }
        );
      }

      this.recordEventResponse(userId, 'post_response');
    } catch (error) {
      console.warn('FamilyBot post response failed:', error);
    }
  }

  /**
   * Handle goal progress - celebrate milestones
   */
  async handleGoalProgress(event) {
    const { userId, familyId, goal, progress } = event;
    
    // Celebrate significant milestones
    const milestones = [25, 50, 75, 100];
    const milestone = milestones.find(m => 
      progress >= m && (goal.previous_progress || 0) < m
    );

    if (!milestone) return;

    if (!this.shouldRespondToEvent(userId, 'milestone_celebration')) {
      return;
    }

    if (!checkRateLimit('familybot', 'nudge_create')) {
      return;
    }

    try {
      const prefs = await this.getMemberPrefs(userId);
      
      if (this.isInQuietHours(prefs)) {
        // Schedule for later if in quiet hours
        const wakeTime = this.getWakeTime(prefs);
        await this.scheduleNudge(
          userId,
          'milestone_celebration',
          wakeTime,
          { goalTitle: goal.title, progress: milestone }
        );
      } else {
        // Send immediately
        await this.sendMilestoneCelebration(userId, goal, milestone);
      }

      this.recordEventResponse(userId, 'milestone_celebration');
    } catch (error) {
      console.warn('FamilyBot milestone celebration failed:', error);
    }
  }

  /**
   * Handle event scheduled - set reminders
   */
  async handleEventScheduled(event) {
    const { userId, familyId, event: scheduledEvent } = event;
    
    if (!scheduledEvent?.starts_at) return;

    try {
      const eventDate = new Date(scheduledEvent.starts_at);
      const now = new Date();
      
      // Schedule reminder 24 hours before event
      const reminderTime = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
      
      if (reminderTime > now) {
        // Get all family members for reminder
        const { data: familyMembers } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('family_id', familyId);

        for (const member of familyMembers || []) {
          await this.scheduleNudge(
            member.user_id,
            'event_reminder',
            reminderTime,
            { 
              eventTitle: scheduledEvent.title,
              eventTime: this.formatEventTime(eventDate),
              location: scheduledEvent.location
            }
          );
        }
      }
    } catch (error) {
      console.warn('FamilyBot event reminder scheduling failed:', error);
    }
  }

  /**
   * Handle appreciation sent - encourage more gratitude
   */
  async handleAppreciationSent(event) {
    const { userId, familyId } = event;
    
    // Randomly encourage more gratitude (20% chance)
    if (Math.random() > 0.2) return;

    if (!this.shouldRespondToEvent(userId, 'gratitude_encouragement')) {
      return;
    }

    try {
      const prefs = await this.getMemberPrefs(userId);
      
      // Schedule gratitude encouragement in 1-3 days
      const scheduleTime = new Date(Date.now() + (1 + Math.random() * 2) * 24 * 60 * 60 * 1000);
      
      await this.scheduleNudge(
        userId,
        'gratitude_chain',
        scheduleTime,
        { streak: await this.getGratitudeStreak(userId) }
      );

      this.recordEventResponse(userId, 'gratitude_encouragement');
    } catch (error) {
      console.warn('FamilyBot gratitude encouragement failed:', error);
    }
  }

  /**
   * Handle user login - welcome back or daily check-in
   */
  async handleUserLogin(event) {
    const { userId, familyId } = event;
    
    // Check if this is the first login today
    const lastLogin = await this.getLastLoginDate(userId);
    const today = new Date().toDateString();
    
    if (lastLogin === today) return; // Already welcomed today

    if (!this.shouldRespondToEvent(userId, 'daily_checkin')) {
      return;
    }

    try {
      const prefs = await this.getMemberPrefs(userId);
      
      // Schedule daily check-in in 5-15 minutes
      const scheduleTime = new Date(Date.now() + (5 + Math.random() * 10) * 60 * 1000);
      
      await this.scheduleNudge(
        userId,
        'daily_checkin',
        scheduleTime,
        { 
          userName: await this.getUserName(userId),
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
        }
      );

      this.recordEventResponse(userId, 'daily_checkin');
    } catch (error) {
      console.warn('FamilyBot daily check-in failed:', error);
    }
  }

  /**
   * Check if bot should respond to event (intelligent throttling)
   */
  shouldRespondToEvent(userId, eventType) {
    const key = `${userId}:${eventType}`;
    const now = Date.now();
    const lastResponse = this.nudgeThrottleMap.get(key) || 0;
    
    // Different throttling periods for different event types
    const throttlePeriods = {
      'post_response': 24 * 60 * 60 * 1000, // 24 hours
      'milestone_celebration': 12 * 60 * 60 * 1000, // 12 hours
      'gratitude_encouragement': 3 * 24 * 60 * 60 * 1000, // 3 days
      'daily_checkin': 24 * 60 * 60 * 1000, // 24 hours
      'default': 6 * 60 * 60 * 1000 // 6 hours
    };
    
    const throttlePeriod = throttlePeriods[eventType] || throttlePeriods.default;
    
    return (now - lastResponse) > throttlePeriod;
  }

  /**
   * Record that bot responded to an event
   */
  recordEventResponse(userId, eventType) {
    const key = `${userId}:${eventType}`;
    this.nudgeThrottleMap.set(key, Date.now());
  }

  /**
   * Check if user is in quiet hours
   */
  isInQuietHours(prefs) {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const quietStart = this.parseTime(prefs.quiet_hours_start || '22:00');
    const quietEnd = this.parseTime(prefs.quiet_hours_end || '08:00');
    
    if (quietStart > quietEnd) {
      // Quiet hours span midnight
      return currentTime >= quietStart || currentTime <= quietEnd;
    } else {
      return currentTime >= quietStart && currentTime <= quietEnd;
    }
  }

  /**
   * Get wake time based on quiet hours
   */
  getWakeTime(prefs) {
    const now = new Date();
    const quietEnd = this.parseTime(prefs.quiet_hours_end || '08:00');
    const wakeTime = new Date(now);
    
    wakeTime.setHours(Math.floor(quietEnd / 100));
    wakeTime.setMinutes(quietEnd % 100);
    wakeTime.setSeconds(0);
    
    // If wake time is in the past, schedule for tomorrow
    if (wakeTime <= now) {
      wakeTime.setDate(wakeTime.getDate() + 1);
    }
    
    return wakeTime;
  }

  /**
   * Parse time string to minutes
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  /**
   * Start autonomous nudge scheduler
   */
  startNudgeScheduler() {
    if (this.schedulerInterval) return;
    
    // Check for and send nudges every 5 minutes
    this.schedulerInterval = setInterval(() => {
      this.processScheduledNudges();
    }, 5 * 60 * 1000);
  }

  /**
   * Process scheduled nudges that are due
   */
  async processScheduledNudges() {
    try {
      const { data: dueNudges } = await supabase
        .from('nudges')
        .select('*')
        .eq('status', 'pending')
        .lt('scheduled_for', new Date().toISOString())
        .limit(10);

      for (const nudge of dueNudges || []) {
        await this.sendScheduledNudge(nudge);
      }
    } catch (error) {
      console.warn('FamilyBot nudge processing failed:', error);
    }
  }

  /**
   * Send a scheduled nudge
   */
  async sendScheduledNudge(nudge) {
    try {
      // Mark as processing
      await supabase
        .from('nudges')
        .update({ status: 'processing' })
        .eq('id', nudge.id);

      // Send the nudge
      await this.sendNudgeToUser(nudge.target_user_id, nudge.message, nudge.meta);

      // Mark as sent
      await supabase
        .from('nudges')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', nudge.id);

      // Emit event for tracking
      await emit('NUDGE_SENT', {
        userId: nudge.target_user_id,
        nudgeType: nudge.nudge_kind,
        nudgeId: nudge.id
      });
    } catch (error) {
      console.warn('Failed to send scheduled nudge:', error);
      
      // Mark as failed
      await supabase
        .from('nudges')
        .update({ status: 'failed' })
        .eq('id', nudge.id);
    }
  }

  /**
   * Helper methods for autonomous operation
   */
  async getUserName(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .single();
      return data?.full_name || 'Family member';
    } catch {
      return 'Family member';
    }
  }

  async getGratitudeStreak(userId) {
    try {
      const { data } = await supabase
        .from('appreciations')
        .select('created_at')
        .eq('from_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(7);
      
      // Count consecutive days
      let streak = 0;
      const today = new Date();
      
      for (const appreciation of data || []) {
        const appreciationDate = new Date(appreciation.created_at);
        const daysDiff = Math.floor((today - appreciationDate) / (24 * 60 * 60 * 1000));
        
        if (daysDiff === streak) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    } catch {
      return 0;
    }
  }

  async getLastLoginDate(userId) {
    try {
      const { data } = await supabase
        .from('activity_log')
        .select('created_at')
        .eq('user_id', userId)
        .eq('activity_type', 'user_login')
        .order('created_at', { ascending: false })
        .limit(1);
      
      return data?.[0]?.created_at ? new Date(data[0].created_at).toDateString() : null;
    } catch {
      return null;
    }
  }

  formatEventTime(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  /**
   * Send milestone celebration immediately
   */
  async sendMilestoneCelebration(userId, goal, milestone) {
    const message = milestone === 100 
      ? `🎉 Incredible! You completed "${goal.title}"! The whole family is proud of you!`
      : `⭐ Amazing progress! You're ${milestone}% done with "${goal.title}". Keep going!`;
    
    await this.sendNudgeToUser(userId, message, { goalId: goal.id, milestone });
  }

  /**
   * Send nudge to user (via toast or feed post)
   */
  async sendNudgeToUser(userId, message, meta = {}) {
    // For now, we'll emit an event that components can listen to
    await emit('FAMILYBOT_NUDGE', {
      userId,
      message,
      meta,
      timestamp: Date.now()
    });
  }

  /**
   * Cleanup autonomous systems
   */
  destroy() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    
    // Unsubscribe from events
    for (const unsubscribe of this.eventListeners.values()) {
      unsubscribe();
    }
    this.eventListeners.clear();
    
    this.initialized = false;
  }

  /**
   * Get member preferences with caching
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async getMemberPrefs(userId) {
    if (this.preferencesCache.has(userId)) {
      return this.preferencesCache.get(userId);
    }

    try {
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // Not found is OK, we'll use defaults
        throw error;
      }

      const prefs = data || {
        bot_name: 'FamilyBot',
        theme: 'classic',
        language: 'en',
        message_pack: 'standard',
        role_tag: null,
        interests: [],
        gaming_minutes_goal: 120,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        nudge_cap_per_day: 3,
        muted_categories: []
      };

      this.preferencesCache.set(userId, prefs);
      return prefs;
    } catch (error) {
      console.error('Failed to get member preferences:', error);
      return this.getDefaultPrefs();
    }
  }

  /**
   * Get default preferences
   */
  getDefaultPrefs() {
    return {
      bot_name: 'FamilyBot',
      theme: 'classic',
      language: 'en', 
      message_pack: 'standard',
      role_tag: null,
      interests: [],
      gaming_minutes_goal: 120,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      nudge_cap_per_day: 3,
      muted_categories: []
    };
  }

  /**
   * Schedule a nudge for a user
   * @param {string} userId 
   * @param {string} nudgeKind 
   * @param {Date} scheduledFor 
   * @param {Object} variables - Template variables
   * @returns {Promise<boolean>}
   */
  async scheduleNudge(userId, nudgeKind, scheduledFor, variables = {}) {
    try {
      const prefs = await this.getMemberPrefs(userId);
      
      // Check if category is muted
      const categoryMap = {
        'mom_weekly_highlight': 'mom_support',
        'mom_self_care': 'mom_support',
        'mom_weekend_connector': 'mom_support',
        'anti_bullying_checkin': 'anti_bullying',
        'right_hand_nudge': 'food_habits',
        'salad_prompt': 'food_habits',
        'gaming_break': 'gaming',
        'gaming_share_highlight': 'gaming',
        'gaming_plan_balance': 'gaming'
      };
      
      const category = categoryMap[nudgeKind];
      if (category && prefs.muted_categories.includes(category)) {
        return false; // Skip muted categories
      }

      // Check daily cap
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const { count } = await supabase
        .from('nudges')
        .select('*', { count: 'exact', head: true })
        .eq('target_user_id', userId)
        .gte('scheduled_for', startOfDay.toISOString())
        .lt('scheduled_for', endOfDay.toISOString());

      if (count >= prefs.nudge_cap_per_day) {
        return false; // Daily cap reached
      }

      // Check quiet hours
      if (this.isQuietTime(scheduledFor, prefs)) {
        // Reschedule to next available window
        scheduledFor = this.getNextAvailableTime(scheduledFor, prefs);
      }

      const message = this.generateMessage(nudgeKind, prefs, variables);
      
      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('user_id', userId)
        .single();

      const { error } = await supabase
        .from('nudges')
        .insert(await withFamily({
          target_user_id: userId,
          nudge_kind: nudgeKind,
          message,
          scheduled_for: scheduledFor.toISOString(),
          meta: { variables }
        }, profile));

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('Failed to schedule nudge:', error);
      return false;
    }
  }

  /**
   * Check if time is within quiet hours
   */
  isQuietTime(dateTime, prefs) {
    const time = dateTime.toTimeString().slice(0, 5); // HH:MM format
    const quietStart = prefs.quiet_hours_start || '22:00';
    const quietEnd = prefs.quiet_hours_end || '08:00';

    if (quietStart < quietEnd) {
      // Same day range (e.g., 10:00-18:00)
      return time >= quietStart && time <= quietEnd;
    } else {
      // Cross midnight (e.g., 22:00-08:00)
      return time >= quietStart || time <= quietEnd;
    }
  }

  /**
   * Get next available time outside quiet hours
   */
  getNextAvailableTime(dateTime, prefs) {
    const next = new Date(dateTime);
    const quietEnd = prefs.quiet_hours_end || '08:00';
    const [hours, minutes] = quietEnd.split(':').map(Number);
    
    // Set to next day at end of quiet hours
    next.setDate(next.getDate() + 1);
    next.setHours(hours, minutes, 0, 0);
    
    return next;
  }

  /**
   * Generate message based on preferences and template
   */
  generateMessage(nudgeKind, prefs, variables) {
    const template = MESSAGE_TEMPLATES[nudgeKind];
    if (!template) return `${prefs.bot_name} has a gentle reminder for you`;

    const packTemplate = template[prefs.message_pack] || template.standard;
    const message = packTemplate[prefs.language] || packTemplate.en || packTemplate[Object.keys(packTemplate)[0]];

    // Replace variables
    return message.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
  }

  /**
   * Check for and send queued nudges
   */
  async maybeSendQueued() {
    try {
      const now = new Date();
      const { data: nudges, error } = await supabase
        .from('nudges')
        .select(`
          *,
          target_user:profiles!target_user_id(full_name, user_id)
        `)
        .is('sent_at', null)
        .lte('scheduled_for', now.toISOString())
        .limit(10);

      if (error) throw error;

      for (const nudge of nudges || []) {
        await this.sendNudge(nudge);
      }

    } catch (error) {
      console.error('Failed to process queued nudges:', error);
    }
  }

  /**
   * Send a specific nudge
   */
  async sendNudge(nudge) {
    try {
      // For now, show as toast notification
      // In a full implementation, this could trigger push notifications, emails, etc.
      showSuccess(`${nudge.message}`, 'info', 6000);

      // Mark as sent
      await supabase
        .from('nudges')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', nudge.id);

    } catch (error) {
      console.error('Failed to send nudge:', error);
    }
  }

  /**
   * Post to family feed
   */
  async postToFeed(authorId, content, meta = {}) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('user_id', authorId)
        .single();

      const { data, error } = await supabase
        .from('posts')
        .insert(await withFamily({
          author_id: authorId,
          body: content,
          visibility: 'family'
        }, profile))
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Failed to post to feed:', error);
      return null;
    }
  }

  /**
   * Prompt user for action
   */
  async promptUserAction(userId, actionType, data = {}) {
    const prefs = await this.getMemberPrefs(userId);
    
    // Generate contextual prompt based on action type
    const prompts = {
      'wishlist_update': `🎁 Quick question: What's on your wishlist lately?`,
      'gratitude_share': `💝 Share what you're grateful for about your family`,
      'activity_suggestion': `🌟 Ready for a quick family activity?`,
      'kindness_check': `💫 How did kindness show up in your day?`
    };

    const message = prompts[actionType] || prompts['activity_suggestion'];
    
    // For now, show as interactive toast
    // In full implementation, this would open modal/form
    showSuccess(`${prefs.bot_name}: ${message}`, 'info', 8000);
    
    return { prompted: true, actionType, userId };
  }

  /**
   * Initialize the scheduler
   */
  initScheduler(app) {
    // Clear any existing interval
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    // Check for queued messages immediately
    this.maybeSendQueued();

    // Set up hourly checks
    this.schedulerInterval = setInterval(() => {
      this.maybeSendQueued();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Convenience helpers for common nudge types
   */
  get nudges() {
    return {
      antiBullying: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'anti_bullying_checkin', scheduledFor),
      
      rightHand: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'right_hand_nudge', scheduledFor),
      
      salad: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'salad_prompt', scheduledFor),
      
      momWeeklyHighlight: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'mom_weekly_highlight', scheduledFor),
      
      momSelfCare: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'mom_self_care', scheduledFor),
      
      momWeekendConnector: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'mom_weekend_connector', scheduledFor),
      
      gamingBreak: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'gaming_break', scheduledFor),
      
      gamingShareHighlight: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'gaming_share_highlight', scheduledFor),
      
      gamingPlanBalance: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'gaming_plan_balance', scheduledFor),
      
      gratitudeCollect: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'gratitude_collect', scheduledFor),
      
      gratitudeReview: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'gratitude_review', scheduledFor),
      
      gratitudeThankBack: (userId, scheduledFor) => 
        this.scheduleNudge(userId, 'gratitude_thank_back', scheduledFor)
    };
  }

  /**
   * Compile and post gratitude - special flow
   */
  async compileAndPostGratitude(authorId, gratitudeData) {
    try {
      // Create a meaningful gratitude post
      const content = `🙏 This month I'm grateful for:\n${gratitudeData.map(item => `• ${item}`).join('\n')}`;
      
      const post = await this.postToFeed(authorId, content, { type: 'monthly_gratitude' });
      
      if (post) {
        // Schedule follow-up thank-back message in 2 hours
        const thankBackTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await this.scheduleNudge(authorId, 'gratitude_thank_back', thankBackTime);
        
        showSuccess('Your gratitude has been shared with the family! 💝');
        return post;
      }

    } catch (error) {
      console.error('Failed to compile gratitude:', error);
      showError('Unable to share gratitude right now');
      return null;
    }
  }
}

// Create global instance
const FamilyBot = new FamilyBotAPI();

// Export for use in other modules
export { FamilyBot };

// Track initialization state
let started = false;

/**
 * Initialize FamilyBot scheduler only once per session
 * Safe to call multiple times - will be a no-op if already started
 */
export function initFamilyBotOnce() {
  if (started) return;
  started = true;
  
  import('./utils/logger.js').then(({ logger }) => {
    const log = logger('family-bot');
    log.info('scheduler initialized');
    FamilyBot.initScheduler();
    FamilyBot.init(); // Initialize autonomous systems
  }).catch(() => {
    // Fallback if logger fails to load
    console.log('[family-bot] scheduler initialized');
    FamilyBot.initScheduler();
    FamilyBot.init(); // Initialize autonomous systems
  });
}

// Auto-initialize autonomous FamilyBot when module loads
FamilyBot.init();

// Also make available globally for legacy compatibility
window.FamilyBot = FamilyBot;