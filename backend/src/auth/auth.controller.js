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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const public_decorator_1 = require("./public.decorator");
const auth_dto_1 = require("./dto/auth.dto");
const client_1 = require("@prisma/client");
const change_password_dto_1 = require("./dto/change-password.dto");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const throttler_1 = require("@nestjs/throttler");
let AuthController = AuthController_1 = class AuthController {
    authService;
    configService;
    jwtService;
    prismaService;
    logger = new common_1.Logger(AuthController_1.name);
    constructor(authService, configService, jwtService, prismaService) {
        this.authService = authService;
        this.configService = configService;
        this.jwtService = jwtService;
        this.prismaService = prismaService;
    }
    async login(req, response) {
        this.logger.log(`Login attempt for user: ${req.user.email}`);
        const user = req.user;
        const { access_token, refresh_token } = await this.authService.login(user);
        this.setRefreshTokenCookie(response, refresh_token);
        return { access_token };
    }
    async refreshToken(request, response) {
        const cookieName = this.configService.get('REFRESH_TOKEN_COOKIE_NAME') || 'jid';
        const providedRefreshToken = request.cookies?.[cookieName];
        if (!providedRefreshToken) {
            return { access_token: null };
        }
        this.logger.log('Processing refresh token request');
        try {
            const payload = await this.jwtService.verifyAsync(providedRefreshToken, {
                secret: this.configService.get('REFRESH_TOKEN_SECRET'),
            });
            const userId = payload.sub;
            const hashedToken = await bcrypt.hash(providedRefreshToken, 10);
            let session;
            let foundTokenHash;
            const userSessions = await this.prismaService.userSession.findMany({
                where: { userId },
                include: {
                    user: {
                        include: { clinic: true }
                    }
                }
            });
            for (const s of userSessions) {
                const isMatch = await bcrypt.compare(providedRefreshToken, s.tokenHash);
                if (isMatch) {
                    session = s;
                    foundTokenHash = s.tokenHash;
                    break;
                }
            }
            if (!session) {
                this.logger.warn(`No valid session found for user ID: ${userId}`);
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            if (session.expiresAt < new Date()) {
                await this.authService.deleteSessionByTokenHash(foundTokenHash);
                throw new common_1.UnauthorizedException('Refresh token has expired');
            }
            const user = session.user;
            if (user.role !== client_1.UserRole.ADMIN) {
                const clinic = user.clinic;
                if (!clinic || !clinic.isActive ||
                    !clinic.subscriptionEndDate ||
                    clinic.subscriptionEndDate < new Date()) {
                    await this.authService.deleteSessionByTokenHash(foundTokenHash);
                    this.logger.warn(`Clinic subscription inactive or expired for user ID: ${userId}`);
                    throw new common_1.UnauthorizedException('Clinic subscription inactive or expired.');
                }
            }
            const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
            const refreshTokenExpiresIn = this.configService.get('REFRESH_TOKEN_EXPIRATION_TIME') || '7d';
            const refreshTokenPayload = { sub: userId };
            const newRefreshToken = this.jwtService.sign(refreshTokenPayload, {
                secret: refreshTokenSecret,
                expiresIn: refreshTokenExpiresIn,
            });
            const accessTokenPayload = {
                username: user.email,
                sub: user.id,
                clinicId: user.clinicId,
                role: user.role
            };
            const newAccessToken = this.jwtService.sign(accessTokenPayload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRATION_TIME'),
            });
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
            await this.authService.rotateRefreshToken(userId, foundTokenHash, newRefreshToken, expiresAt, request.ip, request.get('user-agent'));
            response.cookie(cookieName, newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });
            this.logger.log(`New tokens generated for user ID: ${userId}`);
            return { access_token: newAccessToken };
        }
        catch (error) {
            this.logger.error(`Refresh token validation failed: ${error.message}`);
            response.clearCookie(cookieName, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(req, response) {
        const userId = req.user.id;
        const cookieName = this.configService.get('REFRESH_TOKEN_COOKIE_NAME') || 'jid';
        await this.authService.revokeRefreshToken(userId, req.cookies[cookieName]);
        response.clearCookie(cookieName);
        return { message: 'Logged out successfully' };
    }
    getProfile(req) {
        this.logger.log(`Profile access for user: ${req.user.email}`);
        return req.user;
    }
    async register(registerDto) {
        this.logger.log(`Registration attempt for: ${registerDto.email}`);
        return this.authService.register(registerDto);
    }
    async changePassword(req, changePasswordDto) {
        this.logger.log(`Password change attempt for user ID: ${req.user.id}`);
        return this.authService.changePassword(req.user.id, changePasswordDto);
    }
    setRefreshTokenCookie(response, refreshToken) {
        const cookieName = this.configService.get('REFRESH_TOKEN_COOKIE_NAME') || 'jid';
        response.cookie(cookieName, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.PublicRoute)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('local')),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.PublicRoute)(),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, public_decorator_1.PublicRoute)(),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 300000 } }),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 300000 } }),
    (0, common_1.Patch)('change-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map