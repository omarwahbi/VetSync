import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterPetDto } from './dto/filter-pet.dto';
import { Prisma, User } from '@prisma/client';
export declare class PetsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllClinicPets(user: {
        clinicId: string;
    }, filterPetDto?: FilterPetDto): Promise<{
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
    create(createPetDto: CreatePetDto, ownerId: string, user: User): Promise<{
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
    findAll(ownerId: string, user: {
        clinicId: string;
    }, filterPetDto?: FilterPetDto): Promise<{
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
    findOne(id: string, ownerId: string, user: {
        clinicId?: string | null;
    } | User): Promise<{
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
    findOneByPetId(id: string, user: {
        clinicId?: string | null;
    } | User): Promise<{
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
            price: Prisma.Decimal | null;
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
    update(id: string, ownerId: string, updatePetDto: UpdatePetDto, user: User): Promise<{
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
    remove(id: string, ownerId: string, user: {
        clinicId: string;
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
