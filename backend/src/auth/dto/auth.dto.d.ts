import { UserRole } from '@prisma/client';
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RegisterDto {
    email: string;
    password: string;
    clinicId: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
}
export declare class TokenResponseDto {
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        firstName?: string | null;
        lastName?: string | null;
        role: string;
        clinicId?: string | null;
    };
}
