/**
 * Birthdays Module
 * Provides birthday data management with timezone-safe calculations
 */

// Seeded birthday data as requested
const BIRTHDAYS = [
  { name: 'Mariem',   dob: '1990-01-30' },
  { name: 'Yazid',    dob: '2014-03-28' },
  { name: 'Yahya',    dob: '2017-10-23' },
  { name: 'Ghassan',  dob: '1981-08-31' }
];

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