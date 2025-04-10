import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

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
    const pet = await this.prisma.pet.findFirst({
      where: {
        id,
        ownerId,
        owner: {
          clinicId: user.clinicId,
        },
      },
    });

    if (!pet) {
      throw new NotFoundException(`Pet with ID ${id} not found for this owner in your clinic`);
    }

    return pet;
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
