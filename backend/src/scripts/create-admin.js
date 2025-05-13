"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
async function createAdmin() {
    const prisma = new client_1.PrismaClient();
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: 'owahbi82@gmail.com' },
        });
        if (existingUser) {
            console.log('User with this email already exists.');
            return;
        }
        const hashedPassword = await bcrypt.hash('password123', 10);
        const admin = await prisma.user.create({
            data: {
                email: 'owahbi82@gmail.com',
                password: hashedPassword,
                firstName: 'Omar',
                lastName: 'Wahbi',
                role: 'ADMIN',
                isActive: true,
            },
        });
        console.log('Admin user created successfully:');
        console.log({
            id: admin.id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: admin.role,
        });
    }
    catch (error) {
        console.error('Error creating admin user:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createAdmin();
//# sourceMappingURL=create-admin.js.map