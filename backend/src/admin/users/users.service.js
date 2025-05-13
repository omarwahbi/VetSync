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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcrypt");
const client_1 = require("@prisma/client");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createUser(createUserDto) {
        const lowerCaseEmail = createUserDto.email.toLowerCase();
        const existingUser = await this.prisma.user.findUnique({
            where: { email: lowerCaseEmail },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        if (createUserDto.clinicId) {
            const clinic = await this.prisma.clinic.findUnique({
                where: { id: createUserDto.clinicId },
            });
            if (!clinic) {
                throw new common_1.BadRequestException('Clinic not found');
            }
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const newUser = await this.prisma.user.create({
            data: {
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                email: lowerCaseEmail,
                password: hashedPassword,
                role: createUserDto.role,
                isActive: createUserDto.isActive,
                clinicId: createUserDto.clinicId,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
                clinicId: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return {
            ...newUser,
            name: `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim(),
        };
    }
    async findAllUsers(queryDto) {
        const { search, role, clinicId, isActive, page = 1, limit = 10 } = queryDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role) {
            where.role = role;
        }
        if (clinicId) {
            where.clinicId = clinicId;
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        const totalCount = await this.prisma.user.count({ where });
        const users = await this.prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                clinic: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        const formattedUsers = users.map(user => ({
            ...user,
            password: undefined,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        }));
        return {
            data: formattedUsers,
            meta: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
            },
        };
    }
    async findUserById(userId) {
        try {
            const user = await this.prisma.user.findUniqueOrThrow({
                where: { id: userId },
                include: {
                    clinic: {
                        select: {
                            id: true,
                            name: true,
                            isActive: true,
                        },
                    },
                },
            });
            const { password, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new common_1.NotFoundException(`User with ID ${userId} not found`);
                }
            }
            throw error;
        }
    }
    async updateUser(userId, updateDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        if (updateDto.email && updateDto.email !== existingUser.email) {
            const lowerCaseEmail = updateDto.email.toLowerCase();
            const emailExists = await this.prisma.user.findUnique({
                where: { email: lowerCaseEmail },
            });
            if (emailExists) {
                throw new common_1.ConflictException('Email is already in use by another account');
            }
            updateDto.email = lowerCaseEmail;
        }
        if (updateDto.clinicId !== undefined && updateDto.clinicId !== null && updateDto.clinicId !== existingUser.clinicId) {
            const clinic = await this.prisma.clinic.findUnique({
                where: { id: updateDto.clinicId },
            });
            if (!clinic) {
                throw new common_1.BadRequestException('Specified clinic does not exist');
            }
        }
        if (existingUser.role === client_1.UserRole.ADMIN &&
            updateDto.role &&
            updateDto.role !== client_1.UserRole.ADMIN) {
            const adminCount = await this.prisma.user.count({
                where: { role: client_1.UserRole.ADMIN },
            });
            if (adminCount <= 1) {
                throw new common_1.ForbiddenException('Cannot change the role of the only admin user');
            }
        }
        const updateData = {};
        if (updateDto.email !== undefined)
            updateData.email = updateDto.email;
        if (updateDto.firstName !== undefined)
            updateData.firstName = updateDto.firstName;
        if (updateDto.lastName !== undefined)
            updateData.lastName = updateDto.lastName;
        if (updateDto.role !== undefined)
            updateData.role = updateDto.role;
        if (updateDto.isActive !== undefined)
            updateData.isActive = updateDto.isActive;
        if (updateDto.clinicId !== undefined) {
            if (updateDto.clinicId === null) {
                updateData.clinic = { disconnect: true };
            }
            else {
                updateData.clinic = { connect: { id: updateDto.clinicId } };
            }
        }
        if (updateDto.password) {
            updateData.password = await bcrypt.hash(updateDto.password, 10);
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                clinic: true,
            },
        });
        const { password, ...userWithoutPassword } = updatedUser;
        return {
            ...userWithoutPassword,
            name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
        };
    }
    async deleteUser(userId, adminId) {
        if (userId === adminId) {
            throw new common_1.ForbiddenException('Administrators cannot delete their own account through this endpoint');
        }
        const userToDelete = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!userToDelete) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        if (userToDelete.role === client_1.UserRole.ADMIN) {
            const adminCount = await this.prisma.user.count({
                where: { role: client_1.UserRole.ADMIN },
            });
            if (adminCount <= 1) {
                throw new common_1.ForbiddenException('Cannot delete the only admin user');
            }
        }
        await this.prisma.user.delete({
            where: { id: userId },
        });
        return { message: 'User deleted successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map