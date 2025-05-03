import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getClinicDateRange, getClinicFutureDateRange } from './date-utils';
import { createDueTodayWhereClause, createUpcomingVisitsWhereClause } from './dashboard-utils';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  constructor(private prisma: PrismaService) {}

  async getStats(user: { clinicId?: string | null; role?: string }) {
    // For admin users who don't have a clinicId, return platform-wide stats
    if (user.role === 'ADMIN' && !user.clinicId) {
      const ownerCount = await this.prisma.owner.count();
      const petCount = await this.prisma.pet.count();
      
      return {
        ownerCount,
        petCount,
        isAdminView: true,
      };
    }
    
    // For regular users, return clinic-specific stats
    // Ensure clinicId is not null or undefined before using it in queries
    if (!user.clinicId) {
      throw new Error('Clinic ID is required for non-admin users');
    }

    const clinicId = user.clinicId;
    
    // Get the clinic's timezone
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { timezone: true },
    });
    
    // Use the clinic's timezone or default to UTC
    const timezone = clinic?.timezone || 'UTC';
    this.logger.debug(`Using timezone: ${timezone} for clinic ${clinicId}`);

    // Get the count of owners in the clinic
    const ownerCount = await this.prisma.owner.count({
      where: { clinicId },
    });

    // Get the count of pets belonging to owners in the clinic
    const petCount = await this.prisma.pet.count({
      where: {
        owner: {
          clinicId,
        },
      },
    });

    // Define the time window for upcoming vaccinations using clinic timezone
    const { start: startDate, end: endDate } = getClinicFutureDateRange(30, timezone);
    this.logger.debug(
      `Clinic timezone (${timezone}) upcoming window: ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );
    
    // Use the common where clause for upcoming vaccinations
    const upcomingVaccinationWhere = createUpcomingVisitsWhereClause(
      clinicId,
      30,
      timezone,
      'vaccination',
      undefined // Don't filter by isReminderEnabled for the dashboard count
    );
    
    // Get the count of upcoming vaccination visits
    const upcomingVaccinationCount = await this.prisma.visit.count({
      where: upcomingVaccinationWhere
    });

    // Get today's date range for the clinic's timezone
    const dueTodayWhereClause = createDueTodayWhereClause(clinicId, timezone);
    
    // Log date boundaries for debugging
    const { start, end } = getClinicDateRange(timezone);
    this.logger.debug(
      `Clinic (${timezone}) Today boundaries: ${start.toISOString()} to ${end.toISOString()}`,
    );
    
    // Get the count of reminders due today using the common where clause
    const dueTodayCount = await this.prisma.visit.count({
      where: dueTodayWhereClause
    });

    // Return the statistics
    return {
      ownerCount,
      petCount,
      upcomingVaccinationCount,
      dueTodayCount,
      isAdminView: false,
    };
  }
}
