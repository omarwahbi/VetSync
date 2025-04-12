import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { PrismaService } from '../prisma/prisma.service';

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

  async findAll(user: { clinicId: string }) {
    return this.prisma.owner.findMany({
      where: { clinicId: user.clinicId },
    });
  }

  async findOne(id: string, user: { clinicId: string }) {
    const owner = await this.prisma.owner.findFirst({
      where: {
        id,
        clinicId: user.clinicId,
      },
    });

    if (!owner) {
      throw new NotFoundException(`Owner with ID ${id} not found in your clinic`);
    }

    return owner;
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
