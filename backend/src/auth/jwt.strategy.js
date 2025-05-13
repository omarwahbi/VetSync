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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    configService;
    constructor(prisma, configService) {
        const secretKey = configService.get('JWT_SECRET');
        if (!secretKey) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secretKey,
        });
        this.prisma = prisma;
        this.configService = configService;
    }
    async validate(payload) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                include: {
                    clinic: {
                        select: {
                            id: true,
                            name: true,
                            isActive: true,
                            subscriptionEndDate: true,
                            canSendReminders: true,
                        }
                    }
                },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('User account is inactive');
            }
            if (user.role === 'ADMIN' && !user.clinicId) {
                const { password, ...result } = user;
                return result;
            }
            if (!user.clinic || !user.clinic.isActive) {
                throw new common_1.UnauthorizedException('Clinic subscription is inactive');
            }
            if (user.clinic.subscriptionEndDate &&
                new Date() > user.clinic.subscriptionEndDate) {
                throw new common_1.UnauthorizedException('Clinic subscription has expired');
            }
            const { password, ...result } = user;
            return result;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Failed to authenticate token');
        }
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map