import { Prisma } from '@prisma/client';
export declare function createDueTodayWhereClause(userClinicId?: string | null, timezone?: string): Prisma.VisitWhereInput;
export declare function createUpcomingVisitsWhereClause(userClinicId?: string | null, daysAhead?: number, timezone?: string, visitType?: string, reminderEnabled?: boolean): Prisma.VisitWhereInput;
