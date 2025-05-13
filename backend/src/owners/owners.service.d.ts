import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterOwnerDto } from './dto/filter-owner.dto';
import { User } from '@prisma/client';
export declare class OwnersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createOwnerDto: CreateOwnerDto, user: User): Promise<{
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
    findAll(user: {
        clinicId: string;
    }, filterOwnerDto?: FilterOwnerDto): Promise<{
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
    findOne(id: string, user: {
        clinicId?: string | null;
    } | User): Promise<{
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
    update(id: string, updateOwnerDto: UpdateOwnerDto, user: User): Promise<{
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
    remove(id: string, user: {
        clinicId: string;
    }): Promise<{
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
