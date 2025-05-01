import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { ClinicUsersModule } from './clinic-users/clinic-users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          // Default global limit
          ttl: configService.get<number>('THROTTLE_TTL', 60000), // Milliseconds (e.g., 60 seconds)
          limit: configService.get<number>('THROTTLE_LIMIT', 100), // Requests per TTL per IP
        },
      ],
    }),
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
    ClinicUsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
