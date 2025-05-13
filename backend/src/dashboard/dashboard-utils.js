"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDueTodayWhereClause = createDueTodayWhereClause;
exports.createUpcomingVisitsWhereClause = createUpcomingVisitsWhereClause;
const date_utils_1 = require("./date-utils");
function createDueTodayWhereClause(userClinicId, timezone = 'UTC') {
    const { start, end } = (0, date_utils_1.getClinicDateRange)(timezone);
    const whereClause = {
        nextReminderDate: {
            gte: start,
            lte: end
        },
        isReminderEnabled: true
    };
    if (userClinicId) {
        whereClause.pet = {
            owner: {
                clinicId: userClinicId
            }
        };
    }
    return whereClause;
}
function createUpcomingVisitsWhereClause(userClinicId, daysAhead = 30, timezone = 'UTC', visitType, reminderEnabled) {
    const { start, end } = (0, date_utils_1.getClinicFutureDateRange)(daysAhead, timezone);
    const whereClause = {
        nextReminderDate: {
            gte: start,
            lte: end
        }
    };
    if (userClinicId) {
        whereClause.pet = {
            owner: {
                clinicId: userClinicId
            }
        };
    }
    if (visitType) {
        whereClause.visitType = visitType;
    }
    if (reminderEnabled !== undefined) {
        whereClause.isReminderEnabled = reminderEnabled;
    }
    return whereClause;
}
//# sourceMappingURL=dashboard-utils.js.map