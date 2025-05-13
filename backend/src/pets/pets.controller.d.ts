import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { FilterPetDto } from './dto/filter-pet.dto';
export declare class PetsTopLevelController {
    private readonly petsService;
    constructor(petsService: PetsService);
    findAllClinicPets(filterPetDto: FilterPetDto, req: {
        user: any;
    }): Promise<{
        data: ({
            owner: {
                firstName: string;
                lastName: string;
                id: string;
            };
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
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            updatedById: string | null;
            createdById: string | null;
            species: string | null;
            breed: string | null;
            dob: Date | null;
            gender: string | null;
            color: string | null;
            notes: string | null;
            ownerId: string;
        })[];
        meta: {
            totalCount: number;
            currentPage: number;
            perPage: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, req: {
        user: any;
    }): Promise<{
        owner: {
            firstName: string;
            lastName: string;
            id: string;
        };
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
        visits: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
            notes: string | null;
            visitDate: Date;
            visitType: string;
            price: import("@prisma/client/runtime/library").Decimal | null;
            nextReminderDate: Date | null;
            isReminderEnabled: boolean;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        species: string | null;
        breed: string | null;
        dob: Date | null;
        gender: string | null;
        color: string | null;
        notes: string | null;
        ownerId: string;
    }>;
}
export declare class PetsController {
    private readonly petsService;
    constructor(petsService: PetsService);
    create(createPetDto: CreatePetDto, ownerId: string, req: {
        user: any;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        species: string | null;
        breed: string | null;
        dob: Date | null;
        gender: string | null;
        color: string | null;
        notes: string | null;
        ownerId: string;
    }>;
    findAll(ownerId: string, filterPetDto: FilterPetDto, req: {
        user: any;
    }): Promise<{
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
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            updatedById: string | null;
            createdById: string | null;
            species: string | null;
            breed: string | null;
            dob: Date | null;
            gender: string | null;
            color: string | null;
            notes: string | null;
            ownerId: string;
        })[];
        meta: {
            totalCount: number;
            currentPage: number;
            perPage: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, ownerId: string, req: {
        user: any;
    }): Promise<{
        owner: {
            firstName: string;
            lastName: string;
            id: string;
        };
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
        visits: {
            id: string;
            notes: string | null;
            visitDate: Date;
            visitType: string;
            nextReminderDate: Date | null;
            isReminderEnabled: boolean;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        species: string | null;
        breed: string | null;
        dob: Date | null;
        gender: string | null;
        color: string | null;
        notes: string | null;
        ownerId: string;
    }>;
    update(id: string, ownerId: string, updatePetDto: UpdatePetDto, req: {
        user: any;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        species: string | null;
        breed: string | null;
        dob: Date | null;
        gender: string | null;
        color: string | null;
        notes: string | null;
        ownerId: string;
    }>;
    remove(id: string, ownerId: string, req: {
        user: any;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedById: string | null;
        createdById: string | null;
        species: string | null;
        breed: string | null;
        dob: Date | null;
        gender: string | null;
        color: string | null;
        notes: string | null;
        ownerId: string;
    }>;
}
