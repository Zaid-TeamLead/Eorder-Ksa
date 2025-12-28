/**
 * Formatting Utilities
 *
 * Centralized formatting functions to ensure consistency across the application.
 * These functions replace 15+ duplicate implementations across various components.
 */

/**
 * Format number as currency in SAR (Saudi Arabian Riyal)
 *
 * @param amount - The amount to format (number, string, or undefined)
 * @returns Formatted currency string (e.g., "SAR 1,234.56")
 *
 * @example
 * formatCurrency(1234.56) // "SAR 1,234.56"
 * formatCurrency("1234.56") // "SAR 1,234.56"
 * formatCurrency(undefined) // "SAR 0.00"
 */
export const formatCurrency = (
  amount: number | string | undefined
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
 * @param dateString - ISO date string or undefined
 * @param options - Formatting options
 * @param options.includeTime - Whether to include time in the output
 * @param options.format - Short or long date format
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15') // "Jan 15, 2024"
 * formatDate('2024-01-15', { format: 'long' }) // "January 15, 2024"
 * formatDate('2024-01-15T10:30:00', { includeTime: true }) // "Jan 15, 2024, 10:30 AM"
 * formatDate(undefined) // "N/A"
 */
export const formatDate = (
  dateString: string | undefined,
  options: {
    includeTime?: boolean;
    format?: 'short' | 'long';
  } = {}
): string => {
  if (!dateString) return 'N/A';

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
