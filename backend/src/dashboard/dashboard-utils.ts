import { Prisma } from '@prisma/client';
import { getClinicDateRange, getUTCTodayRange } from './date-utils';

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