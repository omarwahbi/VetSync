import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'owahbi82@gmail.com' },
    });

    if (existingUser) {
      console.log('User with this email already exists.');
      return;
    }

    // Hash the password (using a default password 'password123' - change it after login)
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        email: 'owahbi82@gmail.com',
        password: hashedPassword,
        firstName: 'Omar',
        lastName: 'Wahbi',
        role: 'ADMIN',
        isActive: true,
        // clinicId is not provided, so it will be null
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
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 