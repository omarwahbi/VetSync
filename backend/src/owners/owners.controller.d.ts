import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { FilterOwnerDto } from './dto/filter-owner.dto';
export declare class OwnersController {
    private readonly ownersService;
    constructor(ownersService: OwnersService);
    create(createOwnerDto: CreateOwnerDto, req: any): Promise<{
        email: string | null;
        clinicId: string;
        firstName: string;
        lastName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        updatedById: string | null;
        allowAutomatedReminders: boolean;
        createdById: string | null;
    }>;
    findAll(filterOwnerDto: FilterOwnerDto, req: any): Promise<{
        data: ({
            updatedBy: {
                firstName: string | null;
                lastName: string | null;
                id: string;
            } | null;
            createdBy: {
                firstName: string | null;
                lastName: string | null;
                id: string;
            } | null;
        } & {
            email: string | null;
            clinicId: string;
            firstName: string;
            lastName: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            phone: string | null;
            updatedById: string | null;
            allowAutomatedReminders: boolean;
            createdById: string | null;
        })[];
        meta: {
            totalCount: number;
            currentPage: number;
            perPage: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, req: any): Promise<{
        updatedBy: {
            firstName: string | null;
            lastName: string | null;
            id: string;
        } | null;
        createdBy: {
            firstName: string | null;
            lastName: string | null;
            id: string;
        } | null;
        pets: {
            name: string;
            id: string;
            species: string | null;
            breed: string | null;
        }[];
    } & {
        email: string | null;
        clinicId: string;
        firstName: string;
        lastName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        updatedById: string | null;
        allowAutomatedReminders: boolean;
        createdById: string | null;
    }>;
    update(id: string, updateOwnerDto: UpdateOwnerDto, req: any): Promise<{
        email: string | null;
        clinicId: string;
        firstName: string;
        lastName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        updatedById: string | null;
        allowAutomatedReminders: boolean;
        createdById: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        email: string | null;
        clinicId: string;
        firstName: string;
        lastName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        updatedById: string | null;
        allowAutomatedReminders: boolean;
        createdById: string | null;
    }>;
}
