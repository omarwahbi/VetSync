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
exports.ClinicUsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
let ClinicUsersService = class ClinicUsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findUsersForClinic(clinicId) {
        return this.prisma.user.findMany({
            where: { clinicId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createUserInClinic(callerUser, createUserDto) {
        const lowerCaseEmail = createUserDto.email.toLowerCase();
        const existingUser = await this.prisma.user.findUnique({
            where: { email: lowerCaseEmail },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const newUser = await this.prisma.user.create({
            data: {
                email: lowerCaseEmail,
                password: hashedPassword,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                role: client_1.UserRole.STAFF,
                clinicId: callerUser.clinicId,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
            },
        });
        return newUser;
    }
    async updateUserInClinic(callerUser, userIdToUpdate, updateDto) {
        const userToUpdate = await this.prisma.user.findUnique({
            where: { id: userIdToUpdate },
        });
        if (!userToUpdate) {
            throw new common_1.NotFoundException('User not found');
        }
        if (userToUpdate.clinicId !== callerUser.clinicId) {
            throw new common_1.ForbiddenException('You cannot update users from another clinic');
        }
        if (userToUpdate.id === callerUser.id) {
            throw new common_1.ForbiddenException('You cannot use this endpoint to update your own account');
        }
        if (updateDto.role === client_1.UserRole.CLINIC_ADMIN) {
            if (userToUpdate.role !== client_1.UserRole.STAFF) {
                throw new common_1.BadRequestException('Can only promote STAFF users to CLINIC_ADMIN role');
            }
        }
        const dataToUpdate = {};
        if (updateDto.firstName !== undefined) {
            dataToUpdate.firstName = updateDto.firstName;
        }
        if (updateDto.lastName !== undefined) {
            dataToUpdate.lastName = updateDto.lastName;
        }
        if (updateDto.isActive !== undefined) {
            dataToUpdate.isActive = updateDto.isActive;
        }
        if (updateDto.role !== undefined) {
            dataToUpdate.role = updateDto.role;
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userIdToUpdate },
            data: dataToUpdate,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
            },
        });
        return updatedUser;
    }
    async deleteUserInClinic(callerUser, userIdToDelete) {
        const userToDelete = await this.prisma.user.findUnique({
            where: { id: userIdToDelete },
        });
        if (!userToDelete) {
            throw new common_1.NotFoundException('User not found');
        }
        if (userToDelete.clinicId !== callerUser.clinicId) {
            throw new common_1.ForbiddenException('You cannot delete users from another clinic');
        }
        if (userToDelete.id === callerUser.id) {
            throw new common_1.ForbiddenException('You cannot delete your own account');
        }
        await this.prisma.user.delete({
            where: { id: userIdToDelete },
        });
        return { success: true, message: 'User deleted successfully' };
    }
};
exports.ClinicUsersService = ClinicUsersService;
exports.ClinicUsersService = ClinicUsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClinicUsersService);
//# sourceMappingURL=clinic-users.service.js.map