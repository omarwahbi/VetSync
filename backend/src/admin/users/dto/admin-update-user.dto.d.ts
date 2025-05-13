import { UserRole } from '@prisma/client';
export declare class AdminUpdateUserDto {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    isActive?: boolean;
    clinicId?: string | null;
    password?: string;
}
