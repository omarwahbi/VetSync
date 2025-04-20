import { Module } from '@nestjs/common';
import { ClinicProfileController } from './clinic-profile.controller';
import { ClinicProfileService } from './clinic-profile.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicProfileController],
  providers: [ClinicProfileService],
  exports: [ClinicProfileService],
})
export class ClinicProfileModule {}
