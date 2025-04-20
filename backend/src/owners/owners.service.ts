import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterOwnerDto } from './dto/filter-owner.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OwnersService {
  constructor(private prisma: PrismaService) {}

  async create(createOwnerDto: CreateOwnerDto, user: { clinicId: string }) {
    // Process the data to handle empty email values
    const ownerData = { ...createOwnerDto };
    
    // If email is empty string, set it to undefined (which Prisma will store as NULL in DB)
    if (ownerData.email === '') {
      ownerData.email = undefined;
    }
    
    return this.prisma.owner.create({
      data: {
        ...ownerData,
        clinicId: user.clinicId,
      },
    });
  }

  async findAll(user: { clinicId: string }, filterOwnerDto?: FilterOwnerDto) {
    // Build the where clause starting with clinicId
    const whereClause: Prisma.OwnerWhereInput = { 
      clinicId: user.clinicId 
    };

    // Add search functionality if search term is provided
    if (filterOwnerDto?.search) {
      const searchTerms = filterOwnerDto.search.trim().split(/\s+/); // Split search string into words

      // We need ALL search terms to match somewhere (using AND)
      whereClause.AND = (whereClause.AND || []) as Prisma.OwnerWhereInput[]; // Ensure AND is an array
      searchTerms.forEach((term) => {
        // For each term, add an OR condition checking across fields
        (whereClause.AND as Prisma.OwnerWhereInput[]).push({
          // Push OR block for each term
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term, mode: 'insensitive' } },
            { address: { contains: term, mode: 'insensitive' } },
          ],
        });
      });
    }

    return this.prisma.owner.findMany({
      where: whereClause,
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(id: string, user: { clinicId: string }) {
    try {
      const owner = await this.prisma.owner.findFirstOrThrow({
      where: {
        id,
          clinicId: user.clinicId, // Verify ownership by clinic
        },
        include: {
          pets: { // Include the list of pets
            orderBy: { // Order pets by name
              name: 'asc',
            },
            select: { // Select only needed fields for the list view on Owner Detail
              id: true,
              name: true,
              species: true,
              breed: true,
            },
          },
      },
    });

      return owner;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(`Owner with ID ${id} not found in your clinic`);
      }
      throw error;
    }
  }

  async update(id: string, updateOwnerDto: UpdateOwnerDto, user: { clinicId: string }) {
    // First verify the owner exists and belongs to the user's clinic
    await this.findOne(id, user);

    // Process the data to handle empty email values
    const ownerData = { ...updateOwnerDto };
    
    // If email is empty string, set it to undefined (which Prisma will store as NULL in DB)
    if (ownerData.email === '') {
      ownerData.email = undefined;
    }

    // If findOne didn't throw, proceed with update
    return this.prisma.owner.update({
      where: { id },
      data: ownerData,
    });
  }

  async remove(id: string, user: { clinicId: string }) {
    // First verify the owner exists and belongs to the user's clinic
    await this.findOne(id, user);

    // If findOne didn't throw, proceed with deletion
    return this.prisma.owner.delete({
      where: { id },
    });
  }
}
