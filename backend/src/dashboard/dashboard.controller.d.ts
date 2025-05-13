import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardStats(req: {
        user: any;
    }): Promise<{
        ownerCount: number;
        petCount: number;
        isAdminView: boolean;
        upcomingVaccinationCount?: undefined;
        dueTodayCount?: undefined;
    } | {
        ownerCount: number;
        petCount: number;
        upcomingVaccinationCount: number;
        dueTodayCount: number;
        isAdminView: boolean;
    }>;
}
