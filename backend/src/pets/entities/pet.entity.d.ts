export declare class Pet {
    id: string;
    name: string;
    species?: string;
    breed?: string;
    dob?: Date;
    gender?: string;
    color?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    owner?: any;
    visits?: any[];
}
