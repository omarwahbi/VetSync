import { ClinicsService } from './clinics.service';
import { UpdateClinicSettingsDto } from './dto/update-clinic-settings.dto';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { AdminClinicListQueryDto } from './dto/admin-clinic-list-query.dto';
export declare class ClinicsController {
    private readonly clinicsService;
    constructor(clinicsService: ClinicsService);
    createClinic(createClinicDto: CreateClinicDto, req: any): Promise<{
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
    findClinicById(id: string): Promise<{
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
    updateClinicSettings(id: string, updateClinicSettingsDto: UpdateClinicSettingsDto, req: any): Promise<{
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
