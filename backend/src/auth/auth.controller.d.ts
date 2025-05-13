import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth.dto';
import { User } from '@prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfigService } from '@nestjs/config';
import { Response, Request as ExpressRequest } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthController {
    private readonly authService;
    private readonly configService;
    private readonly jwtService;
    private readonly prismaService;
    private readonly logger;
    constructor(authService: AuthService, configService: ConfigService, jwtService: JwtService, prismaService: PrismaService);
    login(req: any, response: Response): Promise<{
        access_token: string;
    }>;
    refreshToken(request: ExpressRequest, response: Response): Promise<{
        access_token: string | null;
    }>;
    logout(req: any, response: Response): Promise<{
        message: string;
    }>;
    getProfile(req: any): Omit<User, 'password'>;
    register(registerDto: RegisterDto): Promise<Omit<User, 'password'>>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    private setRefreshTokenCookie;
}
