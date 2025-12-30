import { z } from 'zod';

// ============================================================================
// Helper Functions
// ============================================================================

// Helper for optional numeric fields - converts empty string to undefined
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    return val;
  }, schema.optional());

// ============================================================================
// Line Item Schema
// ============================================================================

export const lineItemFormSchema = z.object({
  lineNumber: z.coerce.number().int().positive(),
  itemType: z.enum(['Vehicle']),
  itemCode: z.string().optional(),
  itemDescription: z.string().min(1, 'Item description is required').max(500),
  itemCategory: z.string().optional(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.coerce.number().nonnegative('Unit price cannot be negative'),
  discountAmount: z.coerce.number().max(0, 'Discount amount must be negative or zero').default(0),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),
  netPrice: z.coerce.number().nonnegative('Net price cannot be negative'),
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
  enquirySlno: z.coerce.number().int().positive(),

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
  vehicleBasePrice: z.coerce.number().nonnegative('Vehicle base price cannot be negative'),
  vehicleDiscount: z.coerce.number().max(0, 'Vehicle discount must be negative or zero').default(0),
  vehicleNetPrice: z.coerce.number().nonnegative('Vehicle net price cannot be negative'),

  // Accessories Pricing
  accessoriesTotal: z.coerce.number().nonnegative().default(0),
  accessoriesDiscount: z.coerce.number().max(0).default(0),
  accessoriesNetTotal: z.coerce.number().nonnegative().default(0),

  // Other Components
  warrantyTotal: z.coerce.number().nonnegative().default(0),
  insuranceTotal: z.coerce.number().nonnegative().default(0),

  // Total Calculations
  subtotal: z.coerce.number().nonnegative('Subtotal cannot be negative'),
  taxRate: z.coerce.number().min(0).max(100).default(15),
  taxAmount: z.coerce.number().nonnegative('Tax amount cannot be negative'),
  grandTotal: z.coerce.number().nonnegative('Grand total cannot be negative'),

  // Trade-in & Financing
  tradeInValue: z.coerce.number().nonnegative().default(0),
  tradeInAppraisalSlno: optionalNumber(z.coerce.number().int().positive()),
  financingSchemeSlno: optionalNumber(z.coerce.number().int().positive()),
  downpayment: z.coerce.number().nonnegative().default(0),
  netAmountDue: z.coerce.number().nonnegative('Net amount due cannot be negative'),

  // Discount Summary
  totalDiscountAmount: z.coerce.number().max(0).default(0),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),

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
  itemCode: '',
  itemDescription: '',
  itemCategory: '',
  quantity: 1,
  unitPrice: 0,
  discountAmount: 0,
  discountPercentage: 0,
  netPrice: 0,
  taxIncluded: 'N',
  manufacturer: '',
  partNumber: '',
  warrantyPeriod: '',
  notes: '',
};

export const defaultQuotationFormValues: Partial<QuotationFormData> = {
  // Customer Information
  customerName: '',
  customerMobile: '',
  customerEmail: '',
  customerAddress: '',

  // Vehicle Information
  vehicleMake: '',
  vehicleModel: '',
  vehicleVariant: '',
  vehicleYear: '',
  vehicleColor: '',
  vinNumber: '',

  // Vehicle Pricing
  vehicleBasePrice: 0,
  vehicleDiscount: 0,
  vehicleNetPrice: 0,

  // Accessories Pricing
  accessoriesTotal: 0,
  accessoriesDiscount: 0,
  accessoriesNetTotal: 0,

  // Other Components
  warrantyTotal: 0,
  insuranceTotal: 0,

  // Total Calculations
  subtotal: 0,
  taxRate: 15,
  taxAmount: 0,
  grandTotal: 0,

  // Trade-in & Financing
  tradeInValue: 0,
  downpayment: 0,
  netAmountDue: 0,

  // Discount Summary
  totalDiscountAmount: 0,
  discountPercentage: 0,

  // Quotation Details
  validUntil: '',
  notes: '',
  termsAndConditions: '',
  internalNotes: '',

  // Line Items
  lineItems: [],
};
