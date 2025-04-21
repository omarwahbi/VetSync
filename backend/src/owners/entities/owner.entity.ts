// This file defines the Owner entity structure based on Prisma schema
// It doesn't use TypeORM decorators since we're using Prisma

export class Owner {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  allowAutomatedReminders: boolean;
  createdAt: Date;
  updatedAt: Date;
  clinicId: string;
  
  // Relations
  pets?: any[]; // Define a proper Pet type if needed
}
