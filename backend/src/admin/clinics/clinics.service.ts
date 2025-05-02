import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { AdminClinicListQueryDto } from './dto/admin-clinic-list-query.dto';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class ClinicsService {
  constructor(private prisma: PrismaService) {}

  // New method to create a clinic
  async createClinic(createDto: CreateClinicDto, user: User) {
    try {
      return await this.prisma.clinic.create({
        data: {
          ...createDto,
          updatedById: user.id,
        },
      });
    } catch (error: any) {
      // Handle unique constraint violation (if clinic name is unique)
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        throw new ConflictException(
          `Clinic with name "${createDto.name}" already exists`,
        );
      }
      throw new Error(`Failed to create clinic: ${error.message}`);
    }
  }

  async findAllClinics(queryDto: AdminClinicListQueryDto) {
    const whereClause: Prisma.ClinicWhereInput = {};
    
    // Build search condition
    if (queryDto.search) {
      whereClause.OR = [
        { name: { contains: queryDto.search, mode: 'insensitive' } },
        { address: { contains: queryDto.search, mode: 'insensitive' } },
        { phone: { contains: queryDto.search, mode: 'insensitive' } },
      ];
    }
    
    // Add status filter
    if (queryDto.isActive !== undefined) {
      whereClause.isActive = queryDto.isActive;
    }

    // Calculate pagination if needed
    const skip = queryDto.page && queryDto.limit
      ? (queryDto.page - 1) * queryDto.limit
      : undefined;
    
    const take = queryDto.limit || undefined;

    // Fetch clinics with filters
    const clinics = await this.prisma.clinic.findMany({
      where: whereClause,
      skip,
      take,
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        timezone: true,
        isActive: true,
        canSendReminders: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        reminderMonthlyLimit: true,
        reminderSentThisCycle: true, 
        currentCycleStartDate: true,
        createdAt: true,
        updatedAt: true,
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get counts for owners and pets
    const clinicsWithCounts = await Promise.all(
      clinics.map(async (clinic) => {
        const ownerCount = await this.prisma.owner.count({
          where: { clinicId: clinic.id },
        });
        const petCount = await this.prisma.pet.count({
          where: { owner: { clinicId: clinic.id } },
        });
        return {
          ...clinic,
          ownerCount,
          petCount,
        };
      })
    );
    
    // Get total count for pagination metadata
    let totalCount;
    if (queryDto.page && queryDto.limit) {
      totalCount = await this.prisma.clinic.count({ where: whereClause });
    }
    
    // Return data with pagination metadata if paginating
    if (totalCount !== undefined && queryDto.limit) {
      return {
        data: clinicsWithCounts,
        meta: {
          totalCount,
          page: queryDto.page,
          limit: queryDto.limit,
          totalPages: Math.ceil(totalCount / queryDto.limit),
        },
      };
    }
    
    return clinicsWithCounts;
  }

  async findClinicById(clinicId: string) {
    try {
      return await this.prisma.clinic.findUniqueOrThrow({
        where: { id: clinicId },
        include: {
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              users: true,
              owners: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }
  }

  async updateClinicSettings(clinicId: string, updateDto: any, user: User) {
    try {
      // First check if the clinic exists
      await this.findClinicById(clinicId);
      
      // Prepare data for update
      const data: any = { ...updateDto };
      
      // When subscriptionStartDate is updated, reset cycle fields
      if (updateDto.subscriptionStartDate) {
        data.reminderSentThisCycle = 0;
        data.currentCycleStartDate = new Date(updateDto.subscriptionStartDate);
      }
      
      // Add updatedById to track who made the change
      data.updatedById = user.id;
      
      // Then update the clinic with the provided data
      return this.prisma.clinic.update({
        where: { id: clinicId },
        data,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update clinic: ${error.message}`);
    }
  }
}
