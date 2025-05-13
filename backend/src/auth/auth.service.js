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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async validateUser(email, pass) {
        this.logger.debug(`Attempting to validate user: ${email}`);
        const lowerCaseEmail = email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email: lowerCaseEmail },
            include: {
                clinic: {
                    select: {
                        isActive: true,
                        subscriptionEndDate: true
                    },
                },
            },
        });
        if (!user) {
            this.logger.debug(`User not found: ${email}`);
            return null;
        }
        const isPasswordValid = await bcrypt.compare(pass, user.password);
        if (!isPasswordValid) {
            this.logger.debug(`Invalid password for user: ${email}`);
            return null;
        }
        if (user.role !== client_1.UserRole.ADMIN) {
            const clinic = user.clinic;
            if (!clinic ||
                !clinic.isActive ||
                !clinic.subscriptionEndDate ||
                clinic.subscriptionEndDate < new Date()) {
                this.logger.warn(`Login failed for user ${email} due to inactive/expired/missing clinic.`);
                return null;
            }
        }
        const { password, clinic, ...result } = user;
        this.logger.debug(`User validated successfully: ${email}`);
        return result;
    }
    async login(user, ipAddress, userAgent) {
        this.logger.debug(`Generating tokens for user: ${user.email}`);
        const jwtSecret = this.configService.get('JWT_SECRET');
        const jwtExpiresIn = this.configService.get('JWT_EXPIRATION_TIME');
        const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
        const refreshTokenExpiresIn = this.configService.get('REFRESH_TOKEN_EXPIRATION_TIME');
        const accessTokenPayload = {
            username: user.email,
            sub: user.id,
            clinicId: user.clinicId,
            role: user.role
        };
        const accessToken = this.jwtService.sign(accessTokenPayload, {
            secret: jwtSecret,
            expiresIn: jwtExpiresIn,
        });
        const refreshTokenPayload = {
            sub: user.id,
        };
        const refreshToken = this.jwtService.sign(refreshTokenPayload, {
            secret: refreshTokenSecret,
            expiresIn: refreshTokenExpiresIn,
        });
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        const refreshExpiresIn = refreshTokenExpiresIn || '7d';
        const expiresAt = new Date();
        if (refreshExpiresIn.endsWith('d')) {
            const days = parseInt(refreshExpiresIn.replace('d', ''), 10);
            expiresAt.setDate(expiresAt.getDate() + days);
        }
        else if (refreshExpiresIn.endsWith('h')) {
            const hours = parseInt(refreshExpiresIn.replace('h', ''), 10);
            expiresAt.setHours(expiresAt.getHours() + hours);
        }
        else if (refreshExpiresIn.endsWith('m')) {
            const minutes = parseInt(refreshExpiresIn.replace('m', ''), 10);
            expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
        }
        else if (refreshExpiresIn.endsWith('s')) {
            const seconds = parseInt(refreshExpiresIn.replace('s', ''), 10);
            expiresAt.setSeconds(expiresAt.getSeconds() + seconds);
        }
        else {
            expiresAt.setDate(expiresAt.getDate() + 7);
        }
        await this.prisma.userSession.create({
            data: {
                userId: user.id,
                tokenHash: hashedRefreshToken,
                expiresAt,
                ipAddress,
                userAgent,
            },
        });
        this.logger.debug(`Tokens generated successfully for user: ${user.email}`);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                clinicId: user.clinicId,
            },
        };
    }
    async findSessionByTokenHash(tokenHash) {
        this.logger.debug('Finding session by token hash');
        try {
            const session = await this.prisma.userSession.findUnique({
                where: { tokenHash },
                include: {
                    user: {
                        include: {
                            clinic: true
                        }
                    }
                }
            });
            return session;
        }
        catch (error) {
            this.logger.error(`Error finding session: ${error.message}`);
            return null;
        }
    }
    async deleteSessionByTokenHash(tokenHash) {
        this.logger.debug('Deleting session by token hash');
        try {
            await this.prisma.userSession.deleteMany({
                where: { tokenHash }
            });
            this.logger.debug('Session deleted successfully');
        }
        catch (error) {
            this.logger.error(`Error deleting session: ${error.message}`);
            throw new common_1.BadRequestException('Failed to delete session');
        }
    }
    async revokeRefreshToken(userId, refreshToken) {
        this.logger.debug(`Revoking refresh token for user ID: ${userId}`);
        if (!refreshToken) {
            this.logger.warn('No refresh token provided for revocation');
            return;
        }
        try {
            const userSessions = await this.prisma.userSession.findMany({
                where: { userId }
            });
            for (const session of userSessions) {
                const isMatch = await bcrypt.compare(refreshToken, session.tokenHash);
                if (isMatch) {
                    await this.prisma.userSession.delete({
                        where: { id: session.id }
                    });
                    this.logger.debug('Refresh token revoked successfully');
                    return;
                }
            }
            this.logger.debug('No matching refresh token found to revoke');
        }
        catch (error) {
            this.logger.error(`Error revoking refresh token: ${error.message}`);
            throw new common_1.BadRequestException('Failed to revoke refresh token');
        }
    }
    async rotateRefreshToken(userId, oldTokenHash, newRefreshToken, newRefreshTokenExpiresAt, ipAddress, userAgent) {
        this.logger.debug(`Rotating refresh token for user ID: ${userId}`);
        const hashedNewToken = await bcrypt.hash(newRefreshToken, 10);
        try {
            await this.prisma.$transaction([
                this.prisma.userSession.deleteMany({
                    where: { tokenHash: oldTokenHash }
                }),
                this.prisma.userSession.create({
                    data: {
                        userId,
                        tokenHash: hashedNewToken,
                        expiresAt: newRefreshTokenExpiresAt,
                        ipAddress,
                        userAgent,
                    }
                })
            ]);
            this.logger.debug('Refresh token rotated successfully');
        }
        catch (error) {
            this.logger.error(`Error rotating refresh token: ${error.message}`);
            throw new common_1.BadRequestException('Failed to rotate refresh token');
        }
    }
    async register(data) {
        this.logger.debug(`Attempting to register user: ${data.email}`);
        const lowerCaseEmail = data.email.toLowerCase();
        const existingUser = await this.prisma.user.findUnique({
            where: { email: lowerCaseEmail },
        });
        if (existingUser) {
            this.logger.error(`Registration failed: User already exists: ${lowerCaseEmail}`);
            throw new common_1.UnauthorizedException('User with this email already exists');
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        let userRole = client_1.UserRole.STAFF;
        if (data.role && Object.values(client_1.UserRole).includes(data.role)) {
            userRole = data.role;
        }
        try {
            const newUser = await this.prisma.user.create({
                data: {
                    email: lowerCaseEmail,
                    password: hashedPassword,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    clinicId: data.clinicId,
                    role: userRole,
                },
            });
            const { password, ...result } = newUser;
            this.logger.debug(`User registered successfully: ${data.email}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Registration error for ${data.email}: ${error.message}`);
            throw new common_1.UnauthorizedException('Registration failed: ' + error.message);
        }
    }
    async changePassword(userId, changePasswordDto) {
        this.logger.debug(`Attempting to change password for user ID: ${userId}`);
        try {
            const user = await this.prisma.user.findUniqueOrThrow({
                where: { id: userId },
            });
            const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                this.logger.warn(`Password change failed: Incorrect current password for user ID: ${userId}`);
                throw new common_1.BadRequestException('Current password is incorrect');
            }
            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);
            await this.prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword },
            });
            this.logger.debug(`Password changed successfully for user ID: ${userId}`);
            return { message: 'Password updated successfully' };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            if (error.code === 'P2025') {
                this.logger.error(`Password change failed: User not found with ID: ${userId}`);
                throw new common_1.NotFoundException(`User not found with ID: ${userId}`);
            }
            this.logger.error(`Password change error for user ID ${userId}: ${error.message}`);
            throw new common_1.BadRequestException('Failed to change password: ' + error.message);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map