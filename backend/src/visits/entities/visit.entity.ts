// This file defines the Visit entity structure based on Prisma schema
// It doesn't use TypeORM decorators since we're using Prisma

export class Visit {
  id: string;
  visitDate: Date;
  visitType: string;
  notes?: string;
  price?: number;
  nextReminderDate?: Date;
  reminderSent: boolean;
  isReminderEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  petId: string;
  
  // Relations
  pet?: any; // Define a proper Pet type if needed
}
