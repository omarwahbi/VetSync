"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const prisma = new client_1.PrismaClient();
const logger = new common_1.Logger('LowercaseEmails');
async function main() {
    logger.log('Starting email normalization script');
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    let updatedCount = 0;
    logger.log(`Found ${users.length} users to process`);
    for (const user of users) {
        if (user.email && user.email !== user.email.toLowerCase()) {
            try {
                const lowerCaseEmail = user.email.toLowerCase();
                const conflictUser = await prisma.user.findFirst({
                    where: {
                        email: lowerCaseEmail,
                        id: { not: user.id }
                    }
                });
                if (conflictUser) {
                    logger.warn(`Conflict detected: Cannot convert email for user ${user.id}. ` +
                        `Email ${user.email} would conflict with existing user ${conflictUser.id} using ${lowerCaseEmail}`);
                    continue;
                }
                await prisma.user.update({
                    where: { id: user.id },
                    data: { email: lowerCaseEmail },
                });
                logger.log(`Updated email for user ${user.id}: ${user.email} → ${lowerCaseEmail}`);
                updatedCount++;
            }
            catch (e) {
                logger.error(`Error updating email for ${user.id}:`, e);
            }
        }
    }
    logger.log(`Email normalization complete. Lowercased ${updatedCount} email addresses.`);
}
main()
    .catch(e => logger.error('Script execution failed:', e))
    .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=lowercase-emails.js.map