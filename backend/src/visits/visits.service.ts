import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  async create(createVisitDto: CreateVisitDto, petId: string, user: { clinicId: string }) {
    // First verify the pet exists and belongs to the user's clinic
    const pet = await this.prisma.pet.findFirst({
      where: {
        id: petId,
        owner: {
          clinicId: user.clinicId,
        },
      },
    });

    if (!pet) {
      throw new NotFoundException(`Pet with ID ${petId} not found in your clinic`);
    }

    // Create visit for the verified pet
    return this.prisma.visit.create({
      data: {
        ...createVisitDto,
        petId,
      },
    });
  }

  async findAll(petId: string, user: { clinicId: string }) {
    // First verify the pet exists and belongs to the user's clinic
    const pet = await this.prisma.pet.findFirst({
      where: {
        id: petId,
        owner: {
          clinicId: user.clinicId,
        },
      },
    });

    if (!pet) {
      throw new NotFoundException(`Pet with ID ${petId} not found in your clinic`);
    }

    // Find all visits for the verified pet
    return this.prisma.visit.findMany({
      where: {
        petId,
        pet: {
          owner: {
            clinicId: user.clinicId,
          },
        },
      },
    });
  }

  async findOne(id: string, petId: string, user: { clinicId: string }) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        id,
        petId,
        pet: {
          owner: {
            clinicId: user.clinicId,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException(`Visit with ID ${id} not found for this pet in your clinic`);
    }

    return visit;
  }

  async update(id: string, petId: string, updateVisitDto: UpdateVisitDto, user: { clinicId: string }) {
    // First verify the visit exists and belongs to the pet and clinic
    await this.findOne(id, petId, user);

    // If findOne didn't throw, proceed with update
    return this.prisma.visit.update({
      where: { id },
      data: updateVisitDto,
    });
  }

  async remove(id: string, petId: string, user: { clinicId: string }) {
    // First verify the visit exists and belongs to the pet and clinic
    await this.findOne(id, petId, user);

    // If findOne didn't throw, proceed with deletion
    return this.prisma.visit.delete({
      where: { id },
    });
  }
}
