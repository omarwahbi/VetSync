import { Module } from '@nestjs/common';
import { ClinicUsersController } from './clinic-users.controller';
import { ClinicUsersService } from './clinic-users.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicUsersController],
  providers: [ClinicUsersService],
})
export class ClinicUsersModule {} 