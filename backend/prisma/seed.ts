import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();
const saltRounds = 10;

async function main() {
  console.log(`Start seeding ...`);

  // --- Clear Existing Data (Optional but Recommended for repeatable seeds) ---
  // Be careful in production! Only use in development seeding.
  await prisma.visit.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();
  console.log('Cleared existing data.');

  // --- Seed Platform Admin from Environment Variables ---
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@petwellapp.com').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminFirstName = process.env.SEED_ADMIN_FIRSTNAME || 'Platform';
  const adminLastName = process.env.SEED_ADMIN_LASTNAME || 'Admin';

  if (!adminEmail || !adminPassword) {
    console.warn(
      'SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not found in environment variables. ' +
      'Skipping Platform Admin user creation/update.',
    );
  } else {
    console.log(`Attempting to upsert admin user: ${adminEmail}`);
    const hashedAdminPassword = await bcrypt.hash(adminPassword, saltRounds);

    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedAdminPassword,
        role: UserRole.ADMIN,
        isActive: true,
        firstName: adminFirstName,
        lastName: adminLastName,
      },
      create: {
        email: adminEmail,
        password: hashedAdminPassword,
        role: UserRole.ADMIN,
        isActive: true,
        firstName: adminFirstName,
        lastName: adminLastName,
        clinicId: null,
      },
    });
    console.log(`Successfully upserted admin user: ${adminUser.email}`);
  }

  // --- Seed Clinics ---
  const clinic1 = await prisma.clinic.upsert({
    where: { name: 'The Pawsitive Vet' },
    update: {},
    create: {
      id: 'clinic001',
      name: 'The Pawsitive Vet',
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      isActive: true,
      subscriptionEndDate: faker.date.future({ years: 1 }),
      canSendReminders: true, // Allow this clinic to send reminders
    },
  });
  console.log(`Created/Found clinic: ${clinic1.name}`);

  const clinic2 = await prisma.clinic.upsert({
    where: { name: 'Happy Tails Clinic' },
    update: {},
    create: {
      id: 'clinic002',
      name: 'Happy Tails Clinic',
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      isActive: true,
      subscriptionEndDate: faker.date.future({ years: 1 }),
      canSendReminders: false, // Disable reminders for this clinic
    },
  });
  console.log(`Created/Found clinic: ${clinic2.name}`);

  // --- Seed Staff Users for Clinics ---
  const staff1Password = 'staffpassword1';
  const hashedStaff1Password = await bcrypt.hash(staff1Password, saltRounds);
  await prisma.user.upsert({
    where: { email: 'staff1@pawsitive.vet'.toLowerCase() },
    update: {},
    create: {
      email: 'staff1@pawsitive.vet'.toLowerCase(),
      password: hashedStaff1Password,
      role: UserRole.STAFF,
      isActive: true,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      clinicId: clinic1.id, // Associate with clinic1
    },
  });
  console.log(`Created/Found staff user for ${clinic1.name}`);

  const staff2Password = 'staffpassword2';
  const hashedStaff2Password = await bcrypt.hash(staff2Password, saltRounds);
  await prisma.user.upsert({
    where: { email: 'staff1@happytails.vet'.toLowerCase() },
    update: {},
    create: {
      email: 'staff1@happytails.vet'.toLowerCase(),
      password: hashedStaff2Password,
      role: UserRole.STAFF,
      isActive: true,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      clinicId: clinic2.id, // Associate with clinic2
    },
  });
  console.log(`Created/Found staff user for ${clinic2.name}`);

  // --- Seed Owners, Pets, Visits (Loop for sample data) ---
  for (const clinic of [clinic1, clinic2]) {
    console.log(`Seeding data for clinic: ${clinic.name}`);
    
    for (let i = 0; i < 5; i++) { // Create 5 owners per clinic
      const owner = await prisma.owner.create({
        data: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: faker.internet.email()
            .toLowerCase(),
          phone: faker.phone.number(),
          clinicId: clinic.id,
          allowAutomatedReminders: true, // Default owners to allow reminders
        },
      });

      for (let j = 0; j < faker.number.int({ min: 1, max: 3 }); j++) { // 1-3 pets per owner
        const petSpecies = faker.helpers.arrayElement(['Dog', 'Cat']);
        const petName = petSpecies === 'Dog' ? faker.animal.dog() : faker.animal.cat();
        
        const dogBreeds = [
          'Labrador',
          'Poodle',
          'Golden Retriever',
          'Beagle',
          'Bulldog',
        ];
        
        const catBreeds = [
          'Siamese',
          'Persian',
          'Maine Coon',
          'Ragdoll',
          'Bengal',
        ];
        
        const petColors = [
          'Black',
          'White',
          'Brown',
          'Gray',
          'Spotted',
        ];
        
        const pet = await prisma.pet.create({
          data: {
            name: petName,
            species: petSpecies,
            breed: petSpecies === 'Dog' 
              ? faker.helpers.arrayElement(dogBreeds)
              : faker.helpers.arrayElement(catBreeds),
            dob: faker.date.past({ years: 5 }),
            gender: faker.helpers.arrayElement(['Male', 'Female']),
            color: faker.helpers.arrayElement(petColors),
            ownerId: owner.id,
          },
        });

        // Create past visits
        for (let k = 0; k < faker.number.int({ min: 1, max: 3 }); k++) { // 1-3 past visits per pet
          const visitDate = faker.date.past({ years: 1 });
          
          await prisma.visit.create({
            data: {
              visitDate: visitDate,
              visitType: faker.helpers.arrayElement(['vaccination', 'checkup', 'surgery', 'dental']),
              notes: faker.lorem.paragraph(),
              petId: pet.id,
              nextReminderDate: null, // No reminders for past visits
              isReminderEnabled: false,
            }
          });
        }
        
        // Create future visits with reminders (disabled)
        for (let k = 0; k < faker.number.int({ min: 0, max: 2 }); k++) { // 0-2 future visits per pet
          const visitDate = faker.date.future({ years: 1 });
          const nextReminderDate = faker.date.future({ years: 1, refDate: visitDate });
          
          await prisma.visit.create({
            data: {
              visitDate: visitDate,
              visitType: faker.helpers.arrayElement(['vaccination', 'checkup', 'surgery', 'dental']),
              notes: faker.lorem.paragraph(),
              petId: pet.id,
              nextReminderDate: nextReminderDate,
              isReminderEnabled: false, // *** Default reminders OFF in seed ***
            }
          });
        }
      }
    }
  }

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 