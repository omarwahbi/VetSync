import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterPetDto } from './dto/filter-pet.dto';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) { }

  // New method for clinic-wide pet search
  async findAllClinicPets(
    user: { clinicId: string },
    filterPetDto?: FilterPetDto,
  ) {
    // Build the where clause starting with clinic filter
    const whereClause: Prisma.PetWhereInput = {
      owner: {
        clinicId: user.clinicId,
      },
    };

    // Add search functionality if search term is provided
    if (filterPetDto?.search) {
      // Split search string into words and limit to maximum 5 terms for performance
      const searchTerms = filterPetDto.search.trim().split(/\s+/).slice(0, 5);

      // We need ALL search terms to match somewhere (using AND)
      whereClause.AND = (whereClause.AND || []) as Prisma.PetWhereInput[]; // Ensure AND is an array
      searchTerms.forEach((term) => {
        // For each term, add an OR condition checking across fields
        (whereClause.AND as Prisma.PetWhereInput[]).push({
          // Push OR block for each term
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { species: { contains: term, mode: 'insensitive' } },
            { breed: { contains: term, mode: 'insensitive' } },
            // Search on Owner name as well
            {
              owner: {
                OR: [
                  { firstName: { contains: term, mode: 'insensitive' } },
                  { lastName: { contains: term, mode: 'insensitive' } },
                ],
              },
            },
          ],
        });
      });
    }

    // Calculate pagination parameters
    const page = filterPetDto?.page ?? 1;
    const limit = filterPetDto?.limit ?? 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await this.prisma.pet.count({
      where: whereClause,
    });

    // Fetch the paginated pets with their owners
    const pets = await this.prisma.pet.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Return structured response with pagination metadata
    return {
      data: pets,
      meta: {
        totalCount,
        currentPage: page,
        perPage: limit,
        totalPages,
      },
    };
  }

  async create(createPetDto: CreatePetDto, ownerId: string, user: User) {
    // First verify the owner exists and belongs to the user's clinic
    const owner = await this.prisma.owner.findFirst({
      where: {
        id: ownerId,
        clinicId: user.clinicId as string,
      },
    });

    if (!owner) {
      throw new NotFoundException(`Owner with ID ${ownerId} not found in your clinic`);
    }

    // Create pet for the verified owner
    return this.prisma.pet.create({
      data: {
        ...createPetDto,
        ownerId,
        createdById: user.id,
        updatedById: user.id,
      },
    });
  }

  async findAll(
    ownerId: string,
    user: { clinicId: string },
    filterPetDto?: FilterPetDto,
  ) {
    // First verify the owner exists and belongs to the user's clinic
    const owner = await this.prisma.owner.findFirst({
      where: {
        id: ownerId,
        clinicId: user.clinicId,
      },
    });

    if (!owner) {
      throw new NotFoundException(
        `Owner with ID ${ownerId} not found in your clinic`,
      );
    }

    // Define the where clause for finding pets
    const whereClause = {
      ownerId,
      owner: {
        clinicId: user.clinicId,
      },
    };

    // Calculate pagination parameters
    const page = filterPetDto?.page ?? 1;
    const limit = filterPetDto?.limit ?? 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await this.prisma.pet.count({
      where: whereClause,
    });

    // Find all pets for the verified owner with pagination
    const pets = await this.prisma.pet.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Return structured response with pagination metadata
    return {
      data: pets,
      meta: {
        totalCount,
        currentPage: page,
        perPage: limit,
        totalPages,
      },
    };
  }

  async findOne(
    id: string,
    ownerId: string,
    user: { clinicId?: string | null } | User,
  ) {
    try {
      // Safely get the clinicId
      const clinicId = user.clinicId;
      
      if (!clinicId) {
        throw new NotFoundException('Clinic ID is required');
      }
      
      const pet = await this.prisma.pet.findFirstOrThrow({
        where: {
          id,
          ownerId,
          owner: {
            clinicId,
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          visits: {
            orderBy: {
              visitDate: 'desc',
            },
            select: {
              id: true,
              visitDate: true,
              visitType: true,
              notes: true,
              nextReminderDate: true,
              isReminderEnabled: true,
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
      });

      return pet;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Pet with ID ${id} not found for this owner in your clinic`,
        );
      }
      throw error;
    }
  }

  async findOneByPetId(id: string, user: { clinicId?: string | null } | User) {
    try {
      // Safely get the clinicId
      const clinicId = user.clinicId;
      
      if (!clinicId) {
        throw new NotFoundException('Clinic ID is required');
      }
      
      const pet = await this.prisma.pet.findFirstOrThrow({
        where: {
          id,
          owner: {
            clinicId,
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          visits: {
            orderBy: {
              visitDate: 'desc',
            },
            select: {
              id: true,
              visitDate: true,
              visitType: true,
              notes: true,
              nextReminderDate: true,
              isReminderEnabled: true,
              price: true,
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
              createdAt: true,
              updatedAt: true,
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
      });
      
      return pet;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Pet with ID ${id} not found in your clinic`,
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    ownerId: string,
    updatePetDto: UpdatePetDto,
    user: User,
  ) {
    // First verify the pet exists and belongs to the owner and clinic
    await this.findOne(id, ownerId, user);

    // If findOne didn't throw, proceed with update
    return this.prisma.pet.update({
      where: { id },
      data: {
        ...updatePetDto,
        updatedById: user.id,
      },
    });
  }

  async remove(id: string, ownerId: string, user: { clinicId: string }) {
    // First verify the pet exists and belongs to the owner and clinic
    await this.findOne(id, ownerId, user);

    // If findOne didn't throw, proceed with deletion
    return this.prisma.pet.delete({
      where: { id },
    });
  }
}
