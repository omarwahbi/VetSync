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
exports.VisitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_utils_1 = require("../dashboard/date-utils");
const dashboard_utils_1 = require("../dashboard/dashboard-utils");
let VisitsService = class VisitsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    normalizeDate(dateString) {
        if (!dateString)
            return undefined;
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const normalizedDate = new Date(Date.UTC(year, month, day));
        return normalizedDate;
    }
    async create(createVisitDto, petId, user) {
        const pet = await this.prisma.pet.findFirst({
            where: {
                id: petId,
                owner: {
                    clinicId: user.clinicId,
                },
            },
        });
        if (!pet) {
            throw new common_1.NotFoundException(`Pet with ID ${petId} not found in your clinic`);
        }
        const normalizedData = { ...createVisitDto };
        if (normalizedData.nextReminderDate) {
            const normalizedDate = this.normalizeDate(normalizedData.nextReminderDate);
            if (normalizedDate) {
                normalizedData.nextReminderDate = normalizedDate.toISOString();
            }
        }
        return this.prisma.visit.create({
            data: {
                ...normalizedData,
                petId,
                createdById: user.id,
                updatedById: user.id,
            },
        });
    }
    async findAll(petId, user) {
        const pet = await this.prisma.pet.findFirst({
            where: {
                id: petId,
                owner: {
                    clinicId: user.clinicId,
                },
            },
        });
        if (!pet) {
            throw new common_1.NotFoundException(`Pet with ID ${petId} not found in your clinic`);
        }
        return this.prisma.visit.findMany({
            where: {
                petId,
                pet: {
                    owner: {
                        clinicId: user.clinicId,
                    },
                },
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                updatedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, petId, user) {
        const clinicId = user.clinicId;
        if (!clinicId) {
            throw new common_1.NotFoundException('Clinic ID is required');
        }
        const visit = await this.prisma.visit.findFirst({
            where: {
                id,
                petId,
                pet: {
                    owner: {
                        clinicId,
                    },
                },
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                updatedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!visit) {
            throw new common_1.NotFoundException(`Visit with ID ${id} not found for this pet in your clinic`);
        }
        return visit;
    }
    async update(id, petId, updateVisitDto, user) {
        await this.findOne(id, petId, user);
        const normalizedData = { ...updateVisitDto };
        if (normalizedData.nextReminderDate) {
            const normalizedDate = this.normalizeDate(normalizedData.nextReminderDate);
            if (normalizedDate) {
                normalizedData.nextReminderDate = normalizedDate.toISOString();
            }
        }
        return this.prisma.visit.update({
            where: { id },
            data: {
                ...normalizedData,
                updatedById: user.id,
            },
        });
    }
    async remove(id, petId, user) {
        await this.findOne(id, petId, user);
        return this.prisma.visit.delete({
            where: { id },
        });
    }
    async findUpcoming(user) {
        const today = new Date();
        console.log('Current server time:', today.toISOString());
        let timezone = 'UTC';
        if (user.clinicId) {
            const clinic = await this.prisma.clinic.findUnique({
                where: { id: user.clinicId },
                select: { timezone: true },
            });
            timezone = clinic?.timezone || 'UTC';
        }
        console.log(`Using timezone: ${timezone} for upcoming visits query`);
        if (!user.clinicId && user.role !== 'ADMIN') {
            throw new Error('Clinic ID is required for non-admin users');
        }
        const whereClause = (0, dashboard_utils_1.createUpcomingVisitsWhereClause)(user.clinicId, 30, timezone, undefined, undefined);
        console.log('Upcoming query where clause:', JSON.stringify(whereClause));
        const visitsCount = await this.prisma.visit.count({ where: whereClause });
        console.log(`Found ${visitsCount} upcoming visits`);
        if (visitsCount > 0) {
            const visits = await this.prisma.visit.findMany({
                where: whereClause,
                include: {
                    pet: {
                        select: {
                            id: true,
                            name: true,
                            owner: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    clinic: user.role === 'ADMIN' ? {
                                        select: {
                                            name: true,
                                        },
                                    } : undefined,
                                },
                            },
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    updatedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: {
                    nextReminderDate: 'asc',
                },
                take: 10,
            });
            console.log('First upcoming visit:', visits.length ? JSON.stringify(visits[0]) : 'None found');
            return visits;
        }
        console.log('No upcoming visits found.');
        return [];
    }
    async findAllClinicVisits(user, filterDto) {
        const { page = 1, limit = 20, startDate, endDate, visitType, search } = filterDto;
        const skip = (page - 1) * limit;
        let whereClause = {};
        if (user.role !== 'ADMIN' || user.clinicId) {
            if (user.role !== 'ADMIN' && !user.clinicId) {
                throw new Error('Clinic ID is required for non-admin users');
            }
            if (user.clinicId) {
                whereClause = {
                    pet: {
                        owner: {
                            clinicId: user.clinicId,
                        },
                    },
                };
            }
        }
        if (startDate && endDate) {
            const normalizedStartDate = this.normalizeDate(startDate);
            const normalizedEndDate = this.normalizeDate(endDate);
            if (normalizedEndDate) {
                normalizedEndDate.setUTCHours(23, 59, 59, 999);
            }
            whereClause.visitDate = {
                gte: normalizedStartDate,
                lte: normalizedEndDate,
            };
        }
        else if (startDate) {
            const normalizedStartDate = this.normalizeDate(startDate);
            whereClause.visitDate = {
                gte: normalizedStartDate,
            };
        }
        else if (endDate) {
            const normalizedEndDate = this.normalizeDate(endDate);
            if (normalizedEndDate) {
                normalizedEndDate.setUTCHours(23, 59, 59, 999);
            }
            whereClause.visitDate = {
                lte: normalizedEndDate,
            };
        }
        if (visitType) {
            whereClause.visitType = visitType;
        }
        if (search) {
            const searchTerms = search.trim().split(/\s+/).slice(0, 5);
            whereClause.AND = (whereClause.AND || []);
            searchTerms.forEach(term => {
                whereClause.AND.push({
                    OR: [
                        { pet: { name: { contains: term, mode: 'insensitive' } } },
                        { pet: { owner: { firstName: { contains: term, mode: 'insensitive' } } } },
                        { pet: { owner: { lastName: { contains: term, mode: 'insensitive' } } } },
                        { notes: { contains: term, mode: 'insensitive' } },
                        { visitType: { contains: term, mode: 'insensitive' } },
                    ],
                });
            });
        }
        const totalCount = await this.prisma.visit.count({ where: whereClause });
        const visits = await this.prisma.visit.findMany({
            where: whereClause,
            include: {
                pet: {
                    select: {
                        id: true,
                        name: true,
                        owner: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                updatedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                visitDate: 'desc',
            },
            skip,
            take: limit,
        });
        return {
            data: visits,
            pagination: {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
            },
        };
    }
    async findVisitsDueToday(user, page = 1, limit = 20) {
        const today = new Date();
        console.log('Current server time for due today:', today.toISOString());
        let timezone = 'UTC';
        if (user.clinicId) {
            const clinic = await this.prisma.clinic.findUnique({
                where: { id: user.clinicId },
            });
            timezone = clinic?.timezone || 'UTC';
        }
        console.log(`Using timezone: ${timezone} for due today query`);
        const { start: todayStartUTC, end: todayEndUTC } = (0, date_utils_1.getClinicDateRange)(timezone);
        console.log('Today Start (clinic timezone converted to UTC):', todayStartUTC.toISOString());
        console.log('Today End (clinic timezone converted to UTC):', todayEndUTC.toISOString());
        const skip = (page - 1) * limit;
        let whereClause;
        if (user.role === 'ADMIN' && !user.clinicId) {
            whereClause = (0, dashboard_utils_1.createDueTodayWhereClause)(null, timezone);
        }
        else {
            if (user.role !== 'ADMIN' && !user.clinicId) {
                throw new Error('Clinic ID is required for non-admin users');
            }
            whereClause = (0, dashboard_utils_1.createDueTodayWhereClause)(user.clinicId, timezone);
        }
        console.log('Due today query where clause:', JSON.stringify(whereClause));
        const totalCount = await this.prisma.visit.count({ where: whereClause });
        console.log(`Found ${totalCount} visits due today after applying filters`);
        if (totalCount === 0) {
            return {
                data: [],
                pagination: {
                    totalCount: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            };
        }
        const visits = await this.prisma.visit.findMany({
            where: whereClause,
            include: {
                pet: {
                    select: {
                        id: true,
                        name: true,
                        species: true,
                        breed: true,
                        dob: true,
                        gender: true,
                        owner: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                email: true,
                                address: true,
                                clinicId: true,
                                allowAutomatedReminders: true,
                                clinic: user.role === 'ADMIN' ? {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                } : undefined,
                            },
                        },
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                updatedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                nextReminderDate: 'asc',
            },
            skip,
            take: limit,
        });
        return {
            data: visits,
            pagination: {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
            },
        };
    }
    async getDebugDateInfo() {
        return this.prisma.visit.findMany({
            select: {
                id: true,
                visitType: true,
                nextReminderDate: true,
                petId: true,
                pet: {
                    select: {
                        name: true,
                        owner: {
                            select: {
                                clinicId: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                nextReminderDate: 'desc',
            },
            take: 20,
        });
    }
};
exports.VisitsService = VisitsService;
exports.VisitsService = VisitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VisitsService);
//# sourceMappingURL=visits.service.js.map