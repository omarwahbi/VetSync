import { ClinicProfileService } from './clinic-profile.service';
import { UpdateClinicProfileDto } from './dto/update-clinic-profile.dto';
export declare class ClinicProfileController {
    private readonly clinicProfileService;
    constructor(clinicProfileService: ClinicProfileService);
    getClinicProfile(req: {
        user: any;
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
    updateClinicProfile(req: {
        user: any;
    }, updateClinicProfileDto: UpdateClinicProfileDto): Promise<{
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
