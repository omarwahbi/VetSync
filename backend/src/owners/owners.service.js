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
exports.OwnersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let OwnersService = class OwnersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createOwnerDto, user) {
        try {
            const ownerData = { ...createOwnerDto };
            if (ownerData.email === '') {
                ownerData.email = undefined;
            }
            const createData = {
                firstName: ownerData.firstName,
                lastName: ownerData.lastName,
                phone: ownerData.phone,
                clinicId: user.clinicId,
                createdById: user.id,
                updatedById: user.id
            };
            if (ownerData.email !== undefined) {
                createData.email = ownerData.email;
            }
            if (ownerData.address !== undefined) {
                createData.address = ownerData.address;
            }
            if (ownerData.allowAutomatedReminders !== undefined) {
                createData.allowAutomatedReminders = ownerData.allowAutomatedReminders;
            }
            return await this.prisma.owner.create({
                data: createData
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const target = error.meta?.target || [];
                if (target.includes('phone')) {
                    throw new common_1.ConflictException('Phone number already registered for another owner in this clinic');
                }
            }
            throw error;
        }
    }
    async findAll(user, filterOwnerDto) {
        const whereClause = {
            clinicId: user.clinicId
        };
        if (filterOwnerDto?.search) {
            const searchTerms = filterOwnerDto.search.trim().split(/\s+/).slice(0, 5);
            whereClause.AND = (whereClause.AND || []);
            searchTerms.forEach((term) => {
                whereClause.AND.push({
                    OR: [
                        { firstName: { contains: term, mode: 'insensitive' } },
                        { lastName: { contains: term, mode: 'insensitive' } },
                        { email: { contains: term, mode: 'insensitive' } },
                        { phone: { contains: term, mode: 'insensitive' } },
                        { address: { contains: term, mode: 'insensitive' } },
                    ],
                });
            });
        }
        const page = filterOwnerDto?.page ?? 1;
        const limit = filterOwnerDto?.limit ?? 20;
        const skip = (page - 1) * limit;
        const totalCount = await this.prisma.owner.count({
            where: whereClause,
        });
        const owners = await this.prisma.owner.findMany({
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
            data: owners,
            meta: {
                totalCount,
                currentPage: page,
                perPage: limit,
                totalPages,
            },
        };
    }
    async findOne(id, user) {
        try {
            const clinicId = user.clinicId;
            if (!clinicId) {
                throw new common_1.NotFoundException('Clinic ID is required');
            }
            const owner = await this.prisma.owner.findFirstOrThrow({
                where: {
                    id,
                    clinicId,
                },
                include: {
                    pets: {
                        orderBy: {
                            name: 'asc',
                        },
                        select: {
                            id: true,
                            name: true,
                            species: true,
                            breed: true,
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
            return owner;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new common_1.NotFoundException(`Owner with ID ${id} not found in your clinic`);
            }
            throw error;
        }
    }
    async update(id, updateOwnerDto, user) {
        try {
            await this.findOne(id, user);
            const ownerData = { ...updateOwnerDto };
            const updateData = { updatedById: user.id };
            if ('firstName' in ownerData)
                updateData.firstName = ownerData.firstName;
            if ('lastName' in ownerData)
                updateData.lastName = ownerData.lastName;
            if ('phone' in ownerData)
                updateData.phone = ownerData.phone;
            if ('email' in ownerData) {
                if (ownerData.email === '') {
                    updateData.email = null;
                }
                else {
                    updateData.email = ownerData.email;
                }
            }
            if ('address' in ownerData)
                updateData.address = ownerData.address;
            if ('allowAutomatedReminders' in ownerData)
                updateData.allowAutomatedReminders = ownerData.allowAutomatedReminders;
            return await this.prisma.owner.update({
                where: { id },
                data: updateData
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const target = error.meta?.target || [];
                if (target.includes('phone')) {
                    throw new common_1.ConflictException('Phone number already registered for another owner in this clinic');
                }
            }
            throw error;
        }
    }
    async remove(id, user) {
        await this.findOne(id, user);
        return this.prisma.owner.delete({
            where: { id },
        });
    }
};
exports.OwnersService = OwnersService;
exports.OwnersService = OwnersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OwnersService);
//# sourceMappingURL=owners.service.js.map