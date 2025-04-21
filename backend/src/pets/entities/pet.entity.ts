// This file defines the Pet entity structure based on Prisma schema
// It doesn't use TypeORM decorators since we're using Prisma

export class Pet {
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
  
  // Relations
  owner?: any; // Define a proper Owner type if needed
  visits?: any[]; // Define a proper Visit type if needed
}
