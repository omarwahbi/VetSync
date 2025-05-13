"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUTCTodayRange = getUTCTodayRange;
exports.getClinicDateRange = getClinicDateRange;
exports.getClinicFutureDateRange = getClinicFutureDateRange;
const date_fns_tz_1 = require("date-fns-tz");
const date_fns_1 = require("date-fns");
function getUTCTodayRange() {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    return { start, end };
}
function getClinicDateRange(timezone = 'UTC') {
    try {
        const now = new Date();
        const zonedNow = (0, date_fns_tz_1.toZonedTime)(now, timezone);
        const zonedStartOfDay = (0, date_fns_1.startOfDay)(zonedNow);
        const zonedEndOfDay = (0, date_fns_1.endOfDay)(zonedNow);
        const utcStart = new Date(zonedStartOfDay.toISOString());
        const utcEnd = new Date(zonedEndOfDay.toISOString());
        return { start: utcStart, end: utcEnd };
    }
    catch (error) {
        console.error(`Invalid timezone: ${timezone}. Falling back to UTC.`, error);
        return getUTCTodayRange();
    }
}
function getClinicFutureDateRange(daysAhead = 30, timezone = 'UTC') {
    try {
        const { start: todayStart } = getClinicDateRange(timezone);
        const now = new Date();
        const zonedNow = (0, date_fns_tz_1.toZonedTime)(now, timezone);
        const zonedFutureDate = (0, date_fns_1.addDays)(zonedNow, daysAhead);
        const zonedFutureEndOfDay = (0, date_fns_1.endOfDay)(zonedFutureDate);
        const utcFutureEnd = new Date(zonedFutureEndOfDay.toISOString());
        return { start: todayStart, end: utcFutureEnd };
    }
    catch (error) {
        console.error(`Invalid timezone: ${timezone}. Falling back to UTC.`, error);
        const now = new Date();
        const futureDate = (0, date_fns_1.addDays)(now, daysAhead);
        return {
            start: (0, date_fns_1.startOfDay)(now),
            end: (0, date_fns_1.endOfDay)(futureDate),
        };
    }
}
//# sourceMappingURL=date-utils.js.map