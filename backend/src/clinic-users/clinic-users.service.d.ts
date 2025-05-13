import { PrismaService } from '../prisma/prisma.service';
import { ClinicCreateUserDto } from './dto/clinic-create-user.dto';
import { ClinicUpdateUserDto } from './dto/clinic-update-user.dto';
import { User } from '@prisma/client';
export declare class ClinicUsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findUsersForClinic(clinicId: string): Promise<{
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
    }[]>;
    createUserInClinic(callerUser: User, createUserDto: ClinicCreateUserDto): Promise<{
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
    }>;
    updateUserInClinic(callerUser: User, userIdToUpdate: string, updateDto: ClinicUpdateUserDto): Promise<{
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
    }>;
    deleteUserInClinic(callerUser: User, userIdToDelete: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
