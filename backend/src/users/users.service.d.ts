import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<{
        email: string;
        clinicId: string | null;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
    }>;
}
