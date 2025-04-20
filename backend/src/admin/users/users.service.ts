import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

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
}
