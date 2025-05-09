import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get current date and date 30 days from now
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);
  
  console.log('Date Range:');
  console.log(`Today: ${today.toISOString()}`);
  console.log(`30 days later: ${thirtyDaysLater.toISOString()}`);
  
  // Query for vaccination visits in the next 30 days
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
  
  // Check for visits in year 2025 specifically matching our date filter
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
  } else {
    // Check all 2025 vaccination visits to see why none match
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