/**
 * Birthdays Module
 * Provides birthday data management with timezone-safe calculations
 */

import { logger } from '../utils/logger.js';

const log = logger('birthdays');

// Seeded birthday data as requested
const BIRTHDAYS = [
  { name: 'Mariem',   dob: '1990-01-30' },
  { name: 'Yazid',    dob: '2014-03-28' },
  { name: 'Yahya',    dob: '2017-10-23' },
  { name: 'Ghassan',  dob: '1981-08-31' }
];

// Cache for user birthday queries to prevent repeated logs
let lastUserId = null;
let lastResult = null;

/**
 * Parse date of birth as UTC to avoid timezone issues
 * @param {string} dobString - Date string in YYYY-MM-DD format
 * @returns {Date} UTC date object
 */
function parseUTCDate(dobString) {
  const [year, month, day] = dobString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)); // month is 0-indexed
}

/**
 * Get the next occurrence of a birthday
 * @param {Date} birthDate - Original birth date (UTC)
 * @param {Date} now - Current date
 * @returns {Object} Object with nextOccurrence date and turningAge
 */
export function getNextOccurrence(birthDate, now = new Date()) {
  const currentYear = now.getUTCFullYear();
  const birthMonth = birthDate.getUTCMonth();
  const birthDay = birthDate.getUTCDate();
  const birthYear = birthDate.getUTCFullYear();
  
  // Try current year first
  let nextOccurrence = new Date(Date.UTC(currentYear, birthMonth, birthDay));
  
  // If birthday has already passed this year, move to next year
  if (nextOccurrence < now) {
    nextOccurrence = new Date(Date.UTC(currentYear + 1, birthMonth, birthDay));
  }
  
  const turningAge = nextOccurrence.getUTCFullYear() - birthYear;
  
  return {
    nextOccurrence,
    turningAge
  };
}

/**
 * Calculate days until a date
 * @param {Date} targetDate - Target date
 * @param {Date} now - Current date
 * @returns {number} Days until target (rounded up)
 */
function getDaysUntil(targetDate, now = new Date()) {
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format countdown text for display
 * @param {number} daysUntil - Number of days until birthday
 * @returns {string} Formatted countdown text
 */
function formatCountdown(daysUntil) {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'in 1 day';
  return `in ${daysUntil} days`;
}

/**
 * Format birthday date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatBirthdayDate(date) {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    timeZone: 'UTC' // Ensure UTC to avoid timezone shifts
  });
}

/**
 * Get avatar emoji based on name
 * @param {string} name - Person's name
 * @returns {string} Emoji avatar
 */
function getAvatar(name) {
  const avatars = {
    'Mariem': '👩',
    'Yazid': '👦',
    'Yahya': '👶',
    'Ghassan': '👨'
  };
  return avatars[name] || '👤';
}

/**
 * Get upcoming birthdays sorted by next occurrence
 * @param {Date} now - Current date (defaults to new Date())
 * @returns {Array} Array of birthday objects sorted by days until next occurrence
 */
export function getUpcomingBirthdays(now = new Date()) {
  // Ensure we have a valid date
  if (!(now instanceof Date) || isNaN(now.getTime())) {
    now = new Date();
  }
  
  // Process each birthday
  const processed = BIRTHDAYS.map(birthday => {
    const birthDate = parseUTCDate(birthday.dob);
    const { nextOccurrence, turningAge } = getNextOccurrence(birthDate, now);
    const daysUntil = getDaysUntil(nextOccurrence, now);
    
    return {
      name: birthday.name,
      dob: birthday.dob,
      birthDate,
      nextOccurrence,
      turningAge,
      daysUntil,
      avatar: getAvatar(birthday.name),
      dateText: formatBirthdayDate(nextOccurrence),
      countdownText: formatCountdown(daysUntil),
      isToday: daysUntil === 0
    };
  });
  
  // Sort by days until next occurrence (ascending)
  processed.sort((a, b) => a.daysUntil - b.daysUntil);
  
  return processed;
}

/**
 * Get limited set of upcoming birthdays for card display
 * @param {Date} now - Current date (defaults to new Date())
 * @param {number} limit - Maximum number of birthdays to return (default 5)
 * @returns {Array} Limited array of upcoming birthdays
 */
export function getUpcomingBirthdaysForCard(now = new Date(), limit = 5) {
  const allBirthdays = getUpcomingBirthdays(now);
  return allBirthdays.slice(0, limit);
}

/**
 * Schedule birthday-related nudges for a user
 * T-30: Wishlist refresh reminder
 * T-0: Happy birthday auto-post with top 3 wishlist items
 * T+2: Gratitude prompt
 * @param {string} userId - User ID to schedule for
 * @returns {Promise<boolean>} Success status
 */
export async function scheduleBirthdaysFor(userId) {
  try {
    // Import FamilyBot dynamically to avoid circular dependencies
    const { FamilyBot } = await import('../fn-family-bot.js');
    const { supabase } = await import('../../web/supabaseClient.js');
    
    // Get user's profile with birthday
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, dob, family_id')
      .eq('user_id', userId)
      .single();

    if (error || !profile.dob) {
      log.warn('No birthday found for user:', userId);
      return false;
    }

    const birthDate = parseUTCDate(profile.dob);
    const { nextOccurrence } = getNextOccurrence(birthDate);
    
    // T-30 days: Wishlist refresh reminder
    const thirtyDaysBefore = new Date(nextOccurrence);
    thirtyDaysBefore.setDate(thirtyDaysBefore.getDate() - 30);
    
    if (thirtyDaysBefore > new Date()) {
      await FamilyBot.scheduleNudge(
        userId, 
        'birthday_pre', 
        thirtyDaysBefore,
        { name: profile.full_name }
      );
    }

    // T-0: Birthday auto-post
    const birthdayMorning = new Date(nextOccurrence);
    birthdayMorning.setHours(9, 0, 0, 0); // 9 AM on birthday
    
    if (birthdayMorning > new Date()) {
      // Get top 3 wishlist items
      const { data: wishlistItems } = await supabase
        .from('wishlist')
        .select('title')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('priority', { ascending: false })
        .limit(3);

      const wishlistText = wishlistItems && wishlistItems.length > 0 
        ? `\n\nTop wishlist items:\n${wishlistItems.map(item => `• ${item.title}`).join('\n')}`
        : '';

      const birthdayPost = `🎂 Happy Birthday ${profile.full_name}! 🎉\n\nWishing you the most wonderful year ahead filled with joy, laughter, and amazing adventures!${wishlistText}`;
      
      // Schedule the birthday post
      setTimeout(async () => {
        if (new Date().toDateString() === birthdayMorning.toDateString()) {
          await FamilyBot.postToFeed(userId, birthdayPost, { 
            type: 'birthday',
            auto_generated: true 
          });
        }
      }, birthdayMorning.getTime() - Date.now());
    }

    // T+2 days: Gratitude prompt
    const twoDaysAfter = new Date(nextOccurrence);
    twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);
    twoDaysAfter.setHours(18, 0, 0, 0); // 6 PM, 2 days after birthday
    
    if (twoDaysAfter > new Date()) {
      await FamilyBot.scheduleNudge(
        userId,
        'gratitude_post',
        twoDaysAfter,
        { name: profile.full_name }
      );
    }

    console.log(`Scheduled birthday reminders for ${profile.full_name}`);
    return true;

  } catch (error) {
    console.error('Failed to schedule birthday reminders:', error);
    return false;
  }
}