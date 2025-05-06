import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Twilio } from 'twilio';
import { addMonths, isAfter, startOfDay } from 'date-fns';

// Interface for Twilio error type
interface TwilioError extends Error {
  code?: string;
  status?: number;
  message: string;
}

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);
  private twilioClient: Twilio;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    
    if (!accountSid || !authToken) {
      this.logger.error('Twilio credentials missing in .env file');
      // Handle this error appropriately - maybe disable the service?
    } else {
      this.twilioClient = new Twilio(accountSid, authToken);
      this.logger.log('Twilio client initialized.');
    }
  }

  // Helper method to format phone numbers for WhatsApp
  private formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove any non-digit characters
    let digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Remove leading zero if present
    if (digitsOnly.startsWith('0')) {
      digitsOnly = digitsOnly.substring(1);
    }
    
    // If the number doesn't have a country code (assuming Iraq +964)
    // and starts with 7, add the country code
    if (!digitsOnly.startsWith('964') && !digitsOnly.startsWith('+964')) {
      digitsOnly = `964${digitsOnly}`;
    }
    
    // Ensure the number starts with + for E.164 format
    if (!digitsOnly.startsWith('+')) {
      digitsOnly = `+${digitsOnly}`;
    }
    
    return digitsOnly;
  }

  // Reset monthly reminder counts - runs daily at 4 AM
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async resetMonthlyReminderCounts() {
    this.logger.log('Running daily check for reminder cycle resets...');
    const now = new Date();
    const startOfToday = startOfDay(now); // Use start of day for comparison robustness

    const activeClinicsWithLimits = await this.prisma.clinic.findMany({
      where: {
        isActive: true,
        subscriptionEndDate: { gte: now }, // Still subscribed
        reminderMonthlyLimit: { gt: 0 }, // Has a limit
        currentCycleStartDate: { not: null }, // Cycle must have been started
      },
      select: { id: true, currentCycleStartDate: true },
    });

    let resetCount = 0;
    for (const clinic of activeClinicsWithLimits) {
      // Calculate when the *next* cycle SHOULD start (approx 1 month after current start)
      // date-fns handles month lengths correctly
      const nextCycleStartDate = startOfDay(
        addMonths(clinic.currentCycleStartDate!, 1),
      );

      // Check if today IS ON or AFTER the day the next cycle should start
      if (
        isAfter(startOfToday, nextCycleStartDate) ||
        startOfToday.getTime() === nextCycleStartDate.getTime()
      ) {
        this.logger.log(
          `Resetting counter for Clinic ${clinic.id}. Cycle started ${String(clinic.currentCycleStartDate)}, next start was ${String(nextCycleStartDate)}`,
        );
        try {
          await this.prisma.clinic.update({
            where: { id: clinic.id },
            data: {
              reminderSentThisCycle: 0,
              currentCycleStartDate: startOfToday, // Start new cycle today
            },
          });
          resetCount++;
        } catch (error) {
          this.logger.error(
            `Failed to reset counter for clinic ${clinic.id}`,
            error,
          );
        }
      }
    }
    this.logger.log(
      `Reminder cycle reset check complete. Reset counters for ${resetCount} clinics.`,
    );
  }

  // Run once every day at 1 pm to check for visits in the next 24 hours
  @Cron('0 13 * * *')
  async handleScheduledReminders() {
    this.logger.log(
      'Running scheduled reminder check for visits in the next 24 hours...',
    );
    try {
      // Get current time reference point using UTC internally
      const now = new Date();

      // Calculate date range for reminders (visits due within the next 24 hours)
      // Start with today's date in UTC (midnight)
      const todayUtc = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      
      // End date is end of day tomorrow (24 hours from now)
      const tomorrowUtc = new Date(todayUtc);
      tomorrowUtc.setUTCDate(tomorrowUtc.getUTCDate() + 1);
      tomorrowUtc.setUTCHours(23, 59, 59, 999); // End of tomorrow
      
      // Add logging to verify the calculated range
      this.logger.log(
        `Reminder Query UTC Range: Start=${todayUtc.toISOString()}, End=${tomorrowUtc.toISOString()}`,
      );
      
      // Query visits that need reminders
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
      
      this.logger.log(
        `Found ${visitsNeedingReminders.length} visits needing reminders`,
      );
      
      // Get WhatsApp number from env
      const twilioWhatsAppNumber = this.configService.get<string>(
        'TWILIO_WHATSAPP_NUMBER',
      );
      
      if (!twilioWhatsAppNumber) {
        this.logger.error('Twilio WhatsApp number missing in .env file');
        return;
      }
      
      // Process each visit and send reminder
      for (const visit of visitsNeedingReminders) {
        const ownerPhone = visit.pet.owner.phone;
        const clinic = visit.pet.owner.clinic;
        
        // Basic validation for phone number
        if (!ownerPhone || !ownerPhone.trim()) {
          this.logger.warn(
            `No phone number for owner of pet ${visit.pet.name} (Visit ID: ${visit.id})`,
          );
          continue;
        }
        
        if (!this.twilioClient) {
          this.logger.error(
            'Twilio client not initialized. Cannot send WhatsApp reminders.',
          );
          continue;
        }

        // Check if clinic has reached their monthly limit
        if (clinic.reminderMonthlyLimit === 0) {
          this.logger.warn(
            `Clinic ${clinic.name} (ID: ${clinic.id}) has reminder limit set to 0. Skipping reminder for visit ${visit.id}.`,
          );
          // Mark the reminder as sent to avoid retries
          await this.prisma.visit.update({
            where: { id: visit.id },
            data: { reminderSent: true },
          });
          continue;
        }

        // Check if clinic has a limit and if it's reached
        if (clinic.reminderMonthlyLimit > 0 && 
            clinic.reminderSentThisCycle >= clinic.reminderMonthlyLimit) {
          this.logger.warn(
            `Clinic ${clinic.name} (ID: ${clinic.id}) has reached their monthly reminder limit (${clinic.reminderSentThisCycle}/${clinic.reminderMonthlyLimit}). Skipping reminder for visit ${visit.id}.`,
          );
          // Mark the reminder as sent to avoid retries
          await this.prisma.visit.update({
            where: { id: visit.id },
            data: { reminderSent: true },
          });
          continue;
        }
        
        // Format phone numbers for WhatsApp
        const formattedPhone = this.formatPhoneNumber(ownerPhone);
        const whatsappTo = `whatsapp:${formattedPhone}`;
        const whatsappFrom = `whatsapp:${twilioWhatsAppNumber}`;
        
        this.logger.log(`Formatting phone number: ${ownerPhone} -> ${formattedPhone}`);
        
        // Add fallbacks for potentially missing data
        const petName = visit.pet.name || '[Pet Name Unavailable]';
        const clinicName = clinic.name || '[Clinic Name Unavailable]';
        const clinicPhone = clinic.phone || '[Clinic Phone Unavailable]';
        const visitType = visit.visitType || 'health check';
        
        // Format the date consistently for the message
        const formattedDueDate = visit.nextReminderDate
          ? visit.nextReminderDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'soon';
        
        // Format the reminder message with the formatted date and fallbacks
        const message = 
          `عيادة ${clinicName}:\n` +
                  `لديك زيارة ${visitType} الخاصة بـ${petName} بتاريخ ${formattedDueDate}.\n` +
                  (clinicPhone ? `رقم العيادة: ${clinicPhone}\n` : '') +  
                  `*هذه رسالة آلية يرجى عدم الرد*`;
        try {
          // Send the message via Twilio WhatsApp
          const sentMessage = await this.twilioClient.messages.create({
            body: message,
            from: whatsappFrom,
            to: whatsappTo,
          });
          
          this.logger.log(
            `WhatsApp reminder sent to ${whatsappTo} for pet ${petName}. Twilio SID: ${sentMessage.sid}`,
          );
          
          // Update the visit record to mark reminder as sent
          await this.prisma.visit.update({
            where: { id: visit.id },
            data: { reminderSent: true },
          });

          // If clinic has a limit, increment their counter
          if (clinic.reminderMonthlyLimit > 0) {
            await this.prisma.clinic.update({
              where: { id: clinic.id },
              data: { reminderSentThisCycle: { increment: 1 } },
            });
            this.logger.log(
              `Incremented reminder counter for clinic ${clinic.name} (ID: ${clinic.id}) to ${clinic.reminderSentThisCycle + 1}/${clinic.reminderMonthlyLimit}.`,
            );
          }
          
        } catch (error) {
          const twilioError = error as TwilioError;
          this.logger.error(
            `Failed to send WhatsApp reminder to ${whatsappTo}: Code=${twilioError?.code}, Status=${twilioError?.status}, Message=${twilioError.message}`,
          );
          // Mark the reminderSent as true to prevent retries
          await this.prisma.visit.update({
            where: { id: visit.id },
            data: { 
              reminderSent: true
            },
          });
          // No more retries for failed reminders
        }
      }
      
    } catch (error) {
      this.logger.error(
        `Error in reminder service: ${(error as Error).message}`,
      );
    }
  }
}
