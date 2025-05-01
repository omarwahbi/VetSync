const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Add BigInt serialization support
BigInt.prototype.toJSON = function() { return this.toString() };

async function checkDuplicatePhones() {
  try {
    // Group by clinicId and phone, count occurrences
    const duplicates = await prisma.$queryRaw`
      SELECT 
        "clinicId", 
        phone,
        COUNT(*) as count
      FROM 
        "Owner"
      WHERE 
        phone IS NOT NULL
      GROUP BY 
        "clinicId", phone
      HAVING 
        COUNT(*) > 1
    `;
    
    // Display results
    console.log('Potential duplicate phone numbers per clinic:');
    console.log(JSON.stringify(duplicates, null, 2));
    
    if (duplicates.length === 0) {
      console.log('No duplicates found. It should be safe to run the migration.');
    } else {
      console.log('Duplicate phone numbers found. These need to be fixed before applying the migration.');
    }
    
  } catch (error) {
    console.error('Error checking for duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicatePhones(); 