import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    private readonly logger;
    constructor(usersService: UsersService);
    updateOwnProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<{
        email: string;
        clinicId: string | null;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
    }>;
}
