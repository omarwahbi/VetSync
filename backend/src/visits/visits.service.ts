import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterVisitDto } from './dto/filter-visit.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  async create(createVisitDto: CreateVisitDto, petId: string, user: { clinicId: string }) {
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

    // Create visit for the verified pet
    return this.prisma.visit.create({
      data: {
        ...createVisitDto,
        petId,
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
    });
  }

  async findOne(id: string, petId: string, user: { clinicId: string }) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        id,
        petId,
        pet: {
          owner: {
            clinicId: user.clinicId,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException(`Visit with ID ${id} not found for this pet in your clinic`);
    }

    return visit;
  }

  async update(id: string, petId: string, updateVisitDto: UpdateVisitDto, user: { clinicId: string }) {
    // First verify the visit exists and belongs to the pet and clinic
    await this.findOne(id, petId, user);

    // If findOne didn't throw, proceed with update
    return this.prisma.visit.update({
      where: { id },
      data: updateVisitDto,
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
    // Get current date
    const today = new Date();
    // Set to start of day (midnight)
    today.setHours(0, 0, 0, 0);
    
    // Get date 30 days from now
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    // Set to end of day
    thirtyDaysFromNow.setHours(23, 59, 59, 999);
    
    // For admin users without a clinicId, return visits from all clinics
    if (user.role === 'ADMIN' && !user.clinicId) {
      return this.prisma.visit.findMany({
        where: {
          nextReminderDate: {
            gte: today,
            lte: thirtyDaysFromNow,
          },
        },
        include: {
          pet: {
            select: {
              id: true,
              name: true,
              owner: {
                select: {
                  firstName: true,
                  lastName: true,
                  clinic: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          nextReminderDate: 'asc',
        },
        take: 10, // Limit to 10 results for better dashboard performance
      });
    }
    
    // For regular users, ensure clinicId is not null or undefined before using it
    if (!user.clinicId) {
      throw new Error('Clinic ID is required for non-admin users');
    }
    
    // For regular users, filter by clinicId
    return this.prisma.visit.findMany({
      where: {
        nextReminderDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
        pet: {
          owner: {
            clinicId: user.clinicId,
          },
        },
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        nextReminderDate: 'asc',
      },
      take: 10, // Limit to 10 results for better dashboard performance
    });
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

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.visitDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.visitDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.visitDate = {
        lte: new Date(endDate),
      };
    }

    // Add visit type filter if provided
    if (visitType) {
      whereClause.visitType = visitType;
    }

    // Add search filter using multi-word search logic
    if (search) {
      const searchTerms = search.trim().split(/\s+/); // Split search string into words

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
}
