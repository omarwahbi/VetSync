"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_utils_1 = require("./date-utils");
const dashboard_utils_1 = require("./dashboard-utils");
let DashboardService = DashboardService_1 = class DashboardService {
    prisma;
    logger = new common_1.Logger(DashboardService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(user) {
        if (user.role === 'ADMIN' && !user.clinicId) {
            const ownerCount = await this.prisma.owner.count();
            const petCount = await this.prisma.pet.count();
            return {
                ownerCount,
                petCount,
                isAdminView: true,
            };
        }
        if (!user.clinicId) {
            throw new Error('Clinic ID is required for non-admin users');
        }
        const clinicId = user.clinicId;
        const clinic = await this.prisma.clinic.findUnique({
            where: { id: clinicId },
            select: { timezone: true },
        });
        const timezone = clinic?.timezone || 'UTC';
        this.logger.debug(`Using timezone: ${timezone} for clinic ${clinicId}`);
        const ownerCount = await this.prisma.owner.count({
            where: { clinicId },
        });
        const petCount = await this.prisma.pet.count({
            where: {
                owner: {
                    clinicId,
                },
            },
        });
        const { start: startDate, end: endDate } = (0, date_utils_1.getClinicFutureDateRange)(30, timezone);
        this.logger.debug(`Clinic timezone (${timezone}) upcoming window: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        const upcomingVaccinationWhere = (0, dashboard_utils_1.createUpcomingVisitsWhereClause)(clinicId, 30, timezone, 'vaccination', undefined);
        const upcomingVaccinationCount = await this.prisma.visit.count({
            where: upcomingVaccinationWhere
        });
        const dueTodayWhereClause = (0, dashboard_utils_1.createDueTodayWhereClause)(clinicId, timezone);
        const { start, end } = (0, date_utils_1.getClinicDateRange)(timezone);
        this.logger.debug(`Clinic (${timezone}) Today boundaries: ${start.toISOString()} to ${end.toISOString()}`);
        const dueTodayCount = await this.prisma.visit.count({
            where: dueTodayWhereClause
        });
        return {
            ownerCount,
            petCount,
            upcomingVaccinationCount,
            dueTodayCount,
            isAdminView: false,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map