import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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