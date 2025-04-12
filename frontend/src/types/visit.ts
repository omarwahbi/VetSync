export interface Visit {
  id: string;
  petId: string;
  visitDate: string;
  visitType: string;
  notes?: string;
  nextReminderDate?: string;
  isReminderEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
} 