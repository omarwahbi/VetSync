const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDuplicatePhones() {
  try {
    // Fix each duplicate case individually to avoid transaction failures
    
    // 1. For phone "07709392562":
    // Keep the record with pets, update the other one with a slightly modified number
    await prisma.owner.update({
      where: { id: 'cm9ytvozo0005oo8mu4wa4byv' }, // No pets
      data: { phone: '077093925621' } // Add a "1" at the end to make it unique
    });
    console.log('Updated phone for owner cm9ytvozo0005oo8mu4wa4byv');
    
    // 2. For phone "07838939256":
    // Keep the first record with pets, update the others with modified numbers
    await prisma.owner.update({
      where: { id: 'cm9ow9pis0001oooi25k0pmgy' }, // Empty record
      data: { phone: '078389392561' } // Add a "1" at the end
    });
    console.log('Updated phone for owner cm9ow9pis0001oooi25k0pmgy');
    
    await prisma.owner.update({
      where: { id: 'cm9qd1kue0009oo35xljxen8n' }, // Has one pet
      data: { phone: '078389392562' } // Add a "2" at the end
    });
    console.log('Updated phone for owner cm9qd1kue0009oo35xljxen8n');
    
    await prisma.owner.update({
      where: { id: 'cm9raop2a000loorkeawfk8s6' }, // Empty record
      data: { phone: '078389392563' } // Add a "3" at the end
    });
    console.log('Updated phone for owner cm9raop2a000loorkeawfk8s6');
    
    // 3. For phone "+9647838939256":
    // Keep the record with pets, set the other to an empty string or a modified value
    await prisma.owner.update({
      where: { id: 'cm9yv7cvk0005oorvjts76ug6' }, // No pets
      data: { phone: '+96478389392561' } // Add a "1" at the end since null isn't supported yet
    });
    console.log('Updated phone for owner cm9yv7cvk0005oorvjts76ug6');
    
    console.log('Successfully fixed all duplicate phone numbers');
    
    // Verify that no more duplicates exist
    const remainingDuplicates = await prisma.$queryRaw`
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
    
    if (remainingDuplicates.length === 0) {
      console.log('Verification successful: No duplicate phone numbers remain');
    } else {
      console.log('Warning: There are still duplicate phone numbers:');
      console.log(JSON.stringify(remainingDuplicates, null, 2));
    }
    
  } catch (error) {
    console.error('Error fixing duplicate phones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicatePhones(); 