/**
 * FamilyBot - Proactive family engagement system
 * Handles scheduling, message generation, and family interactions
 */

import { supabase } from '../web/supabaseClient.js';
import { showSuccess, showError } from './toast-helper.js';

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
        .single();

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
        .insert({
          family_id: profile.family_id,
          target_user_id: userId,
          nudge_kind: nudgeKind,
          message,
          scheduled_for: scheduledFor.toISOString(),
          meta: { variables }
        });

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
        .insert({
          family_id: profile.family_id,
          author_id: authorId,
          body: content,
          visibility: 'family'
        })
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

    console.log('FamilyBot scheduler initialized');
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

// Also make available globally for legacy compatibility
window.FamilyBot = FamilyBot;