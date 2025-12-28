/**
 * Quotation Utilities
 *
 * Utility functions for quotation-specific logic and formatting.
 * Centralizes status handling and display logic to ensure consistency.
 */

import type { BadgeProps } from '@/components/ui/badge';

/**
 * Get badge variant for quotation status
 *
 * @param status - The quotation status
 * @returns Badge variant that matches the status
 *
 * @example
 * getQuotationStatusVariant('Draft') // 'secondary'
 * getQuotationStatusVariant('Accepted') // 'default'
 */
export const getQuotationStatusVariant = (
  status: string
): BadgeProps['variant'] => {
  switch (status) {
    case 'Draft':
      return 'secondary';
    case 'Sent':
    case 'Pending':
    case 'Accepted':
      return 'default';
    case 'Rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

/**
 * Get Tailwind color class for quotation status
 *
 * @param status - The quotation status
 * @returns Tailwind background color class
 *
 * @example
 * getQuotationStatusColor('Draft') // 'bg-gray-500'
 * getQuotationStatusColor('Accepted') // 'bg-green-500'
 */
export const getQuotationStatusColor = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-500';
    case 'Sent':
      return 'bg-blue-500';
    case 'Accepted':
      return 'bg-green-500';
    case 'Rejected':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Get Tailwind color class for discount approval status
 *
 * @param status - The approval status
 * @returns Tailwind background color class
 *
 * @example
 * getDiscountApprovalStatusColor('Pending') // 'bg-yellow-500'
 * getDiscountApprovalStatusColor('Approved') // 'bg-green-500'
 */
export const getDiscountApprovalStatusColor = (status: string): string => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-500';
    case 'Approved':
      return 'bg-green-500';
    case 'Rejected':
      return 'bg-red-500';
    case 'Cancelled':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};
