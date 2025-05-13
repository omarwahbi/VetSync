import { ClinicUsersService } from './clinic-users.service';
import { ClinicCreateUserDto } from './dto/clinic-create-user.dto';
import { ClinicUpdateUserDto } from './dto/clinic-update-user.dto';
import { User } from '@prisma/client';
import { Request } from 'express';
interface RequestWithUser extends Request {
    user: User & {
        clinicId: string;
    };
}
export declare class ClinicUsersController {
    private readonly clinicUsersService;
    constructor(clinicUsersService: ClinicUsersService);
    findAll(req: RequestWithUser): Promise<{
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
    }[]>;
    createUser(req: RequestWithUser, createUserDto: ClinicCreateUserDto): Promise<{
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
    }>;
    updateUser(req: RequestWithUser, userIdToUpdate: string, updateDto: ClinicUpdateUserDto): Promise<{
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
    }>;
    deleteUser(req: RequestWithUser, userIdToDelete: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
