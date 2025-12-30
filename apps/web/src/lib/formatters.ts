/**
 * Formatting Utilities
 *
 * Centralized formatting functions to ensure consistency across the application.
 * These functions replace 15+ duplicate implementations across various components.
 */

/**
 * Format number as currency in SAR (Saudi Arabian Riyal)
 *
 * @param amount - The amount to format (number, string, null, or undefined)
 * @returns Formatted currency string (e.g., "SAR 1,234.56")
 *
 * @example
 * formatCurrency(1234.56) // "SAR 1,234.56"
 * formatCurrency("1234.56") // "SAR 1,234.56"
 * formatCurrency(undefined) // "SAR 0.00"
 * formatCurrency(null) // "SAR 0.00"
 */
export const formatCurrency = (
  amount: number | string | null | undefined
): string => {
  if (!amount && amount !== 0) return 'SAR 0.00';

  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;

  return `SAR ${Math.abs(numValue).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format date string to localized format
 *
 * @param dateString - ISO date string, null, or undefined
 * @param options - Formatting options
 * @param options.includeTime - Whether to include time in the output
 * @param options.format - Short or long date format
 * @returns Formatted date string or "N/A" for empty/invalid dates
 *
 * @example
 * formatDate('2024-01-15') // "Jan 15, 2024"
 * formatDate('2024-01-15', { format: 'long' }) // "January 15, 2024"
 * formatDate('2024-01-15T10:30:00', { includeTime: true }) // "Jan 15, 2024, 10:30 AM"
 * formatDate(undefined) // "N/A"
 * formatDate('invalid') // "invalid" (returns original string on error)
 */
export const formatDate = (
  dateString: string | null | undefined,
  options: {
    includeTime?: boolean;
    format?: 'short' | 'long';
  } = {}
): string => {
  if (!dateString) return 'N/A';

  try {
    const { includeTime = false, format = 'short' } = options;

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric',
    };

    if (includeTime) {
      dateOptions.hour = '2-digit';
      dateOptions.minute = '2-digit';
    }

    return new Date(dateString).toLocaleDateString('en-US', dateOptions);
  } catch {
    // Return original string if parsing fails
    return dateString;
  }
};

/**
 * Format date with optional time string appended
 *
 * Useful for displaying booking times, appointments, etc. where date and time
 * are stored separately.
 *
 * @param dateString - ISO date string, null, or undefined
 * @param timeString - Time string in HH:MM format (optional)
 * @returns Formatted date with time appended, or "N/A" for empty dates
 *
 * @example
 * formatDateTime('2024-01-15') // "Jan 15, 2024"
 * formatDateTime('2024-01-15', '14:30') // "Jan 15, 2024 14:30"
 * formatDateTime(undefined) // "N/A"
 * formatDateTime('invalid', '14:30') // "invalid" (returns original on error)
 */
export const formatDateTime = (
  dateString: string | null | undefined,
  timeString?: string
): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (timeString) {
      return `${datePart} ${timeString}`;
    }

    return datePart;
  } catch {
    // Return original string if parsing fails
    return dateString;
  }
};

/**
 * Parse date and time strings into a Date object
 *
 * Useful for creating Date objects from separate date and time inputs,
 * particularly for calendar and scheduling features.
 *
 * @param dateString - ISO date string
 * @param timeString - Time string in HH:MM format (optional)
 * @returns Date object with combined date and time
 *
 * @example
 * parseTime('2024-01-15') // Date object for Jan 15, 2024 00:00
 * parseTime('2024-01-15', '14:30') // Date object for Jan 15, 2024 14:30
 */
export const parseTime = (dateString: string, timeString?: string): Date => {
  const date = new Date(dateString);

  if (timeString) {
    const [hours, minutes] = timeString.split(':');
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  }

  return date;
};

/**
 * Check if a date falls in the current month and year
 *
 * Useful for filtering records, statistics, and date-based queries.
 *
 * @param dateString - ISO date string
 * @returns true if date is in current month and year, false otherwise
 *
 * @example
 * isCurrentMonth('2024-01-15') // true if current month is January 2024
 * isCurrentMonth('2023-12-31') // false if current year is 2024
 */
export const isCurrentMonth = (dateString: string): boolean => {
  const bookingDate = new Date(dateString);
  const now = new Date();

  return (
    bookingDate.getMonth() === now.getMonth() &&
    bookingDate.getFullYear() === now.getFullYear()
  );
};

/**
 * Format percentage with specified decimal places
 *
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(15.5) // "15.50%"
 * formatPercentage(15.5, 0) // "16%"
 * formatPercentage(15.5678, 3) // "15.568%"
 */
export const formatPercentage = (
  value: number,
  decimals: number = 2
): string => {
  return `${value.toFixed(decimals)}%`;
};
