import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a phone number for WhatsApp's Click to Chat feature.
 * Specifically handles Iraqi phone numbers by:
 * 1. Removing all non-digit characters
 * 2. Removing leading zero if present
 * 3. Adding +964 prefix
 * @param phoneNumber The phone number to format (expected format: 07XXXXXXXX)
 * @returns Formatted number for WhatsApp URL or null if invalid
 */
export function formatPhoneNumberForWhatsApp(
  phoneNumber: string | null | undefined
): string | null {
  if (!phoneNumber) return null;

  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, "");

  // Basic validation for Iraqi numbers (should be 10 or 11 digits)
  if (digitsOnly.length < 10 || digitsOnly.length > 11) return null;

  // Remove leading zero if present
  const numberWithoutLeadingZero = digitsOnly.replace(/^0/, "");

  // Add 964 prefix
  return `964${numberWithoutLeadingZero}`;
}

/**
 * Standardized date formatting function for consistent display across the application.
 * Converts date strings to the user's local timezone and formats them for display.
 * @param dateString The date string to format (ISO 8601 format from API)
 * @param formatString The date-fns format string to use (defaults to 'dd-MM-yyyy' - e.g., "29-04-2023")
 * @returns Formatted date string in user's local timezone or fallback value if invalid
 */
export function formatDateForDisplay(
  dateString?: string | null,
  formatString: string = "dd-MM-yyyy"
): string {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

/**
 * Formats a date for display showing only the date portion (no time).
 * @param dateInput The date input to format (ISO string, Date object, or null/undefined)
 * @returns Formatted date string in user's local timezone or 'N/A' if invalid
 */
export function formatDisplayDate(
  dateInput: string | Date | null | undefined
): string {
  if (!dateInput) return "N/A";
  try {
    const date = new Date(dateInput);
    if (!isValid(date)) return "Invalid Date";
    // Format displays date like "29-04-2023"
    return format(date, "dd-MM-yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

/**
 * Formats a date for display showing both date and time.
 * @param dateInput The date input to format (ISO string, Date object, or null/undefined)
 * @returns Formatted date and time string in user's local timezone or 'N/A' if invalid
 */
export function formatDisplayDateTime(
  dateInput: string | Date | null | undefined
): string {
  if (!dateInput) return "N/A";
  try {
    const date = new Date(dateInput);
    if (!isValid(date)) return "Invalid Date";
    // Format displays date with time in a consistent format
    return format(date, "dd-MM-yyyy, h:mm a");
  } catch (error) {
    console.error("Error formatting date and time:", error);
    return "Invalid date";
  }
} 