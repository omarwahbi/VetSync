import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterVisitDto } from './dto/filter-visit.dto';
import { Prisma, User } from '@prisma/client';
import { getUTCTodayRange, getClinicFutureDateRange, getClinicDateRange } from '../dashboard/date-utils';
import { createDueTodayWhereClause, createUpcomingVisitsWhereClause } from '../dashboard/dashboard-utils';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  // Helper function to normalize a date to midnight UTC for any date string input
  private normalizeDate(dateString: string | undefined): Date | undefined {
    if (!dateString) return undefined;
    
    // Parse the input date string
    const date = new Date(dateString);
    
    // Extract just the date portion in YYYY-MM-DD format and create a new date at midnight UTC
    // This ensures we're storing the date selected by the user, not the timezone-shifted date
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Create a date at midnight in the local timezone, then convert to ISO string
    // This preserves the user's selected date regardless of timezone
    const normalizedDate = new Date(Date.UTC(year, month, day));
    return normalizedDate;
  }

  async create(createVisitDto: CreateVisitDto, petId: string, user: User) {
    // First verify the pet exists and belongs to the user's clinic
    const pet = await this.prisma.pet.findFirst({
      where: {
        id: petId,
        owner: {
          clinicId: user.clinicId as string,
        },
      },
    });

    if (!pet) {
      throw new NotFoundException(`Pet with ID ${petId} not found in your clinic`);
    }

    // If nextReminderDate is provided, normalize it to midnight UTC
    const normalizedData = { ...createVisitDto };
    if (normalizedData.nextReminderDate) {
      const normalizedDate = this.normalizeDate(normalizedData.nextReminderDate);
      if (normalizedDate) {
        normalizedData.nextReminderDate = normalizedDate.toISOString();
      }
    }

    // Create visit for the verified pet with normalized date
    return this.prisma.visit.create({
      data: {
        ...normalizedData,
        petId,
        createdById: user.id,
        updatedById: user.id,
      },
    });
  }

  async findAll(petId: string, user: { clinicId: string }) {
    // First verify the pet exists and belongs to the user's clinic
    const pet = await this.prisma.pet.findFirst({
      where: {
        id: petId,
        owner: {
          clinicId: user.clinicId,
        },
      },
    });

    if (!pet) {
      throw new NotFoundException(`Pet with ID ${petId} not found in your clinic`);
    }

    // Find all visits for the verified pet
    return this.prisma.visit.findMany({
      where: {
        petId,
        pet: {
          owner: {
            clinicId: user.clinicId,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, petId: string, user: { clinicId?: string | null } | User) {
    // Safely get the clinicId
    const clinicId = user.clinicId;
    
    if (!clinicId) {
      throw new NotFoundException('Clinic ID is required');
    }
    
    const visit = await this.prisma.visit.findFirst({
      where: {
        id,
        petId,
        pet: {
          owner: {
            clinicId,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException(`Visit with ID ${id} not found for this pet in your clinic`);
    }

    return visit;
  }

  async update(id: string, petId: string, updateVisitDto: UpdateVisitDto, user: User) {
    // First verify the visit exists and belongs to the pet and clinic
    await this.findOne(id, petId, user);

    // If nextReminderDate is provided, normalize it to midnight UTC
    const normalizedData = { ...updateVisitDto };
    if (normalizedData.nextReminderDate) {
      const normalizedDate = this.normalizeDate(normalizedData.nextReminderDate);
      if (normalizedDate) {
        normalizedData.nextReminderDate = normalizedDate.toISOString();
      }
    }

    // If findOne didn't throw, proceed with update using normalized data
    return this.prisma.visit.update({
      where: { id },
      data: {
        ...normalizedData,
        updatedById: user.id,
      },
    });
  }

  async remove(id: string, petId: string, user: { clinicId: string }) {
    // First verify the visit exists and belongs to the pet and clinic
    await this.findOne(id, petId, user);

    // If findOne didn't throw, proceed with deletion
    return this.prisma.visit.delete({
      where: { id },
    });
  }

  async findUpcoming(user: { clinicId?: string | null; role?: string }) {
    // Get current time for debugging
    const today = new Date();
    console.log('Current server time:', today.toISOString());
    
    // Get the clinic's timezone if applicable
    let timezone = 'UTC';
    if (user.clinicId) {
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: user.clinicId },
        select: { timezone: true },
      });
      timezone = clinic?.timezone || 'UTC';
    }
    console.log(`Using timezone: ${timezone} for upcoming visits query`);
    
    // For regular users, ensure clinicId is not null or undefined before using it
    if (!user.clinicId && user.role !== 'ADMIN') {
      throw new Error('Clinic ID is required for non-admin users');
    }
    
    // Use the common where clause for upcoming visits
    const whereClause = createUpcomingVisitsWhereClause(
      user.clinicId,
      30,
      timezone,
      undefined, // No specific visit type for upcoming visits list
      undefined  // Don't filter by isReminderEnabled for consistency with dashboard
    );
    
    console.log('Upcoming query where clause:', JSON.stringify(whereClause));
    
    // Count the results first to verify
    const visitsCount = await this.prisma.visit.count({ where: whereClause });
    console.log(`Found ${visitsCount} upcoming visits`);

    // Get the visits if there are any
    if (visitsCount > 0) {
      const visits = await this.prisma.visit.findMany({
        where: whereClause,
        include: {
          pet: {
            select: {
              id: true,
              name: true,
              owner: {
                select: {
                  firstName: true,
                  lastName: true,
                  clinic: user.role === 'ADMIN' ? {
                    select: {
                      name: true,
                    },
                  } : undefined,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          nextReminderDate: 'asc',
        },
        take: 10,
      });
      console.log('First upcoming visit:', visits.length ? JSON.stringify(visits[0]) : 'None found');
      return visits;
    }
    
    console.log('No upcoming visits found.');
    return [];
  }

  async findAllClinicVisits(user: { clinicId?: string | null; role?: string }, filterDto: FilterVisitDto) {
    const { page = 1, limit = 20, startDate, endDate, visitType, search } = filterDto;
    const skip = (page - 1) * limit;

    // Build the base where clause
    let whereClause: Prisma.VisitWhereInput = {};
    
    // For admin users without a clinicId, don't filter by clinic
    if (user.role !== 'ADMIN' || user.clinicId) {
      // For non-admin users, ensure clinicId exists
      if (user.role !== 'ADMIN' && !user.clinicId) {
        throw new Error('Clinic ID is required for non-admin users');
      }
      
      // Only add clinicId to the where clause if it exists
      if (user.clinicId) {
        whereClause = {
          pet: {
            owner: {
              clinicId: user.clinicId,
            },
          },
        };
      }
    }

    // Add date range filter if provided, handling timezone issues
    if (startDate && endDate) {
      // Normalize dates to midnight UTC
      const normalizedStartDate = this.normalizeDate(startDate);
      // For end date, set to end of day (23:59:59.999)
      const normalizedEndDate = this.normalizeDate(endDate);
      if (normalizedEndDate) {
        normalizedEndDate.setUTCHours(23, 59, 59, 999);
      }
      
      whereClause.visitDate = {
        gte: normalizedStartDate,
        lte: normalizedEndDate,
      };
    } else if (startDate) {
      const normalizedStartDate = this.normalizeDate(startDate);
      whereClause.visitDate = {
        gte: normalizedStartDate,
      };
    } else if (endDate) {
      const normalizedEndDate = this.normalizeDate(endDate);
      if (normalizedEndDate) {
        normalizedEndDate.setUTCHours(23, 59, 59, 999);
      }
      whereClause.visitDate = {
        lte: normalizedEndDate,
      };
    }

    // Add visit type filter if provided
    if (visitType) {
      whereClause.visitType = visitType;
    }

    // Add search filter using multi-word search logic
    if (search) {
      // Split search string into words and limit to maximum 5 terms for performance
      const searchTerms = search.trim().split(/\s+/).slice(0, 5);

      // We need ALL search terms to match somewhere (using AND)
      whereClause.AND = (whereClause.AND || []) as Prisma.VisitWhereInput[];
      searchTerms.forEach(term => {
        // For each term, add an OR condition checking across fields
        (whereClause.AND as Prisma.VisitWhereInput[]).push({
          OR: [
            { pet: { name: { contains: term, mode: 'insensitive' } } },
            { pet: { owner: { firstName: { contains: term, mode: 'insensitive' } } } },
            { pet: { owner: { lastName: { contains: term, mode: 'insensitive' } } } },
            { notes: { contains: term, mode: 'insensitive' } },
            { visitType: { contains: term, mode: 'insensitive' } },
          ],
        });
      });
    }

    // Get total count of records matching the where clause
    const totalCount = await this.prisma.visit.count({ where: whereClause });
    
    // Get paginated visits matching the where clause
    const visits = await this.prisma.visit.findMany({
      where: whereClause,
      include: {
        pet: {
          select: {
            id: true, 
            name: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        visitDate: 'desc',
      },
      skip,
      take: limit,
    });
    
    return {
      data: visits,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async findVisitsDueToday(user: { clinicId?: string | null; role?: string }, page = 1, limit = 20) {
    // Calculate date range for today in UTC to avoid timezone issues
    const today = new Date();
    console.log('Current server time for due today:', today.toISOString());
    
    // Get the clinic's timezone if applicable
    let timezone = 'UTC';
    if (user.clinicId) {
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: user.clinicId },
      });
      timezone = clinic?.timezone || 'UTC';
    }
    console.log(`Using timezone: ${timezone} for due today query`);
    
    // Get today's date range in the clinic's timezone
    const { start: todayStartUTC, end: todayEndUTC } = getClinicDateRange(timezone);
    
    // Debug information about the date ranges
    console.log('Today Start (clinic timezone converted to UTC):', todayStartUTC.toISOString());
    console.log('Today End (clinic timezone converted to UTC):', todayEndUTC.toISOString());
    
    // Apply pagination
    const skip = (page - 1) * limit;
    
    // Build the where clause based on user role and clinic using the shared utility
    let whereClause: Prisma.VisitWhereInput;
    
    // For admin users without a clinicId, return visits from all clinics
    if (user.role === 'ADMIN' && !user.clinicId) {
      whereClause = createDueTodayWhereClause(null, timezone);
    } else {
      // For non-admin users, ensure clinicId exists
      if (user.role !== 'ADMIN' && !user.clinicId) {
        throw new Error('Clinic ID is required for non-admin users');
      }
      
      whereClause = createDueTodayWhereClause(user.clinicId, timezone);
    }

    // Log the query parameters for debugging
    console.log('Due today query where clause:', JSON.stringify(whereClause));

    // Get total count of records matching the where clause
    const totalCount = await this.prisma.visit.count({ where: whereClause });
    console.log(`Found ${totalCount} visits due today after applying filters`);
    
    if (totalCount === 0) {
      return {
        data: [],
        pagination: {
          totalCount: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
    
    // Get paginated visits matching the where clause
    const visits = await this.prisma.visit.findMany({
      where: whereClause,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            dob: true,
            gender: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                address: true,
                clinicId: true,
                allowAutomatedReminders: true,
                clinic: user.role === 'ADMIN' ? {
                  select: {
                    id: true,
                    name: true,
                  },
                } : undefined,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        nextReminderDate: 'asc',
      },
      skip,
      take: limit,
    });
    
    return {
      data: visits,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getDebugDateInfo() {
    // Return raw visit data for debugging date issues
    return this.prisma.visit.findMany({
      select: {
        id: true,
        visitType: true,
        nextReminderDate: true,
        petId: true,
        pet: {
          select: {
            name: true,
            owner: {
              select: {
                clinicId: true,
              },
            },
          },
        },
      },
      orderBy: {
        nextReminderDate: 'desc',
      },
      take: 20,
    });
  }
}
