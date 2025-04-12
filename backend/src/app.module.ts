import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OwnersModule } from './owners/owners.module';
import { PetsModule } from './pets/pets.module';
import { VisitsModule } from './visits/visits.module';
import { ReminderModule } from './reminder/reminder.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    OwnersModule,
    PetsModule,
    VisitsModule,
    ReminderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
