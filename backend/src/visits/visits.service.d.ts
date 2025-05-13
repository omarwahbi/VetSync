import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterVisitDto } from './dto/filter-visit.dto';
import { Prisma, User } from '@prisma/client';
export declare class VisitsService {
    private prisma;
    constructor(prisma: PrismaService);
    private normalizeDate;
    create(createVisitDto: CreateVisitDto, petId: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        notes: string | null;
        visitDate: Date;
        visitType: string;
        price: Prisma.Decimal | null;
        nextReminderDate: Date | null;
        reminderSent: boolean;
        isReminderEnabled: boolean;
        temperature: number | null;
        weight: number | null;
        weightUnit: string | null;
        heartRate: number | null;
        respiratoryRate: number | null;
        petId: string;
    }>;
    findAll(petId: string, user: {
        clinicId: string;
    }): Promise<({
        updatedBy: {
            firstName: string | null;
            lastName: string | null;
            id: string;
        } | null;
        createdBy: {
            firstName: string | null;
            lastName: string | null;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        notes: string | null;
        visitDate: Date;
        visitType: string;
        price: Prisma.Decimal | null;
        nextReminderDate: Date | null;
        reminderSent: boolean;
        isReminderEnabled: boolean;
        temperature: number | null;
        weight: number | null;
        weightUnit: string | null;
        heartRate: number | null;
        respiratoryRate: number | null;
        petId: string;
    })[]>;
    findOne(id: string, petId: string, user: {
        clinicId?: string | null;
    } | User): Promise<{
        updatedBy: {
            firstName: string | null;
            lastName: string | null;
            id: string;
        } | null;
        createdBy: {
            firstName: string | null;
            lastName: string | null;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        notes: string | null;
        visitDate: Date;
        visitType: string;
        price: Prisma.Decimal | null;
        nextReminderDate: Date | null;
        reminderSent: boolean;
        isReminderEnabled: boolean;
        temperature: number | null;
        weight: number | null;
        weightUnit: string | null;
        heartRate: number | null;
        respiratoryRate: number | null;
        petId: string;
    }>;
    update(id: string, petId: string, updateVisitDto: UpdateVisitDto, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        notes: string | null;
        visitDate: Date;
        visitType: string;
        price: Prisma.Decimal | null;
        nextReminderDate: Date | null;
        reminderSent: boolean;
        isReminderEnabled: boolean;
        temperature: number | null;
        weight: number | null;
        weightUnit: string | null;
        heartRate: number | null;
        respiratoryRate: number | null;
        petId: string;
    }>;
    remove(id: string, petId: string, user: {
        clinicId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        notes: string | null;
        visitDate: Date;
        visitType: string;
        price: Prisma.Decimal | null;
        nextReminderDate: Date | null;
        reminderSent: boolean;
        isReminderEnabled: boolean;
        temperature: number | null;
        weight: number | null;
        weightUnit: string | null;
        heartRate: number | null;
        respiratoryRate: number | null;
        petId: string;
    }>;
    findUpcoming(user: {
        clinicId?: string | null;
        role?: string;
    }): Promise<({
        pet: {
            owner: {
                clinic: {
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
                };
                firstName: string;
                lastName: string;
            };
            name: string;
            id: string;
        };
        updatedBy: {
            firstName: string | null;
            lastName: string | null;
            id: string;
        } | null;
        createdBy: {
            firstName: string | null;
            lastName: string | null;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        notes: string | null;
        visitDate: Date;
        visitType: string;
        price: Prisma.Decimal | null;
        nextReminderDate: Date | null;
        reminderSent: boolean;
        isReminderEnabled: boolean;
        temperature: number | null;
        weight: number | null;
        weightUnit: string | null;
        heartRate: number | null;
        respiratoryRate: number | null;
        petId: string;
    })[]>;
    findAllClinicVisits(user: {
        clinicId?: string | null;
        role?: string;
    }, filterDto: FilterVisitDto): Promise<{
        data: ({
            pet: {
                owner: {
                    firstName: string;
                    lastName: string;
                    id: string;
                };
                name: string;
                id: string;
            };
            updatedBy: {
                firstName: string | null;
                lastName: string | null;
                id: string;
            } | null;
            createdBy: {
                firstName: string | null;
                lastName: string | null;
                id: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            updatedById: string | null;
            createdById: string | null;
            notes: string | null;
            visitDate: Date;
            visitType: string;
            price: Prisma.Decimal | null;
            nextReminderDate: Date | null;
            reminderSent: boolean;
            isReminderEnabled: boolean;
            temperature: number | null;
            weight: number | null;
            weightUnit: string | null;
            heartRate: number | null;
            respiratoryRate: number | null;
            petId: string;
        })[];
        pagination: {
            totalCount: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findVisitsDueToday(user: {
        clinicId?: string | null;
        role?: string;
    }, page?: number, limit?: number): Promise<{
        data: ({
            pet: {
                owner: {
                    clinic: {
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
                    };
                    email: string | null;
                    clinicId: string;
                    firstName: string;
                    lastName: string;
                    id: string;
                    address: string | null;
                    phone: string | null;
                    allowAutomatedReminders: boolean;
                };
                name: string;
                id: string;
                species: string | null;
                breed: string | null;
                dob: Date | null;
                gender: string | null;
            };
            updatedBy: {
                firstName: string | null;
                lastName: string | null;
                id: string;
            } | null;
            createdBy: {
                firstName: string | null;
                lastName: string | null;
                id: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            updatedById: string | null;
            createdById: string | null;
            notes: string | null;
            visitDate: Date;
            visitType: string;
            price: Prisma.Decimal | null;
            nextReminderDate: Date | null;
            reminderSent: boolean;
            isReminderEnabled: boolean;
            temperature: number | null;
            weight: number | null;
            weightUnit: string | null;
            heartRate: number | null;
            respiratoryRate: number | null;
            petId: string;
        })[];
        pagination: {
            totalCount: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getDebugDateInfo(): Promise<{
        pet: {
            owner: {
                clinicId: string;
            };
            name: string;
        };
        id: string;
        visitType: string;
        nextReminderDate: Date | null;
        petId: string;
    }[]>;
}
