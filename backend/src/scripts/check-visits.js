"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        const vaccinations = await prisma.visit.findMany({
            where: {
                visitType: 'vaccination',
            },
            include: {
                pet: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        console.log(`Found ${vaccinations.length} vaccination visits`);
        if (vaccinations.length > 0) {
            console.log('\nSample vaccination visits:');
            vaccinations.slice(0, 5).forEach((v, i) => {
                console.log(`\nVisit #${i + 1}:`);
                console.log(`  ID: ${v.id}`);
                console.log(`  Pet: ${v.pet.name} (${v.petId})`);
                console.log(`  Visit Type: ${v.visitType}`);
                console.log(`  Visit Date: ${v.visitDate}`);
                console.log(`  Next Reminder Date: ${v.nextReminderDate}`);
                console.log(`  Is Reminder Enabled: ${v.isReminderEnabled}`);
            });
        }
        else {
            console.log('No vaccination visits found in the database.');
            const anyVisits = await prisma.visit.findMany({
                take: 5,
                include: {
                    pet: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            if (anyVisits.length > 0) {
                console.log('\nFound other types of visits:');
                anyVisits.forEach((v, i) => {
                    console.log(`\nVisit #${i + 1}:`);
                    console.log(`  ID: ${v.id}`);
                    console.log(`  Pet: ${v.pet.name} (${v.petId})`);
                    console.log(`  Visit Type: ${v.visitType}`);
                    console.log(`  Visit Date: ${v.visitDate}`);
                    console.log(`  Next Reminder Date: ${v.nextReminderDate}`);
                    console.log(`  Is Reminder Enabled: ${v.isReminderEnabled}`);
                });
            }
            else {
                console.log('No visits found in the database at all.');
            }
        }
        const visitsIn2025 = await prisma.visit.findMany({
            where: {
                visitDate: {
                    gte: new Date('2025-01-01'),
                    lte: new Date('2025-12-31'),
                },
            },
            take: 5,
        });
        console.log(`\nFound ${visitsIn2025.length} visits in 2025`);
        if (visitsIn2025.length > 0) {
            console.log('\nSample 2025 visits:');
            visitsIn2025.forEach((v, i) => {
                console.log(`\nVisit #${i + 1}:`);
                console.log(`  ID: ${v.id}`);
                console.log(`  Visit Type: ${v.visitType}`);
                console.log(`  Visit Date: ${v.visitDate}`);
            });
        }
        const todayStr = new Date().toISOString().split('T')[0];
        const futureVisits = await prisma.visit.findMany({
            where: {
                visitDate: {
                    gte: new Date(todayStr),
                },
                visitType: 'vaccination',
            },
            take: 5,
        });
        console.log(`\nFound ${futureVisits.length} future vaccination visits`);
        if (futureVisits.length > 0) {
            console.log('\nSample future vaccination visits:');
            futureVisits.forEach((v, i) => {
                console.log(`\nVisit #${i + 1}:`);
                console.log(`  ID: ${v.id}`);
                console.log(`  Visit Date: ${v.visitDate}`);
            });
        }
    }
    catch (error) {
        console.error('Error checking visits:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=check-visits.js.map