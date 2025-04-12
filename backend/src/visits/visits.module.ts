import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsController, VisitsGlobalController } from './visits.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VisitsController, VisitsGlobalController],
  providers: [VisitsService],
})
export class VisitsModule {}
