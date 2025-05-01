import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClinicProfileDto } from './dto/update-clinic-profile.dto';
import { User } from '@prisma/client';

@Injectable()
export class ClinicProfileService {
  constructor(private prisma: PrismaService) {}

  async getClinicProfile(user: { clinicId: string }) {
    try {
      const clinic = await this.prisma.clinic.findUniqueOrThrow({
        where: { id: user.clinicId },
        include: {
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      return clinic;
    } catch (error) {
      throw new NotFoundException('Clinic not found');
    }
  }

  async updateClinicProfile(
    user: User,
    updateDto: UpdateClinicProfileDto,
  ) {
    try {
      const updatedClinic = await this.prisma.clinic.update({
        where: { id: user.clinicId as string },
        data: {
          ...updateDto,
          updatedById: user.id,
        },
      });
      return updatedClinic;
    } catch (error) {
      throw new NotFoundException('Clinic not found or could not be updated');
    }
  }
}
