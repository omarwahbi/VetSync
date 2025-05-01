import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterVisitDto } from './dto/filter-visit.dto';
import { Prisma, User } from '@prisma/client';

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
    
    // Get the current date parts
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    // Create start of day in UTC (midnight)
    const todayStartUTC = new Date(Date.UTC(year, month, day));
    
    // Get date 30 days from now
    const thirtyDaysLater = new Date(Date.UTC(year, month, day + 30, 23, 59, 59, 999));
    
    console.log('Upcoming date range - From:', todayStartUTC.toISOString(), 'To:', thirtyDaysLater.toISOString());
    
    // For debugging: Apply a 3-hour extension on both sides for more lenient matching
    const extendedStartUTC = new Date(todayStartUTC);
    extendedStartUTC.setUTCHours(todayStartUTC.getUTCHours() - 3);
    
    // For debugging: Query to check if ANY visits have nextReminderDate set
    const anyVisitsWithReminders = await this.prisma.visit.findMany({
      where: {},
      select: { 
        id: true, 
        nextReminderDate: true,
        visitType: true
      },
      take: 5
    });
    console.log('Sample visits with nextReminderDate:', JSON.stringify(anyVisitsWithReminders));
    
    // For regular users, ensure clinicId is not null or undefined before using it
    if (!user.clinicId && user.role !== 'ADMIN') {
      throw new Error('Clinic ID is required for non-admin users');
    }
    
    // Build the query
    let whereClause: Prisma.VisitWhereInput = {
      nextReminderDate: {
        gte: extendedStartUTC,
        lte: thirtyDaysLater,
      }
    };
    
    // Add clinic filter for non-admin users
    if (user.role !== 'ADMIN' || user.clinicId) {
      if (user.clinicId) {
        whereClause = {
          ...whereClause,
          pet: {
            owner: {
              clinicId: user.clinicId,
            },
          },
        };
      }
    }
    
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
    
    // Get the current date parts
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    // Create start of day in UTC (midnight)
    const todayStartUTC = new Date(Date.UTC(year, month, day));
    // Create end of day in UTC (23:59:59.999)
    const todayEndUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    
    // Debug information about the date ranges
    console.log('Today Start UTC:', todayStartUTC.toISOString());
    console.log('Today End UTC:', todayEndUTC.toISOString());
    
    // For more flexible debugging, extend the range by 3 hours on either side
    // This helps catch dates that might be off by a few hours due to timezone conversion
    const extendedStartUTC = new Date(todayStartUTC);
    extendedStartUTC.setUTCHours(todayStartUTC.getUTCHours() - 3);
    
    const extendedEndUTC = new Date(todayEndUTC);
    extendedEndUTC.setUTCHours(todayEndUTC.getUTCHours() + 3);
    
    console.log('Extended Today Start UTC (for debugging):', extendedStartUTC.toISOString());
    console.log('Extended Today End UTC (for debugging):', extendedEndUTC.toISOString());
    
    // For debugging: Query to check if ANY visits have nextReminderDate matching today's date
    // Uses the extended range for more lenient matching
    const todayVisitsRaw = await this.prisma.visit.findMany({
      where: {
        nextReminderDate: {
          gte: extendedStartUTC,
          lte: extendedEndUTC
        }
      },
      select: { 
        id: true,
        nextReminderDate: true,
        visitType: true
      }
    });
    console.log('All visits due today (extended range):', JSON.stringify(todayVisitsRaw));
    
    // Apply pagination
    const skip = (page - 1) * limit;
    
    // Build the where clause - using the extended range for more reliable results
    let whereClause: Prisma.VisitWhereInput = {
      nextReminderDate: {
        gte: extendedStartUTC,
        lte: extendedEndUTC
      }
    };
    
    // For admin users without a clinicId, return visits from all clinics
    // For regular users, filter by clinicId
    if (user.role !== 'ADMIN' || user.clinicId) {
      // For non-admin users, ensure clinicId exists
      if (user.role !== 'ADMIN' && !user.clinicId) {
        throw new Error('Clinic ID is required for non-admin users');
      }
      
      // Only add clinicId filter if it exists
      if (user.clinicId) {
        whereClause = {
          ...whereClause,
          pet: {
            owner: {
              clinicId: user.clinicId
            }
          }
        };
      }
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
    
    // Log the first result for debugging
    if (visits.length > 0) {
      console.log('First visit due today:', JSON.stringify({
        id: visits[0].id,
        visitType: visits[0].visitType,
        nextReminderDate: visits[0].nextReminderDate,
        petName: visits[0].pet?.name
      }));
    }
    
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
