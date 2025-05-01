import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicCreateUserDto } from './dto/clinic-create-user.dto';
import { ClinicUpdateUserDto } from './dto/clinic-update-user.dto';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClinicUsersService {
  constructor(private prisma: PrismaService) {}

  async findUsersForClinic(clinicId: string) {
    return this.prisma.user.findMany({
      where: { clinicId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUserInClinic(callerUser: User, createUserDto: ClinicCreateUserDto) {
    // Check if email already exists globally
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create the user with STAFF role and the caller's clinicId
    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: UserRole.STAFF,
        clinicId: callerUser.clinicId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    return newUser;
  }

  async updateUserInClinic(callerUser: User, userIdToUpdate: string, updateDto: ClinicUpdateUserDto) {
    // Fetch user to update
    const userToUpdate = await this.prisma.user.findUnique({
      where: { id: userIdToUpdate },
    });

    if (!userToUpdate) {
      throw new NotFoundException('User not found');
    }

    // Authorization check: Verify the user belongs to the same clinic
    if (userToUpdate.clinicId !== callerUser.clinicId) {
      throw new ForbiddenException('You cannot update users from another clinic');
    }

    // Prevent self-update through this endpoint
    if (userToUpdate.id === callerUser.id) {
      throw new ForbiddenException('You cannot use this endpoint to update your own account');
    }

    // Role promotion check
    if (updateDto.role === UserRole.CLINIC_ADMIN) {
      if (userToUpdate.role !== UserRole.STAFF) {
        throw new BadRequestException('Can only promote STAFF users to CLINIC_ADMIN role');
      }
    }

    // Prepare data to update
    const dataToUpdate: Record<string, any> = {};
    
    if (updateDto.firstName !== undefined) {
      dataToUpdate.firstName = updateDto.firstName;
    }
    
    if (updateDto.lastName !== undefined) {
      dataToUpdate.lastName = updateDto.lastName;
    }
    
    if (updateDto.isActive !== undefined) {
      dataToUpdate.isActive = updateDto.isActive;
    }
    
    if (updateDto.role !== undefined) {
      dataToUpdate.role = updateDto.role;
    }

    // Update the user
    const updatedUser = await this.prisma.user.update({
      where: { id: userIdToUpdate },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    return updatedUser;
  }

  async deleteUserInClinic(callerUser: User, userIdToDelete: string) {
    // Find the user to delete
    const userToDelete = await this.prisma.user.findUnique({
      where: { id: userIdToDelete },
    });

    if (!userToDelete) {
      throw new NotFoundException('User not found');
    }

    // Authorization check: Verify the user belongs to the same clinic
    if (userToDelete.clinicId !== callerUser.clinicId) {
      throw new ForbiddenException('You cannot delete users from another clinic');
    }

    // Prevent self-deletion
    if (userToDelete.id === callerUser.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    // Delete the user
    await this.prisma.user.delete({
      where: { id: userIdToDelete },
    });

    return { success: true, message: 'User deleted successfully' };
  }
} 