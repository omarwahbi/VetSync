import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
interface JwtPayload {
    username: string;
    sub: string;
    clinicId?: string | null;
    role: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    validate(payload: JwtPayload): Promise<{
        clinic: {
            name: string;
            id: string;
            isActive: boolean;
            canSendReminders: boolean;
            subscriptionEndDate: Date | null;
        } | null;
        email: string;
        clinicId: string | null;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
