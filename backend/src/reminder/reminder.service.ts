import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Twilio } from 'twilio';

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

  // Run once every day at 1 pm
  @Cron('0 13 * * *')
  async handleScheduledReminders() {
    this.logger.log('Running scheduled reminder check...');
    try {
      // Get current time reference point using UTC internally
      const now = new Date();

      // Calculate date range for reminders (visits due within the next 2 days)
      // Start with today's date in UTC (midnight)
      const todayUtc = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      
      // End date is end of day 2 days from now
      const twoDaysLaterUtc = new Date(todayUtc);
      twoDaysLaterUtc.setUTCDate(twoDaysLaterUtc.getUTCDate() + 2);
      twoDaysLaterUtc.setUTCHours(23, 59, 59, 999); // End of the day 2 days from now
      
      // Add logging to verify the calculated range
      this.logger.log(
        `Reminder Query UTC Range: Start=${todayUtc.toISOString()}, End=${twoDaysLaterUtc.toISOString()}`,
      );
      
      // Query visits that need reminders
      const visitsNeedingReminders = await this.prisma.visit.findMany({
        where: {
          reminderSent: false,
          isReminderEnabled: true,
          nextReminderDate: {
            gte: todayUtc,
            lte: twoDaysLaterUtc,
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
                  clinic: true,
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
        
        // Format phone numbers for WhatsApp
        const formattedPhone = this.formatPhoneNumber(ownerPhone);
        const whatsappTo = `whatsapp:${formattedPhone}`;
        const whatsappFrom = `whatsapp:${twilioWhatsAppNumber}`;
        
        this.logger.log(`Formatting phone number: ${ownerPhone} -> ${formattedPhone}`);
        
        // Add fallbacks for potentially missing data
        const petName = visit.pet.name || '[Pet Name Unavailable]';
        const clinicName = visit.pet.owner.clinic.name || '[Clinic Name Unavailable]';
        const clinicPhone = visit.pet.owner.clinic.phone || '[Clinic Phone Unavailable]';
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
        const message = `Reminder from ${clinicName}: ${petName}'s ${visitType} visit is due on ${formattedDueDate}. Please call us at ${clinicPhone} to schedule.`;
        
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
      this.logger.error(`Error in reminder service: ${(error as Error).message}`);
    }
  }
}
