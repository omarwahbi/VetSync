import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getStats(user: {
        clinicId?: string | null;
        role?: string;
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
