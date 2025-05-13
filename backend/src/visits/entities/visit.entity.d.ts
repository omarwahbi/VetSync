export declare class Visit {
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
    pet?: any;
}
