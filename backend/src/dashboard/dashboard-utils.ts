import { Prisma } from '@prisma/client';
import { getClinicDateRange, getUTCTodayRange, getClinicFutureDateRange } from './date-utils';

/**
 * Creates a common where clause for visits due today
 * This ensures consistency between dashboard stats and the visits list
 * @param userClinicId The clinic ID to filter by
 * @param timezone The clinic's timezone (defaults to UTC if not provided)
 */
export function createDueTodayWhereClause(
  userClinicId?: string | null,
  timezone: string = 'UTC'
): Prisma.VisitWhereInput {
  // Use clinic timezone-aware date range function
  const { start, end } = getClinicDateRange(timezone);
  
  const whereClause: Prisma.VisitWhereInput = {
    nextReminderDate: {
      gte: start,
      lte: end
    },
    // Only count reminders that are enabled
    isReminderEnabled: true
  };
  
  // Add clinic filter if user has a clinic ID
  if (userClinicId) {
    whereClause.pet = {
      owner: {
        clinicId: userClinicId
      }
    };
  }
  
  return whereClause;
}

/**
 * Creates a common where clause for upcoming visits
 * This ensures consistency between dashboard stats and the upcoming visits list
 * @param userClinicId The clinic ID to filter by
 * @param daysAhead Number of days to look ahead (default: 30)
 * @param timezone The clinic's timezone (defaults to UTC if not provided)
 * @param visitType Optional visit type filter (e.g., 'VACCINATION')
 * @param reminderEnabled Optional filter for isReminderEnabled (undefined = don't filter by reminder status)
 */
export function createUpcomingVisitsWhereClause(
  userClinicId?: string | null,
  daysAhead: number = 30,
  timezone: string = 'UTC',
  visitType?: string,
  reminderEnabled?: boolean
): Prisma.VisitWhereInput {
  // Use clinic timezone-aware date range function
  const { start, end } = getClinicFutureDateRange(daysAhead, timezone);
  
  const whereClause: Prisma.VisitWhereInput = {
    nextReminderDate: {
      gte: start,
      lte: end
    }
  };
  
  // Add clinic filter if user has a clinic ID
  if (userClinicId) {
    whereClause.pet = {
      owner: {
        clinicId: userClinicId
      }
    };
  }
  
  // Add visitType filter if specified
  if (visitType) {
    whereClause.visitType = visitType;
  }
  
  // Add isReminderEnabled filter ONLY if explicitly requested (not undefined)
  if (reminderEnabled !== undefined) {
    whereClause.isReminderEnabled = reminderEnabled;
  }
  
  return whereClause;
} 