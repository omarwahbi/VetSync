import { UserRole } from '@prisma/client';
export declare class ClinicUpdateUserDto {
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    role?: UserRole;
}
