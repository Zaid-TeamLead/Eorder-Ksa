/**
 * ButtonLoading Component
 *
 * A reusable loading indicator for buttons.
 * Displays a spinner with optional text.
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonLoadingProps {
  /**
   * Text to display next to spinner
   * @default undefined (no text, just spinner)
   */
  text?: string;

  /**
   * Size variant
   * @default "default"
   */
  size?: 'sm' | 'default' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  default: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/**
 * Displays a spinner for button loading states
 *
 * @example
 * // Just spinner
 * <Button disabled={isLoading}>
 *   {isLoading ? <ButtonLoading /> : "Submit"}
 * </Button>
 *
 * @example
 * // Spinner with text
 * <Button disabled={isLoading}>
 *   {isLoading ? <ButtonLoading text="Saving..." /> : "Save"}
 * </Button>
 *
 * @example
 * // Inline with conditional text
 * <Button disabled={isSearching}>
 *   <ButtonLoading className={isSearching ? "inline" : "hidden"} />
 *   {isSearching ? "Searching..." : "Search"}
 * </Button>
 */
export function ButtonLoading({
  text,
  size = 'default',
  className = '',
}: ButtonLoadingProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span>{text}</span>}
    </span>
  );
}
