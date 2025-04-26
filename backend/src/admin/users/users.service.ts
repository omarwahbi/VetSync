import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUserListQueryDto } from './dto/admin-user-list-query.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // If clinicId is provided, verify it exists
    if (createUserDto.clinicId) {
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: createUserDto.clinicId },
      });

      if (!clinic) {
        throw new BadRequestException('Clinic not found');
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create the user
    const newUser = await this.prisma.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role as Prisma.UserCreateInput['role'],
        isActive: createUserDto.isActive,
        clinicId: createUserDto.clinicId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        clinicId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Return with combined name for API consistency
    return {
      ...newUser,
      name: `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim(),
    };
  }

  async findAllUsers(queryDto: AdminUserListQueryDto) {
    const { search, role, clinicId, isActive, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    // Build the where clause based on filters
    const where: Prisma.UserWhereInput = {};

    // Add search condition if provided
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add role filter if provided
    if (role) {
      where.role = role;
    }

    // Add clinic filter if provided
    if (clinicId) {
      where.clinicId = clinicId;
    }

    // Add active status filter if provided
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get total count
    const totalCount = await this.prisma.user.count({ where });

    // Get paginated users with clinic info
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Add name field for consistency
    const formattedUsers = users.map(user => ({
      ...user,
      password: undefined, // Remove password from result
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    }));

    return {
      data: formattedUsers,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async findUserById(userId: string) {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      });

      // Remove password field for security
      const { password, ...userWithoutPassword } = user;

      // Add name field for consistency
      return {
        ...userWithoutPassword,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
      }
      throw error;
    }
  }

  async updateUser(userId: string, updateDto: AdminUpdateUserDto) {
    // Verify user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if updating email to one that already exists
    if (updateDto.email && updateDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Email is already in use by another account');
      }
    }

    // Verify clinic exists if changing clinic assignment
    if (updateDto.clinicId !== undefined && updateDto.clinicId !== null && updateDto.clinicId !== existingUser.clinicId) {
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: updateDto.clinicId },
      });

      if (!clinic) {
        throw new BadRequestException('Specified clinic does not exist');
      }
    }

    // Setting role to non-ADMIN should only be allowed if there's at least one other ADMIN
    if (existingUser.role === UserRole.ADMIN && 
        updateDto.role && 
        updateDto.role !== UserRole.ADMIN) {
      
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot change the role of the only admin user');
      }
    }

    // Prepare update data
    const updateData: Prisma.UserUpdateInput = {};

    // Only include fields that are provided
    if (updateDto.email !== undefined) updateData.email = updateDto.email;
    if (updateDto.firstName !== undefined) updateData.firstName = updateDto.firstName;
    if (updateDto.lastName !== undefined) updateData.lastName = updateDto.lastName;
    if (updateDto.role !== undefined) updateData.role = updateDto.role;
    if (updateDto.isActive !== undefined) updateData.isActive = updateDto.isActive;
    
    // Handle clinicId update using proper Prisma relation syntax
    if (updateDto.clinicId !== undefined) {
      if (updateDto.clinicId === null) {
        // Disconnect the clinic relation
        updateData.clinic = { disconnect: true };
      } else {
        // Connect to a different clinic
        updateData.clinic = { connect: { id: updateDto.clinicId } };
      }
    }

    // Hash the password if provided
    if (updateDto.password) {
      updateData.password = await bcrypt.hash(updateDto.password, 10);
    }

    // Update the user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        clinic: true,
      },
    });

    // Remove password field for security
    const { password, ...userWithoutPassword } = updatedUser;

    // Add name field for consistency
    return {
      ...userWithoutPassword,
      name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
    };
  }

  async deleteUser(userId: string, adminId: string) {
    // Prevent self-deletion
    if (userId === adminId) {
      throw new ForbiddenException('Administrators cannot delete their own account through this endpoint');
    }

    // Find the user to delete
    const userToDelete = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToDelete) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prevent deleting the last admin
    if (userToDelete.role === UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot delete the only admin user');
      }
    }

    // Delete the user
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }
}
