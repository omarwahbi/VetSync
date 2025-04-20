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
import { ClinicProfileModule } from './clinic-profile/clinic-profile.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClinicsModule } from './admin/clinics/clinics.module';
import { UsersModule } from './users/users.module';
import { UsersModule as AdminUsersModule } from './admin/users/users.module';

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
    ClinicProfileModule,
    DashboardModule,
    ClinicsModule,
    UsersModule,
    AdminUsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
