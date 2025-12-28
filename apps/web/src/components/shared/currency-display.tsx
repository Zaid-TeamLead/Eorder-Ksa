/**
 * CurrencyDisplay Component
 *
 * A reusable component for displaying currency values with consistent formatting.
 * Uses the centralized formatCurrency utility.
 */

import { formatCurrency } from '@/lib/formatters';

interface CurrencyDisplayProps {
  /**
   * Amount to display (number, string, or undefined)
   */
  amount: number | string | undefined;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show + sign for positive numbers
   * @default false
   */
  showSign?: boolean;

  /**
   * Highlight negative numbers in red
   * @default false
   */
  highlightNegative?: boolean;
}

/**
 * Displays a formatted currency value with optional styling
 *
 * @example
 * <CurrencyDisplay amount={1234.56} />
 * // SAR 1,234.56
 *
 * @example
 * <CurrencyDisplay amount={1234.56} showSign highlightNegative />
 * // +SAR 1,234.56 (in default color)
 *
 * @example
 * <CurrencyDisplay amount={-1234.56} highlightNegative />
 * // SAR 1,234.56 (in red)
 */
export function CurrencyDisplay({
  amount,
  className = '',
  showSign = false,
  highlightNegative = false,
}: CurrencyDisplayProps) {
  const formatted = formatCurrency(amount);
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount || 0;

  let displayValue = formatted;
  if (showSign && numValue > 0) {
    displayValue = '+' + displayValue;
  }

  let classes = className;
  if (highlightNegative && numValue < 0) {
    classes += ' text-destructive';
  }

  return <span className={classes}>{displayValue}</span>;
}
