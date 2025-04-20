import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
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

    // Define the time window for upcoming vaccinations (next 30 days)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Get the count of upcoming vaccination visits
    const upcomingVaccinationCount = await this.prisma.visit.count({
      where: {
        visitType: 'vaccination',
        nextReminderDate: {
          gte: startDate,
          lte: endDate,
        },
        pet: {
          owner: {
            clinicId,
          },
        },
      },
    });

    // Calculate date range for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Beginning of today

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); // End of today
    
    // Get the count of reminders due today
    const dueTodayCount = await this.prisma.visit.count({
      where: {
        pet: {
          owner: {
            clinicId,
          },
        },
        nextReminderDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        // Only count reminders that are enabled
        isReminderEnabled: true,
      },
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
