import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterOwnerDto } from './dto/filter-owner.dto';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class OwnersService {
  constructor(private prisma: PrismaService) { }

  async create(createOwnerDto: CreateOwnerDto, user: User) {
    try {
      // Process the data to handle empty email values
      const ownerData = { ...createOwnerDto };

      // If email is empty string, set it to undefined (which Prisma will store as NULL in DB)
      if (ownerData.email === '') {
        ownerData.email = undefined;
      }

      // Create a clean data object for Prisma that separates fields that might need special handling
      const createData: any = {
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        phone: ownerData.phone,
        clinicId: user.clinicId as string,
        createdById: user.id,
        updatedById: user.id
      };

      // Only add email if it's defined
      if (ownerData.email !== undefined) {
        createData.email = ownerData.email;
      }

      // Only add address if it's defined
      if (ownerData.address !== undefined) {
        createData.address = ownerData.address;
      }

      // Only add allowAutomatedReminders if it's defined
      if (ownerData.allowAutomatedReminders !== undefined) {
        createData.allowAutomatedReminders = ownerData.allowAutomatedReminders;
      }

      return await this.prisma.owner.create({
        data: createData
      });
    } catch (error) {
      // Handle unique constraint violations (P2002)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Check if the error is related to the phone field
        const target = error.meta?.target as string[] || [];
        if (target.includes('phone')) {
          throw new ConflictException('Phone number already registered for another owner in this clinic');
        }
      }
      throw error;
    }
  }

  async findAll(user: { clinicId: string }, filterOwnerDto?: FilterOwnerDto) {
    // Build the where clause starting with clinicId
    const whereClause: Prisma.OwnerWhereInput = {
      clinicId: user.clinicId
    };

    // Add search functionality if search term is provided
    if (filterOwnerDto?.search) {
      // Split search string into words and limit to maximum 5 terms for performance
      const searchTerms = filterOwnerDto.search.trim().split(/\s+/).slice(0, 5);

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

    // Calculate pagination parameters
    const page = filterOwnerDto?.page ?? 1;
    const limit = filterOwnerDto?.limit ?? 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await this.prisma.owner.count({
      where: whereClause,
    });

    // Fetch the paginated data
    const owners = await this.prisma.owner.findMany({
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
      data: owners,
      meta: {
        totalCount,
        currentPage: page,
        perPage: limit,
        totalPages,
      },
    };
  }

  async findOne(id: string, user: { clinicId?: string | null } | User) {
    try {
      // Safely get the clinicId, making sure it's a string
      const clinicId = user.clinicId;

      if (!clinicId) {
        throw new NotFoundException('Clinic ID is required');
      }

      const owner = await this.prisma.owner.findFirstOrThrow({
        where: {
          id,
          clinicId, // Verify ownership by clinic
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

      return owner;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Owner with ID ${id} not found in your clinic`);
      }
      throw error;
    }
  }

  async update(id: string, updateOwnerDto: UpdateOwnerDto, user: User) {
    try {
      // First verify the owner exists and belongs to the user's clinic
      await this.findOne(id, user);

      // Process the data to handle empty values
      const ownerData = { ...updateOwnerDto };
      const updateData: any = { updatedById: user.id };

      // Only add defined fields to the update object
      if ('firstName' in ownerData) updateData.firstName = ownerData.firstName;
      if ('lastName' in ownerData) updateData.lastName = ownerData.lastName;
      if ('phone' in ownerData) updateData.phone = ownerData.phone;
      
      // Handle email - set to null if empty string
      if ('email' in ownerData) {
        if (ownerData.email === '') {
          updateData.email = null;
        } else {
          updateData.email = ownerData.email;
        }
      }
      
      // Add remaining fields if present
      if ('address' in ownerData) updateData.address = ownerData.address;
      if ('allowAutomatedReminders' in ownerData) updateData.allowAutomatedReminders = ownerData.allowAutomatedReminders;

      // If findOne didn't throw, proceed with update
      return await this.prisma.owner.update({
        where: { id },
        data: updateData
      });
    } catch (error) {
      // Handle unique constraint violations (P2002)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Check if the error is related to the phone field
        const target = error.meta?.target as string[] || [];
        if (target.includes('phone')) {
          throw new ConflictException('Phone number already registered for another owner in this clinic');
        }
      }
      throw error;
    }
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
