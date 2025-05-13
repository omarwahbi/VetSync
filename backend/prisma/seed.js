"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const faker_1 = require("@faker-js/faker");
const prisma = new client_1.PrismaClient();
const saltRounds = 10;
async function main() {
    console.log(`Start seeding ...`);
    await prisma.visit.deleteMany();
    await prisma.pet.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.user.deleteMany();
    await prisma.clinic.deleteMany();
    console.log('Cleared existing data.');
    const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@petwellapp.com').toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const adminFirstName = process.env.SEED_ADMIN_FIRSTNAME || 'Platform';
    const adminLastName = process.env.SEED_ADMIN_LASTNAME || 'Admin';
    if (!adminEmail || !adminPassword) {
        console.warn('SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not found in environment variables. ' +
            'Skipping Platform Admin user creation/update.');
    }
    else {
        console.log(`Attempting to upsert admin user: ${adminEmail}`);
        const hashedAdminPassword = await bcrypt.hash(adminPassword, saltRounds);
        const adminUser = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                password: hashedAdminPassword,
                role: client_1.UserRole.ADMIN,
                isActive: true,
                firstName: adminFirstName,
                lastName: adminLastName,
            },
            create: {
                email: adminEmail,
                password: hashedAdminPassword,
                role: client_1.UserRole.ADMIN,
                isActive: true,
                firstName: adminFirstName,
                lastName: adminLastName,
                clinicId: null,
            },
        });
        console.log(`Successfully upserted admin user: ${adminUser.email}`);
    }
    const clinic1 = await prisma.clinic.upsert({
        where: { name: 'The Pawsitive Vet' },
        update: {},
        create: {
            id: 'clinic001',
            name: 'The Pawsitive Vet',
            address: faker_1.faker.location.streetAddress(),
            phone: faker_1.faker.phone.number(),
            isActive: true,
            subscriptionEndDate: faker_1.faker.date.future({ years: 1 }),
            canSendReminders: true,
        },
    });
    console.log(`Created/Found clinic: ${clinic1.name}`);
    const clinic2 = await prisma.clinic.upsert({
        where: { name: 'Happy Tails Clinic' },
        update: {},
        create: {
            id: 'clinic002',
            name: 'Happy Tails Clinic',
            address: faker_1.faker.location.streetAddress(),
            phone: faker_1.faker.phone.number(),
            isActive: true,
            subscriptionEndDate: faker_1.faker.date.future({ years: 1 }),
            canSendReminders: false,
        },
    });
    console.log(`Created/Found clinic: ${clinic2.name}`);
    const staff1Password = 'staffpassword1';
    const hashedStaff1Password = await bcrypt.hash(staff1Password, saltRounds);
    await prisma.user.upsert({
        where: { email: 'staff1@pawsitive.vet'.toLowerCase() },
        update: {},
        create: {
            email: 'staff1@pawsitive.vet'.toLowerCase(),
            password: hashedStaff1Password,
            role: client_1.UserRole.STAFF,
            isActive: true,
            firstName: faker_1.faker.person.firstName(),
            lastName: faker_1.faker.person.lastName(),
            clinicId: clinic1.id,
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
            role: client_1.UserRole.STAFF,
            isActive: true,
            firstName: faker_1.faker.person.firstName(),
            lastName: faker_1.faker.person.lastName(),
            clinicId: clinic2.id,
        },
    });
    console.log(`Created/Found staff user for ${clinic2.name}`);
    for (const clinic of [clinic1, clinic2]) {
        console.log(`Seeding data for clinic: ${clinic.name}`);
        for (let i = 0; i < 5; i++) {
            const owner = await prisma.owner.create({
                data: {
                    firstName: faker_1.faker.person.firstName(),
                    lastName: faker_1.faker.person.lastName(),
                    email: faker_1.faker.internet.email()
                        .toLowerCase(),
                    phone: faker_1.faker.phone.number(),
                    clinicId: clinic.id,
                    allowAutomatedReminders: true,
                },
            });
            for (let j = 0; j < faker_1.faker.number.int({ min: 1, max: 3 }); j++) {
                const petSpecies = faker_1.faker.helpers.arrayElement(['Dog', 'Cat']);
                const petName = petSpecies === 'Dog' ? faker_1.faker.animal.dog() : faker_1.faker.animal.cat();
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
                            ? faker_1.faker.helpers.arrayElement(dogBreeds)
                            : faker_1.faker.helpers.arrayElement(catBreeds),
                        dob: faker_1.faker.date.past({ years: 5 }),
                        gender: faker_1.faker.helpers.arrayElement(['Male', 'Female']),
                        color: faker_1.faker.helpers.arrayElement(petColors),
                        ownerId: owner.id,
                    },
                });
                for (let k = 0; k < faker_1.faker.number.int({ min: 1, max: 3 }); k++) {
                    const visitDate = faker_1.faker.date.past({ years: 1 });
                    await prisma.visit.create({
                        data: {
                            visitDate: visitDate,
                            visitType: faker_1.faker.helpers.arrayElement(['vaccination', 'checkup', 'surgery', 'dental']),
                            notes: faker_1.faker.lorem.paragraph(),
                            petId: pet.id,
                            nextReminderDate: null,
                            isReminderEnabled: false,
                        }
                    });
                }
                for (let k = 0; k < faker_1.faker.number.int({ min: 0, max: 2 }); k++) {
                    const visitDate = faker_1.faker.date.future({ years: 1 });
                    const nextReminderDate = faker_1.faker.date.future({ years: 1, refDate: visitDate });
                    await prisma.visit.create({
                        data: {
                            visitDate: visitDate,
                            visitType: faker_1.faker.helpers.arrayElement(['vaccination', 'checkup', 'surgery', 'dental']),
                            notes: faker_1.faker.lorem.paragraph(),
                            petId: pet.id,
                            nextReminderDate: nextReminderDate,
                            isReminderEnabled: false,
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
//# sourceMappingURL=seed.js.map