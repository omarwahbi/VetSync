import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserSession } from '@prisma/client';
import { RegisterDto, TokenResponseDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
type UserWithoutPassword = Omit<User, 'password'>;
type UserSessionWithRelations = UserSession & {
    user: User & {
        clinic: {
            id: string;
            name: string;
            isActive: boolean;
            subscriptionEndDate: Date | null;
        } | null;
    };
};
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    validateUser(email: string, pass: string): Promise<UserWithoutPassword | null>;
    login(user: UserWithoutPassword, ipAddress?: string, userAgent?: string): Promise<TokenResponseDto>;
    findSessionByTokenHash(tokenHash: string): Promise<UserSessionWithRelations | null>;
    deleteSessionByTokenHash(tokenHash: string): Promise<void>;
    revokeRefreshToken(userId: string, refreshToken: string): Promise<void>;
    rotateRefreshToken(userId: string, oldTokenHash: string, newRefreshToken: string, newRefreshTokenExpiresAt: Date, ipAddress?: string, userAgent?: string): Promise<void>;
    register(data: RegisterDto): Promise<UserWithoutPassword>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
export {};
