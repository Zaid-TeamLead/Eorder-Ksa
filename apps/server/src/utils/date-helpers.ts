/**
 * Date and time formatting utilities for SAP HANA database
 * Centralizes all date formatting logic to eliminate duplication
 */

/**
 * Get current timestamp in HANA-compatible format (YYYY-MM-DD HH:MM:SS)
 * @returns Formatted timestamp string
 * @example
 * getCurrentTimestamp() // "2025-12-23 10:30:45"
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Format date and time into HANA SECONDDATE format
 * Used for test drive bookings with optional time component
 *
 * @param date Date in YYYY-MM-DD format
 * @param time Optional time in HH:MM or HH:MM:SS format
 * @returns Formatted datetime string or null if date is missing
 *
 * @example
 * formatDateTime('2025-12-23', '14:30') // "2025-12-23 14:30:00"
 * formatDateTime('2025-12-23', '14:30:45') // "2025-12-23 14:30:45"
 * formatDateTime('2025-12-23') // "2025-12-23 00:00:00"
 * formatDateTime(undefined) // null
 */
export function formatDateTime(date: string | undefined, time?: string): string | null {
  if (!date) return null;

  let timePart = '00:00:00';
  if (time) {
    const timeParts = time.split(':');
    if (timeParts.length === 2) {
      // HH:MM format, append :00
      timePart = `${time}:00`;
    } else if (timeParts.length === 3) {
      // HH:MM:SS format, use as is
      timePart = time;
    }
    // Invalid format defaults to 00:00:00
  }

  return `${date} ${timePart}`;
}

/**
 * Format date and time with validation (throws on missing date)
 * Used when date is required and should not be null
 *
 * @param date Date in YYYY-MM-DD format (required)
 * @param time Optional time in HH:MM or HH:MM:SS format
 * @returns Formatted datetime string
 * @throws Error if date is missing
 *
 * @example
 * formatDateTimeRequired('2025-12-23', '14:30') // "2025-12-23 14:30:00"
 * formatDateTimeRequired('') // throws Error: 'Date is required'
 */
export function formatDateTimeRequired(date: string, time?: string): string {
  if (!date) {
    throw new Error('Date is required');
  }
  return formatDateTime(date, time) as string;
}
