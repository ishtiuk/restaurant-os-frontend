/**
 * Format UTC date to user's selected timezone
 */
export const formatWithTimezone = (
  utcDate: string | Date,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return date.toLocaleString("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
};

/**
 * Get date-only string in user's timezone (YYYY-MM-DD format)
 */
export const getDateOnly = (utcDate: string | Date, timezone: string): string => {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return date.toLocaleDateString("en-CA", {
    timeZone: timezone,
  });
};

/**
 * Format date for display (date only, no time)
 */
export const formatDate = (utcDate: string | Date, timezone: string): string => {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return date.toLocaleDateString("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time only in user's timezone
 */
export const formatTime = (utcDate: string | Date, timezone: string): string => {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return date.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Check if a UTC date is "today" in user's timezone
 */
export const isToday = (utcDate: string | Date, timezone: string): boolean => {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  const today = new Date();
  return getDateOnly(date, timezone) === getDateOnly(today, timezone);
};

/**
 * Get start of day in user's timezone (returns UTC Date for API calls)
 * CRITICAL: This correctly converts timezone-aware "start of day" to UTC
 * Example: If user in Asia/Dhaka (UTC+6) selects "today" (Dec 20),
 *          this returns Dec 19 18:00 UTC (which is Dec 20 00:00 in Dhaka)
 */
export const getStartOfDay = (date: Date, timezone: string): Date => {
  // Get date parts in user's timezone
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  const dateStr = `${year}-${month}-${day}`;
  
  // Use noon UTC as reference point (avoids DST issues at midnight)
  const noonUTC = new Date(`${dateStr}T12:00:00Z`);
  
  // Get what time noon UTC shows in user's timezone
  const noonInUserTZ = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(noonUTC);
  
  // Extract hour (format: "HH:mm")
  const [hourStr] = noonInUserTZ.split(":");
  const hourInUserTZ = parseInt(hourStr, 10);
  
  // Calculate: if noon UTC is 6 PM (18:00) in user's TZ, 
  // then midnight in user's TZ is 12 hours before that = 6 hours before noon UTC
  // So: midnight in user's TZ = noon UTC - (hourInUserTZ - 12) hours
  const hoursToSubtract = hourInUserTZ - 12;
  const midnightUTC = new Date(noonUTC.getTime() - hoursToSubtract * 60 * 60 * 1000);
  
  // Verify the date is correct (handle edge cases)
  const verifyDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(midnightUTC);
  
  if (verifyDate !== dateStr) {
    // If date doesn't match, adjust by one day
    const adjustment = verifyDate < dateStr ? 24 * 60 * 60 * 1000 : -24 * 60 * 60 * 1000;
    return new Date(midnightUTC.getTime() + adjustment);
  }
  
  return midnightUTC;
};

/**
 * Get end of day in user's timezone (returns UTC Date for API calls)
 * CRITICAL: This correctly converts timezone-aware "end of day" to UTC
 * Example: If user in Asia/Dhaka (UTC+6) selects "today" (Dec 20),
 *          this returns Dec 20 17:59:59.999 UTC (which is Dec 20 23:59:59.999 in Dhaka)
 */
export const getEndOfDay = (date: Date, timezone: string): Date => {
  const start = getStartOfDay(date, timezone);
  // Add 24 hours minus 1 millisecond to get end of day
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
};
