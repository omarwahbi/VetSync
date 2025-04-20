import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterPetDto } from './dto/filter-pet.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  // New method for clinic-wide pet search
  async findAllClinicPets(user: { clinicId: string }, filterPetDto?: FilterPetDto) {
    // Build the where clause starting with clinic filter
    const whereClause: Prisma.PetWhereInput = {
      owner: {
        clinicId: user.clinicId,
      },
    };

    // Add search functionality if search term is provided
    if (filterPetDto?.search) {
      const searchTerms = filterPetDto.search.trim().split(/\s+/); // Split search string into words

      // We need ALL search terms to match somewhere (using AND)
      whereClause.AND = (whereClause.AND || []) as Prisma.PetWhereInput[]; // Ensure AND is an array
      searchTerms.forEach(term => {
        // For each term, add an OR condition checking across fields
        (whereClause.AND as Prisma.PetWhereInput[]).push({ // Push OR block for each term
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

    // Return the filtered pets with their owners
    return this.prisma.pet.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(createPetDto: CreatePetDto, ownerId: string, user: { clinicId: string }) {
    // First verify the owner exists and belongs to the user's clinic
    const owner = await this.prisma.owner.findFirst({
      where: {
        id: ownerId,
        clinicId: user.clinicId,
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
      },
    });
  }

  async findAll(ownerId: string, user: { clinicId: string }) {
    // First verify the owner exists and belongs to the user's clinic
    const owner = await this.prisma.owner.findFirst({
      where: {
        id: ownerId,
        clinicId: user.clinicId,
      },
    });

    if (!owner) {
      throw new NotFoundException(`Owner with ID ${ownerId} not found in your clinic`);
    }

    // Find all pets for the verified owner
    return this.prisma.pet.findMany({
      where: {
        ownerId,
        owner: {
          clinicId: user.clinicId,
        },
      },
    });
  }

  async findOne(id: string, ownerId: string, user: { clinicId: string }) {
    try {
      const pet = await this.prisma.pet.findFirstOrThrow({
      where: {
        id,
        ownerId,
        owner: {
          clinicId: user.clinicId,
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
        },
      });

      return pet;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(`Pet with ID ${id} not found for this owner in your clinic`);
    }
      throw error;
    }
  }

  // New method to get pet directly by ID (without owner context)
  async findOneByPetId(id: string, user: { clinicId: string }) {
    try {
      const pet = await this.prisma.pet.findFirstOrThrow({
        where: {
          id,
          owner: {
            clinicId: user.clinicId,
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
        },
      });

    return pet;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Pet with ID ${id} not found in your clinic`);
      }
      throw error;
    }
  }

  async update(id: string, ownerId: string, updatePetDto: UpdatePetDto, user: { clinicId: string }) {
    // First verify the pet exists and belongs to the owner and clinic
    await this.findOne(id, ownerId, user);

    // If findOne didn't throw, proceed with update
    return this.prisma.pet.update({
      where: { id },
      data: updatePetDto,
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
