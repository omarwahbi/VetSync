import { PrismaService } from '../prisma/prisma.service';
import { UpdateClinicProfileDto } from './dto/update-clinic-profile.dto';
import { User } from '@prisma/client';
export declare class ClinicProfileService {
    private prisma;
    constructor(prisma: PrismaService);
    getClinicProfile(user: {
        clinicId: string;
    }): Promise<{
        updatedBy: {
            firstName: string | null;
            lastName: string | null;
            id: string;
        } | null;
    } & {
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        timezone: string;
        canSendReminders: boolean;
        subscriptionStartDate: Date | null;
        subscriptionEndDate: Date | null;
        reminderMonthlyLimit: number;
        reminderSentThisCycle: number;
        currentCycleStartDate: Date | null;
        updatedById: string | null;
    }>;
    updateClinicProfile(user: User, updateDto: UpdateClinicProfileDto): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        timezone: string;
        canSendReminders: boolean;
        subscriptionStartDate: Date | null;
        subscriptionEndDate: Date | null;
        reminderMonthlyLimit: number;
        reminderSentThisCycle: number;
        currentCycleStartDate: Date | null;
        updatedById: string | null;
    }>;
}
