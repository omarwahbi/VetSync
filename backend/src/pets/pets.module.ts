import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController, PetsTopLevelController } from './pets.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PetsController, PetsTopLevelController],
  providers: [PetsService],
})
export class PetsModule {}
