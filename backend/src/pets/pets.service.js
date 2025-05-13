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
exports.PetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PetsService = class PetsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllClinicPets(user, filterPetDto) {
        const whereClause = {
            owner: {
                clinicId: user.clinicId,
            },
        };
        if (filterPetDto?.search) {
            const searchTerms = filterPetDto.search.trim().split(/\s+/).slice(0, 5);
            whereClause.AND = (whereClause.AND || []);
            searchTerms.forEach((term) => {
                whereClause.AND.push({
                    OR: [
                        { name: { contains: term, mode: 'insensitive' } },
                        { species: { contains: term, mode: 'insensitive' } },
                        { breed: { contains: term, mode: 'insensitive' } },
                        {
                            owner: {
                                OR: [
                                    { firstName: { contains: term, mode: 'insensitive' } },
                                    { lastName: { contains: term, mode: 'insensitive' } },
                                ],
                            },
                        },
                    ],
                });
            });
        }
        const page = filterPetDto?.page ?? 1;
        const limit = filterPetDto?.limit ?? 20;
        const skip = (page - 1) * limit;
        const totalCount = await this.prisma.pet.count({
            where: whereClause,
        });
        const pets = await this.prisma.pet.findMany({
            where: whereClause,
            skip,
            take: limit,
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
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
            orderBy: { createdAt: 'desc' },
        });
        const totalPages = Math.ceil(totalCount / limit);
        return {
            data: pets,
            meta: {
                totalCount,
                currentPage: page,
                perPage: limit,
                totalPages,
            },
        };
    }
    async create(createPetDto, ownerId, user) {
        const owner = await this.prisma.owner.findFirst({
            where: {
                id: ownerId,
                clinicId: user.clinicId,
            },
        });
        if (!owner) {
            throw new common_1.NotFoundException(`Owner with ID ${ownerId} not found in your clinic`);
        }
        return this.prisma.pet.create({
            data: {
                ...createPetDto,
                ownerId,
                createdById: user.id,
                updatedById: user.id,
            },
        });
    }
    async findAll(ownerId, user, filterPetDto) {
        const owner = await this.prisma.owner.findFirst({
            where: {
                id: ownerId,
                clinicId: user.clinicId,
            },
        });
        if (!owner) {
            throw new common_1.NotFoundException(`Owner with ID ${ownerId} not found in your clinic`);
        }
        const whereClause = {
            ownerId,
            owner: {
                clinicId: user.clinicId,
            },
        };
        const page = filterPetDto?.page ?? 1;
        const limit = filterPetDto?.limit ?? 20;
        const skip = (page - 1) * limit;
        const totalCount = await this.prisma.pet.count({
            where: whereClause,
        });
        const pets = await this.prisma.pet.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
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
        const totalPages = Math.ceil(totalCount / limit);
        return {
            data: pets,
            meta: {
                totalCount,
                currentPage: page,
                perPage: limit,
                totalPages,
            },
        };
    }
    async findOne(id, ownerId, user) {
        try {
            const clinicId = user.clinicId;
            if (!clinicId) {
                throw new common_1.NotFoundException('Clinic ID is required');
            }
            const pet = await this.prisma.pet.findFirstOrThrow({
                where: {
                    id,
                    ownerId,
                    owner: {
                        clinicId,
                    },
                },
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    visits: {
                        orderBy: {
                            visitDate: 'desc',
                        },
                        select: {
                            id: true,
                            visitDate: true,
                            visitType: true,
                            notes: true,
                            nextReminderDate: true,
                            isReminderEnabled: true,
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
            });
            return pet;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Pet with ID ${id} not found for this owner in your clinic`);
            }
            throw error;
        }
    }
    async findOneByPetId(id, user) {
        try {
            const clinicId = user.clinicId;
            if (!clinicId) {
                throw new common_1.NotFoundException('Clinic ID is required');
            }
            const pet = await this.prisma.pet.findFirstOrThrow({
                where: {
                    id,
                    owner: {
                        clinicId,
                    },
                },
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    visits: {
                        orderBy: {
                            visitDate: 'desc',
                        },
                        select: {
                            id: true,
                            visitDate: true,
                            visitType: true,
                            notes: true,
                            nextReminderDate: true,
                            isReminderEnabled: true,
                            price: true,
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
                            createdAt: true,
                            updatedAt: true,
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
            });
            return pet;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Pet with ID ${id} not found in your clinic`);
            }
            throw error;
        }
    }
    async update(id, ownerId, updatePetDto, user) {
        await this.findOne(id, ownerId, user);
        return this.prisma.pet.update({
            where: { id },
            data: {
                ...updatePetDto,
                updatedById: user.id,
            },
        });
    }
    async remove(id, ownerId, user) {
        await this.findOne(id, ownerId, user);
        return this.prisma.pet.delete({
            where: { id },
        });
    }
};
exports.PetsService = PetsService;
exports.PetsService = PetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PetsService);
//# sourceMappingURL=pets.service.js.map