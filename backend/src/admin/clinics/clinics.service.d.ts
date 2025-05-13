import { PrismaService } from '../../prisma/prisma.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { AdminClinicListQueryDto } from './dto/admin-clinic-list-query.dto';
import { User } from '@prisma/client';
export declare class ClinicsService {
    private prisma;
    constructor(prisma: PrismaService);
    createClinic(createDto: CreateClinicDto, user: User): Promise<{
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
    findAllClinics(queryDto: AdminClinicListQueryDto): Promise<{
        ownerCount: number;
        petCount: number;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            users: number;
        };
        address: string | null;
        phone: string | null;
        timezone: string;
        canSendReminders: boolean;
        subscriptionStartDate: Date | null;
        subscriptionEndDate: Date | null;
        reminderMonthlyLimit: number;
        reminderSentThisCycle: number;
        currentCycleStartDate: Date | null;
        updatedBy: {
            firstName: string | null;
            lastName: string | null;
            id: string;
        } | null;
    }[] | {
        data: {
            ownerCount: number;
            petCount: number;
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            _count: {
                users: number;
            };
            address: string | null;
            phone: string | null;
            timezone: string;
            canSendReminders: boolean;
            subscriptionStartDate: Date | null;
            subscriptionEndDate: Date | null;
            reminderMonthlyLimit: number;
            reminderSentThisCycle: number;
            currentCycleStartDate: Date | null;
            updatedBy: {
                firstName: string | null;
                lastName: string | null;
                id: string;
            } | null;
        }[];
        meta: {
            totalCount: any;
            page: number | undefined;
            limit: number;
            totalPages: number;
        };
    }>;
    findClinicById(clinicId: string): Promise<{
        _count: {
            users: number;
            owners: number;
        };
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
    updateClinicSettings(clinicId: string, updateDto: any, user: User): Promise<{
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
