import { z } from 'zod';

// ============================================================================
// Line Item Schema
// ============================================================================

export const lineItemFormSchema = z.object({
  lineNumber: z.number().int().positive(),
  itemType: z.enum(['Vehicle']),
  itemCode: z.string().optional(),
  itemDescription: z.string().min(1, 'Item description is required').max(500),
  itemCategory: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  discountAmount: z.number().max(0, 'Discount amount must be negative or zero').default(0),
  discountPercentage: z.number().min(0).max(100).default(0),
  netPrice: z.number().nonnegative('Net price cannot be negative'),
  taxIncluded: z.enum(['Y', 'N']).default('N').optional(),
  manufacturer: z.string().optional(),
  partNumber: z.string().optional(),
  warrantyPeriod: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// Main Quotation Form Schema
// ============================================================================

export const quotationFormSchema = z.object({
  // Required: Enquiry reference (passed as URL param or hidden field)
  enquirySlno: z.number().int().positive(),

  // Customer Information (pre-populated from enquiry, editable)
  customerName: z.string().optional(),
  customerMobile: z.string().optional(),
  customerEmail: z.string().email('Invalid email address').or(z.literal('')).optional(),
  customerAddress: z.string().optional(),

  // Vehicle Information (pre-populated from enquiry, editable)
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleVariant: z.string().optional(),
  vehicleYear: z.string().optional(),
  vehicleColor: z.string().optional(),
  vinNumber: z.string().optional(),

  // Vehicle Pricing
  vehicleBasePrice: z.number().nonnegative('Vehicle base price cannot be negative'),
  vehicleDiscount: z.number().max(0, 'Vehicle discount must be negative or zero').default(0),
  vehicleNetPrice: z.number().nonnegative('Vehicle net price cannot be negative'),

  // Accessories Pricing
  accessoriesTotal: z.number().nonnegative().default(0),
  accessoriesDiscount: z.number().max(0).default(0),
  accessoriesNetTotal: z.number().nonnegative().default(0),

  // Other Components
  warrantyTotal: z.number().nonnegative().default(0),
  insuranceTotal: z.number().nonnegative().default(0),

  // Total Calculations
  subtotal: z.number().nonnegative('Subtotal cannot be negative'),
  taxRate: z.number().min(0).max(100).default(15),
  taxAmount: z.number().nonnegative('Tax amount cannot be negative'),
  grandTotal: z.number().nonnegative('Grand total cannot be negative'),

  // Trade-in & Financing
  tradeInValue: z.number().nonnegative().default(0),
  tradeInAppraisalSlno: z.number().int().positive().optional(),
  financingSchemeSlno: z.number().int().positive().optional(),
  downpayment: z.number().nonnegative().default(0),
  netAmountDue: z.number().nonnegative('Net amount due cannot be negative'),

  // Discount Summary
  totalDiscountAmount: z.number().max(0).default(0),
  discountPercentage: z.number().min(0).max(100).default(0),

  // Quotation Details
  validUntil: z.string().optional(),
  notes: z.string().max(10000).optional(),
  termsAndConditions: z.string().max(10000).optional(),
  internalNotes: z.string().max(10000).optional(),

  // Supersede (for creating new versions)
  supersedeReason: z.string().min(10, 'Reason must be at least 10 characters').optional(),

  // Line Items (at least one required)
  lineItems: z.array(lineItemFormSchema).min(1, 'At least one line item is required'),
});

// ============================================================================
// Discount Approval Request Schema
// ============================================================================

export const discountApprovalRequestFormSchema = z.object({
  discountAmount: z.number().negative('Discount amount must be negative'),
  discountPercentage: z.number().min(0).max(100),
  justification: z
    .string()
    .min(10, 'Justification must be at least 10 characters')
    .max(5000),
  assignedTo: z.string().min(1, 'Manager to approve is required'),
});

// ============================================================================
// Approve/Reject Discount Schema
// ============================================================================

export const approveDiscountFormSchema = z
  .object({
    approvalStatus: z.enum(['Approved', 'Rejected']),
    approvalNotes: z.string().max(5000).optional(),
    rejectionReason: z.string().max(5000).optional(),
  })
  .refine(
    (data) => {
      if (data.approvalStatus === 'Rejected') {
        return !!data.rejectionReason && data.rejectionReason.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when rejecting a discount request',
      path: ['rejectionReason'],
    }
  );

// ============================================================================
// Pass to Cashier Schema
// ============================================================================

export const passToCashierFormSchema = z.object({
  depositAmount: z.number().nonnegative().optional(),
  notes: z.string().max(5000).optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type QuotationFormData = z.infer<typeof quotationFormSchema>;
export type LineItemFormData = z.infer<typeof lineItemFormSchema>;
export type DiscountApprovalRequestFormData = z.infer<typeof discountApprovalRequestFormSchema>;
export type ApproveDiscountFormData = z.infer<typeof approveDiscountFormSchema>;
export type PassToCashierFormData = z.infer<typeof passToCashierFormSchema>;

// ============================================================================
// Default Values
// ============================================================================

export const defaultLineItem: Partial<LineItemFormData> = {
  lineNumber: 1,
  itemType: 'Vehicle',
  quantity: 1,
  unitPrice: 0,
  discountAmount: 0,
  discountPercentage: 0,
  netPrice: 0,
  taxIncluded: 'N',
};

export const defaultQuotationFormValues: Partial<QuotationFormData> = {
  vehicleDiscount: 0,
  accessoriesTotal: 0,
  accessoriesDiscount: 0,
  accessoriesNetTotal: 0,
  warrantyTotal: 0,
  insuranceTotal: 0,
  taxRate: 15,
  tradeInValue: 0,
  downpayment: 0,
  totalDiscountAmount: 0,
  discountPercentage: 0,
  lineItems: [],
};
