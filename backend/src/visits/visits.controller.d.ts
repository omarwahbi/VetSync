import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { FilterVisitDto } from './dto/filter-visit.dto';
export declare class VisitsController {
    private readonly visitsService;
    constructor(visitsService: VisitsService);
    create(createVisitDto: CreateVisitDto, petId: string, req: {
        user: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        notes: string | null;
        visitDate: Date;
        visitType: string;
        price: import("@prisma/client/runtime/library").Decimal | null;
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
    findAll(petId: string, req: {
        user: any;
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
        price: import("@prisma/client/runtime/library").Decimal | null;
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
    findOne(id: string, petId: string, req: {
        user: any;
    }): Promise<{
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
        price: import("@prisma/client/runtime/library").Decimal | null;
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
    update(id: string, petId: string, updateVisitDto: UpdateVisitDto, req: {
        user: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        notes: string | null;
        visitDate: Date;
        visitType: string;
        price: import("@prisma/client/runtime/library").Decimal | null;
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
    remove(id: string, petId: string, req: {
        user: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        notes: string | null;
        visitDate: Date;
        visitType: string;
        price: import("@prisma/client/runtime/library").Decimal | null;
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
}
export declare class VisitsGlobalController {
    private readonly visitsService;
    constructor(visitsService: VisitsService);
    findUpcoming(req: {
        user: any;
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
        price: import("@prisma/client/runtime/library").Decimal | null;
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
    findAllClinicVisits(req: {
        user: any;
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
            price: import("@prisma/client/runtime/library").Decimal | null;
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
    findVisitsDueToday(req: {
        user: any;
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
            price: import("@prisma/client/runtime/library").Decimal | null;
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
    debugDates(): Promise<{
        currentServerTime: string;
        todayDateOnly: string;
        todayStart: string;
        todayEnd: string;
        visits: {
            id: string;
            visitType: string;
            petId: string;
            petName: string;
            clinicId: string;
            nextReminderDate: string | undefined;
            isToday: boolean;
        }[];
    }>;
}
