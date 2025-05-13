"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const dashboard_utils_1 = require("../dashboard/dashboard-utils");
async function main() {
    try {
        const clinicId = null;
        const timezone = 'UTC';
        const whereClause = (0, dashboard_utils_1.createUpcomingVisitsWhereClause)(clinicId, timezone);
        const upcomingVaccinationCount = await prisma.visit.count({
            where: {
                ...whereClause,
                visitType: 'vaccination'
            }
        });
        console.log('Dashboard upcoming vaccination count:', upcomingVaccinationCount);
        const upcomingVaccinations = await prisma.visit.findMany({
            where: {
                ...whereClause,
                visitType: 'vaccination'
            },
            include: {
                pet: {
                    select: {
                        name: true
                    }
                }
            }
        });
        console.log('\nUpcoming vaccinations matching dashboard count:');
        upcomingVaccinations.forEach((v, i) => {
            console.log(`\nVaccination #${i + 1}:`);
            console.log(`  ID: ${v.id}`);
            console.log(`  Pet: ${v.pet.name}`);
            console.log(`  Visit Date: ${v.visitDate}`);
            console.log(`  Next Reminder Date: ${v.nextReminderDate}`);
        });
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        const broadFilterVaccinations = await prisma.visit.findMany({
            where: {
                visitType: 'vaccination',
                visitDate: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
        console.log(`\nFound ${broadFilterVaccinations.length} vaccinations with our broad filter`);
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(now.getMonth() + 1);
        console.log('\nAnalyzing vaccination dates:');
        console.log(`Current date: ${now.toISOString()}`);
        const past = [];
        const next30Days = [];
        const future = [];
        broadFilterVaccinations.forEach(v => {
            const visitDate = new Date(v.visitDate);
            if (visitDate < now) {
                past.push(v);
            }
            else if (visitDate >= now && visitDate <= oneMonthFromNow) {
                next30Days.push(v);
            }
            else {
                future.push(v);
            }
        });
        console.log(`\nVaccinations in the past: ${past.length}`);
        console.log(`Vaccinations in next 30 days: ${next30Days.length}`);
        console.log(`Vaccinations after 30 days: ${future.length}`);
        console.log('\nNext 30 days vaccinations:');
        next30Days.forEach((v, i) => {
            console.log(`${i + 1}. ${v.id}: ${v.visitDate}`);
        });
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=test-dashboard-counts.js.map