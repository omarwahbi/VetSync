import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class ReminderService {
    private prisma;
    private configService;
    private schedulerRegistry;
    private readonly logger;
    private twilioClient;
    constructor(prisma: PrismaService, configService: ConfigService, schedulerRegistry: SchedulerRegistry);
    private formatPhoneNumber;
    resetMonthlyReminderCounts(): Promise<void>;
    handleScheduledReminders(): Promise<void>;
}
