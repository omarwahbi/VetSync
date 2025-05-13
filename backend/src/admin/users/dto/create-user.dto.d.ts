export declare enum UserRole {
    USER = "USER",
    STAFF = "STAFF",
    ADMIN = "ADMIN"
}
export declare class CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    clinicId?: string;
    role: UserRole;
    isActive?: boolean;
}
