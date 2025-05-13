"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    console.log('Date Range:');
    console.log(`Today: ${today.toISOString()}`);
    console.log(`30 days later: ${thirtyDaysLater.toISOString()}`);
    const visits = await prisma.visit.findMany({
        where: {
            visitType: 'vaccination',
            visitDate: {
                gte: today,
                lte: thirtyDaysLater
            }
        }
    });
    console.log(`\nFound ${visits.length} vaccination visits in the next 30 days`);
    const startDate = new Date('2025-05-09');
    const endDate = new Date('2025-06-08');
    const visits2025 = await prisma.visit.findMany({
        where: {
            visitType: 'vaccination',
            visitDate: {
                gte: startDate,
                lte: endDate
            }
        }
    });
    console.log(`\nFound ${visits2025.length} vaccination visits between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    if (visits2025.length > 0) {
        console.log('\nMatching visits:');
        visits2025.forEach(v => {
            console.log(`ID: ${v.id}, Date: ${v.visitDate}`);
        });
    }
    else {
        const all2025Vaccinations = await prisma.visit.findMany({
            where: {
                visitType: 'vaccination',
                visitDate: {
                    gte: new Date('2025-01-01'),
                    lte: new Date('2025-12-31')
                }
            }
        });
        console.log(`\nFound ${all2025Vaccinations.length} vaccination visits in all of 2025:`);
        all2025Vaccinations.forEach(v => {
            console.log(`ID: ${v.id}, Date: ${v.visitDate}`);
        });
    }
    await prisma.$disconnect();
}
main().catch(e => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=test-date-filter.js.map