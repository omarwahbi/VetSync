import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUserListQueryDto } from './dto/admin-user-list-query.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(createUserDto: CreateUserDto): Promise<{
        name: string;
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
    findAllUsers(queryDto: AdminUserListQueryDto): Promise<{
        data: {
            password: undefined;
            name: string;
            clinic: {
                name: string;
                id: string;
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
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findUserById(id: string): Promise<{
        name: string;
        clinic: {
            name: string;
            id: string;
            isActive: boolean;
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
    updateUser(id: string, updateDto: AdminUpdateUserDto): Promise<{
        name: string;
        clinic: {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            phone: string | null;
            timezone: string;
            canSendReminders: boolean;
            subscriptionStartDate: Date | null;
            subscriptionEndDate: Date | null;
            reminderMonthlyLimit: number;
            reminderSentThisCycle: number;
            currentCycleStartDate: Date | null;
            updatedById: string | null;
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
    deleteUser(id: string, request: any): Promise<{
        message: string;
    }>;
}
