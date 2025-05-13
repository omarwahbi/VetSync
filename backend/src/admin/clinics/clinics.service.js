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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ClinicsService = class ClinicsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createClinic(createDto, user) {
        try {
            return await this.prisma.clinic.create({
                data: {
                    ...createDto,
                    updatedById: user.id,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
                throw new common_1.ConflictException(`Clinic with name "${createDto.name}" already exists`);
            }
            throw new Error(`Failed to create clinic: ${error.message}`);
        }
    }
    async findAllClinics(queryDto) {
        const whereClause = {};
        if (queryDto.search) {
            whereClause.OR = [
                { name: { contains: queryDto.search, mode: 'insensitive' } },
                { address: { contains: queryDto.search, mode: 'insensitive' } },
                { phone: { contains: queryDto.search, mode: 'insensitive' } },
            ];
        }
        if (queryDto.isActive !== undefined) {
            whereClause.isActive = queryDto.isActive;
        }
        const skip = queryDto.page && queryDto.limit
            ? (queryDto.page - 1) * queryDto.limit
            : undefined;
        const take = queryDto.limit || undefined;
        const clinics = await this.prisma.clinic.findMany({
            where: whereClause,
            skip,
            take,
            select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                timezone: true,
                isActive: true,
                canSendReminders: true,
                subscriptionStartDate: true,
                subscriptionEndDate: true,
                reminderMonthlyLimit: true,
                reminderSentThisCycle: true,
                currentCycleStartDate: true,
                createdAt: true,
                updatedAt: true,
                updatedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const clinicsWithCounts = await Promise.all(clinics.map(async (clinic) => {
            const ownerCount = await this.prisma.owner.count({
                where: { clinicId: clinic.id },
            });
            const petCount = await this.prisma.pet.count({
                where: { owner: { clinicId: clinic.id } },
            });
            return {
                ...clinic,
                ownerCount,
                petCount,
            };
        }));
        let totalCount;
        if (queryDto.page && queryDto.limit) {
            totalCount = await this.prisma.clinic.count({ where: whereClause });
        }
        if (totalCount !== undefined && queryDto.limit) {
            return {
                data: clinicsWithCounts,
                meta: {
                    totalCount,
                    page: queryDto.page,
                    limit: queryDto.limit,
                    totalPages: Math.ceil(totalCount / queryDto.limit),
                },
            };
        }
        return clinicsWithCounts;
    }
    async findClinicById(clinicId) {
        try {
            return await this.prisma.clinic.findUniqueOrThrow({
                where: { id: clinicId },
                include: {
                    updatedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    _count: {
                        select: {
                            users: true,
                            owners: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            throw new common_1.NotFoundException(`Clinic with ID ${clinicId} not found`);
        }
    }
    async updateClinicSettings(clinicId, updateDto, user) {
        try {
            await this.findClinicById(clinicId);
            const data = { ...updateDto };
            if (updateDto.subscriptionStartDate) {
                data.reminderSentThisCycle = 0;
                data.currentCycleStartDate = new Date(updateDto.subscriptionStartDate);
            }
            data.updatedById = user.id;
            return this.prisma.clinic.update({
                where: { id: clinicId },
                data,
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new Error(`Failed to update clinic: ${error.message}`);
        }
    }
};
exports.ClinicsService = ClinicsService;
exports.ClinicsService = ClinicsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClinicsService);
//# sourceMappingURL=clinics.service.js.map