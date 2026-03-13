/**
 * Quotation Constants
 *
 * Centralized constants for quotation module to ensure consistency
 * and make maintenance easier.
 */

/**
 * Quotation status values
 */
export const QUOTATION_STATUS = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  SUPERSEDED: 'Superseded',
  CANCELLED: 'Cancelled',
} as const;

/**
 * Discount approval status values
 */
export const APPROVAL_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
} as const;

/**
 * Line item types for quotations
 */
export const LINE_ITEM_TYPES = {
  VEHICLE: 'Vehicle',
  ACCESSORY: 'Accessory',
  SERVICE: 'Service',
  WARRANTY: 'Warranty',
  INSURANCE: 'Insurance',
} as const;

/**
 * Default tax rate for Saudi Arabia (15% VAT)
 */
export const DEFAULT_TAX_RATE = 15;

/**
 * Type-safe status types
 */
export type QuotationStatus = (typeof QUOTATION_STATUS)[keyof typeof QUOTATION_STATUS];
export type ApprovalStatus = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];
export type LineItemType = (typeof LINE_ITEM_TYPES)[keyof typeof LINE_ITEM_TYPES];
