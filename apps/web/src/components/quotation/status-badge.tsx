/**
 * QuotationStatusBadge Component
 *
 * A consistent badge component for displaying quotation status.
 * Uses centralized status utilities for consistent styling.
 */

import { Badge } from '@/components/ui/badge';
import { getQuotationStatusVariant } from '@/lib/quotation-utils';

interface QuotationStatusBadgeProps {
  /**
   * Quotation status to display
   */
  status: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Displays a styled badge for quotation status
 *
 * @example
 * <QuotationStatusBadge status="Draft" />
 * <QuotationStatusBadge status="Accepted" className="ml-2" />
 */
export function QuotationStatusBadge({
  status,
  className,
}: QuotationStatusBadgeProps) {
  const variant = getQuotationStatusVariant(status);

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}
