import { UserRole } from '@prisma/client';
export declare class AdminUserListQueryDto {
    search?: string;
    role?: UserRole;
    clinicId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
