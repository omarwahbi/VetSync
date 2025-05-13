"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReminderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const twilio_1 = require("twilio");
const date_fns_1 = require("date-fns");
let ReminderService = ReminderService_1 = class ReminderService {
    prisma;
    configService;
    schedulerRegistry;
    logger = new common_1.Logger(ReminderService_1.name);
    twilioClient;
    constructor(prisma, configService, schedulerRegistry) {
        this.prisma = prisma;
        this.configService = configService;
        this.schedulerRegistry = schedulerRegistry;
        const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
        if (!accountSid || !authToken) {
            this.logger.error('Twilio credentials missing in .env file');
        }
        else {
            this.twilioClient = new twilio_1.Twilio(accountSid, authToken);
            this.logger.log('Twilio client initialized.');
        }
    }
    formatPhoneNumber(phoneNumber) {
        if (!phoneNumber)
            return '';
        let digitsOnly = phoneNumber.replace(/\D/g, '');
        if (digitsOnly.startsWith('0')) {
            digitsOnly = digitsOnly.substring(1);
        }
        if (!digitsOnly.startsWith('964') && !digitsOnly.startsWith('+964')) {
            digitsOnly = `964${digitsOnly}`;
        }
        if (!digitsOnly.startsWith('+')) {
            digitsOnly = `+${digitsOnly}`;
        }
        return digitsOnly;
    }
    async resetMonthlyReminderCounts() {
        this.logger.log('Running daily check for reminder cycle resets...');
        const now = new Date();
        const startOfToday = (0, date_fns_1.startOfDay)(now);
        const activeClinicsWithLimits = await this.prisma.clinic.findMany({
            where: {
                isActive: true,
                subscriptionEndDate: { gte: now },
                reminderMonthlyLimit: { gt: 0 },
                currentCycleStartDate: { not: null },
            },
            select: { id: true, currentCycleStartDate: true },
        });
        let resetCount = 0;
        for (const clinic of activeClinicsWithLimits) {
            const nextCycleStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.addMonths)(clinic.currentCycleStartDate, 1));
            if ((0, date_fns_1.isAfter)(startOfToday, nextCycleStartDate) ||
                startOfToday.getTime() === nextCycleStartDate.getTime()) {
                this.logger.log(`Resetting counter for Clinic ${clinic.id}. Cycle started ${String(clinic.currentCycleStartDate)}, next start was ${String(nextCycleStartDate)}`);
                try {
                    await this.prisma.clinic.update({
                        where: { id: clinic.id },
                        data: {
                            reminderSentThisCycle: 0,
                            currentCycleStartDate: startOfToday,
                        },
                    });
                    resetCount++;
                }
                catch (error) {
                    this.logger.error(`Failed to reset counter for clinic ${clinic.id}`, error);
                }
            }
        }
        this.logger.log(`Reminder cycle reset check complete. Reset counters for ${resetCount} clinics.`);
    }
    async handleScheduledReminders() {
        this.logger.log('Running scheduled reminder check for visits in the next 24 hours...');
        try {
            const now = new Date();
            const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const tomorrowUtc = new Date(todayUtc);
            tomorrowUtc.setUTCDate(tomorrowUtc.getUTCDate() + 1);
            tomorrowUtc.setUTCHours(23, 59, 59, 999);
            this.logger.log(`Reminder Query UTC Range: Start=${todayUtc.toISOString()}, End=${tomorrowUtc.toISOString()}`);
            const visitsNeedingReminders = await this.prisma.visit.findMany({
                where: {
                    reminderSent: false,
                    isReminderEnabled: true,
                    nextReminderDate: {
                        gte: todayUtc,
                        lte: tomorrowUtc,
                    },
                    pet: {
                        owner: {
                            allowAutomatedReminders: true,
                            clinic: {
                                isActive: true,
                                canSendReminders: true,
                                AND: [
                                    { subscriptionEndDate: { not: null } },
                                    { subscriptionEndDate: { gte: now } },
                                ],
                            },
                        },
                    },
                },
                include: {
                    pet: {
                        include: {
                            owner: {
                                include: {
                                    clinic: {
                                        select: {
                                            id: true,
                                            name: true,
                                            phone: true,
                                            isActive: true,
                                            canSendReminders: true,
                                            subscriptionEndDate: true,
                                            reminderMonthlyLimit: true,
                                            reminderSentThisCycle: true,
                                            currentCycleStartDate: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            this.logger.log(`Found ${visitsNeedingReminders.length} visits needing reminders`);
            const twilioWhatsAppNumber = this.configService.get('TWILIO_WHATSAPP_NUMBER');
            if (!twilioWhatsAppNumber) {
                this.logger.error('Twilio WhatsApp number missing in .env file');
                return;
            }
            for (const visit of visitsNeedingReminders) {
                const ownerPhone = visit.pet.owner.phone;
                const clinic = visit.pet.owner.clinic;
                if (!ownerPhone || !ownerPhone.trim()) {
                    this.logger.warn(`No phone number for owner of pet ${visit.pet.name} (Visit ID: ${visit.id})`);
                    continue;
                }
                if (!this.twilioClient) {
                    this.logger.error('Twilio client not initialized. Cannot send WhatsApp reminders.');
                    continue;
                }
                if (clinic.reminderMonthlyLimit === 0) {
                    this.logger.warn(`Clinic ${clinic.name} (ID: ${clinic.id}) has reminder limit set to 0. Skipping reminder for visit ${visit.id}.`);
                    await this.prisma.visit.update({
                        where: { id: visit.id },
                        data: { reminderSent: true },
                    });
                    continue;
                }
                if (clinic.reminderMonthlyLimit > 0 &&
                    clinic.reminderSentThisCycle >= clinic.reminderMonthlyLimit) {
                    this.logger.warn(`Clinic ${clinic.name} (ID: ${clinic.id}) has reached their monthly reminder limit (${clinic.reminderSentThisCycle}/${clinic.reminderMonthlyLimit}). Skipping reminder for visit ${visit.id}.`);
                    await this.prisma.visit.update({
                        where: { id: visit.id },
                        data: { reminderSent: true },
                    });
                    continue;
                }
                const formattedPhone = this.formatPhoneNumber(ownerPhone);
                const whatsappTo = `whatsapp:${formattedPhone}`;
                const whatsappFrom = `whatsapp:${twilioWhatsAppNumber}`;
                this.logger.log(`Formatting phone number: ${ownerPhone} -> ${formattedPhone}`);
                const petName = visit.pet.name || '[Pet Name Unavailable]';
                const clinicName = clinic.name || '[Clinic Name Unavailable]';
                const clinicPhone = clinic.phone || '[Clinic Phone Unavailable]';
                const visitType = visit.visitType || 'health check';
                const formattedDueDate = visit.nextReminderDate
                    ? visit.nextReminderDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })
                    : 'soon';
                const message = `عيادة ${clinicName}:\n` +
                    `لديك زيارة ${visitType} الخاصة بـ${petName} بتاريخ ${formattedDueDate}.\n` +
                    (clinicPhone ? `رقم العيادة: ${clinicPhone}\n` : '') +
                    `*هذه رسالة آلية يرجى عدم الرد*`;
                try {
                    const sentMessage = await this.twilioClient.messages.create({
                        body: message,
                        from: whatsappFrom,
                        to: whatsappTo,
                    });
                    this.logger.log(`WhatsApp reminder sent to ${whatsappTo} for pet ${petName}. Twilio SID: ${sentMessage.sid}`);
                    await this.prisma.visit.update({
                        where: { id: visit.id },
                        data: { reminderSent: true },
                    });
                    if (clinic.reminderMonthlyLimit > 0) {
                        await this.prisma.clinic.update({
                            where: { id: clinic.id },
                            data: { reminderSentThisCycle: { increment: 1 } },
                        });
                        this.logger.log(`Incremented reminder counter for clinic ${clinic.name} (ID: ${clinic.id}) to ${clinic.reminderSentThisCycle + 1}/${clinic.reminderMonthlyLimit}.`);
                    }
                }
                catch (error) {
                    const twilioError = error;
                    this.logger.error(`Failed to send WhatsApp reminder to ${whatsappTo}: Code=${twilioError?.code}, Status=${twilioError?.status}, Message=${twilioError.message}`);
                    await this.prisma.visit.update({
                        where: { id: visit.id },
                        data: {
                            reminderSent: true
                        },
                    });
                }
            }
        }
        catch (error) {
            this.logger.error(`Error in reminder service: ${error.message}`);
        }
    }
};
exports.ReminderService = ReminderService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_4AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderService.prototype, "resetMonthlyReminderCounts", null);
__decorate([
    (0, schedule_1.Cron)('0 13 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderService.prototype, "handleScheduledReminders", null);
exports.ReminderService = ReminderService = ReminderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        schedule_1.SchedulerRegistry])
], ReminderService);
//# sourceMappingURL=reminder.service.js.map