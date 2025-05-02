import { format, toZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay, addDays } from 'date-fns';

/**
 * Gets the UTC date range for the current day
 * This provides consistent timezone handling for "today" calculations
 * @deprecated Use getClinicDateRange instead which respects the clinic's timezone
 */
export function getUTCTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
  
  return { start, end };
}

/**
 * Gets the date range for a clinic's current day based on their timezone
 * Returns the start and end times in UTC for use in database queries
 */
export function getClinicDateRange(timezone: string = 'UTC'): { start: Date; end: Date } {
  try {
    // Get current time in the clinic's timezone
    const now = new Date();
    const zonedNow = toZonedTime(now, timezone);
    
    // Get start of day in clinic's timezone
    const zonedStartOfDay = startOfDay(zonedNow);
    
    // Get end of day in clinic's timezone
    const zonedEndOfDay = endOfDay(zonedNow);
    
    // Convert back to UTC for database queries
    // Note: We convert to ISO string first, which gives us UTC time
    const utcStart = new Date(zonedStartOfDay.toISOString());
    const utcEnd = new Date(zonedEndOfDay.toISOString());
    
    return { start: utcStart, end: utcEnd };
  } catch (error) {
    // Fallback to UTC if there's any issue with the timezone
    console.error(`Invalid timezone: ${timezone}. Falling back to UTC.`, error);
    return getUTCTodayRange();
  }
}

/**
 * Gets the date range for a future period in a clinic's timezone
 * @param daysAhead Number of days to look ahead
 * @param timezone The clinic's timezone
 * @returns Date range in UTC for database queries
 */
export function getClinicFutureDateRange(
  daysAhead: number = 30,
  timezone: string = 'UTC',
): { start: Date; end: Date } {
  try {
    // Get today's range in clinic timezone
    const { start: todayStart } = getClinicDateRange(timezone);
    
    // Get current time in the clinic's timezone
    const now = new Date();
    const zonedNow = toZonedTime(now, timezone);
    
    // Calculate the future date in the clinic's timezone
    const zonedFutureDate = addDays(zonedNow, daysAhead);
    const zonedFutureEndOfDay = endOfDay(zonedFutureDate);
    
    // Convert future end date back to UTC
    const utcFutureEnd = new Date(zonedFutureEndOfDay.toISOString());
    
    return { start: todayStart, end: utcFutureEnd };
  } catch (error) {
    // Fallback to UTC if there's any issue with the timezone
    console.error(`Invalid timezone: ${timezone}. Falling back to UTC.`, error);
    const now = new Date();
    const futureDate = addDays(now, daysAhead);
    return {
      start: startOfDay(now),
      end: endOfDay(futureDate),
    };
  }
} 