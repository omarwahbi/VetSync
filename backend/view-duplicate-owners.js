const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Add BigInt serialization support
BigInt.prototype.toJSON = function() { return this.toString() };

async function viewDuplicateOwners() {
  try {
    // Get duplicate phone numbers by clinic
    const duplicatePhones = await prisma.$queryRaw`
      SELECT 
        "clinicId", 
        phone
      FROM 
        "Owner"
      WHERE 
        phone IS NOT NULL
      GROUP BY 
        "clinicId", phone
      HAVING 
        COUNT(*) > 1
    `;
    
    console.log(`Found ${duplicatePhones.length} phone numbers with duplicates`);
    
    // For each duplicate phone number, get the details of all owners
    for (const duplicate of duplicatePhones) {
      const owners = await prisma.owner.findMany({
        where: {
          clinicId: duplicate.clinicId,
          phone: duplicate.phone,
        },
        include: {
          pets: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });
      
      console.log('\n--------------------------------------------');
      console.log(`Clinic ID: ${duplicate.clinicId}, Phone: ${duplicate.phone}`);
      console.log('Owners with this phone number:');
      
      owners.forEach((owner, idx) => {
        console.log(`\n[${idx + 1}] ID: ${owner.id}`);
        console.log(`    Name: ${owner.firstName} ${owner.lastName}`);
        console.log(`    Email: ${owner.email || 'None'}`);
        console.log(`    Address: ${owner.address || 'None'}`);
        console.log(`    Created: ${owner.createdAt}`);
        console.log(`    Updated: ${owner.updatedAt}`);
        console.log(`    Pets (${owner.pets.length}):`);
        
        if (owner.pets.length > 0) {
          owner.pets.forEach(pet => {
            console.log(`      - ${pet.name} (${pet.id})`);
          });
        } else {
          console.log('      No pets');
        }
      });
    }
    
  } catch (error) {
    console.error('Error viewing duplicate owners:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewDuplicateOwners(); 