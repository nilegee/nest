// @ts-check
/**
 * @fileoverview Date utilities for FamilyNest
 * Birthday calculations, date formatting, and time helpers
 */

/**
 * Calculate the next occurrence of a birthday
 * @param {string} dateOfBirth - ISO date string of birth date
 * @returns {string} ISO string of next birthday occurrence
 */
export function nextBirthday(dateOfBirth) {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  
  // Create this year's birthday
  const thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  
  // If birthday has passed this year, use next year
  if (thisYear < today) {
    return new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate()).toISOString();
  }
  
  return thisYear.toISOString();
}

/**
 * Check if a date is within a specified number of days from now
 * @param {string} isoDate - ISO date string to check
 * @param {number} days - Number of days to check within
 * @returns {boolean} True if date is within the specified days
 */
export function isWithinDays(isoDate, days) {
  const targetDate = new Date(isoDate);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Calculate days until a future date
 * @param {string} isoDate - ISO date string
 * @returns {number} Number of days until the date (negative if past)
 */
export function daysUntil(isoDate) {
  const targetDate = new Date(isoDate);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get the start of day for a date
 * @param {Date} [date] - Date object (defaults to today)
 * @returns {Date} Start of day
 */
export function startOfDay(date = new Date()) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of day for a date
 * @param {Date} [date] - Date object (defaults to today)
 * @returns {Date} End of day
 */
export function endOfDay(date = new Date()) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Format a date for display
 * @param {string|Date} date - Date to format
 * @param {Object} [options] - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format time for display
 * @param {string|Date} date - Date/time to format
 * @param {Object} [options] - Intl.DateTimeFormat options
 * @returns {string} Formatted time string
 */
export function formatTime(date, options = {}) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return dateObj.toLocaleTimeString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format date and time for display
 * @param {string|Date} date - Date/time to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(dateObj)} at ${formatTime(dateObj)}`;
}

/**
 * Get relative time description (e.g., "in 3 days", "2 hours ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time description
 */
export function getRelativeTime(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (Math.abs(diffDays) >= 1) {
    const days = Math.abs(diffDays);
    const label = days === 1 ? 'day' : 'days';
    return diffDays > 0 ? `in ${days} ${label}` : `${days} ${label} ago`;
  }
  
  if (Math.abs(diffHours) >= 1) {
    const hours = Math.abs(diffHours);
    const label = hours === 1 ? 'hour' : 'hours';
    return diffHours > 0 ? `in ${hours} ${label}` : `${hours} ${label} ago`;
  }
  
  if (Math.abs(diffMinutes) >= 1) {
    const minutes = Math.abs(diffMinutes);
    const label = minutes === 1 ? 'minute' : 'minutes';
    return diffMinutes > 0 ? `in ${minutes} ${label}` : `${minutes} ${label} ago`;
  }
  
  return 'just now';
}

/**
 * Check if a date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
}

/**
 * Check if a date is tomorrow
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is tomorrow
 */
export function isTomorrow(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return dateObj.getDate() === tomorrow.getDate() &&
         dateObj.getMonth() === tomorrow.getMonth() &&
         dateObj.getFullYear() === tomorrow.getFullYear();
}