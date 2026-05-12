import { z } from 'zod';

// =====================================================
// Helper Functions
// =====================================================

// Helper for optional numeric fields - converts empty string to undefined
const optionalNumber = <T extends z.ZodType<number, any, any>>(schema: T) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    return val;
  }, schema.optional());

// =====================================================
// Enums
// =====================================================

export const itemTypeEnum = z.enum([
  'Vehicle',
  'Accessory',
  'Warranty',
  'Insurance',
  'ServicePackage',
  'Other',
]);

export const quotationStatusEnum = z.enum([
  'Draft',
  'Pending',
  'Approved',
  'Sent',
  'Accepted',
  'Rejected',
  'Expired',
  'Superseded',
  'Cancelled',
]);

export const approvalStatusEnum = z.enum(['Pending', 'Approved', 'Rejected', 'Cancelled']);

export const yesNoEnum = z.enum(['Y', 'N']);

// =====================================================
// Line Item Schema
// =====================================================

export const lineItemSchema = z.object({
  lineNumber: z.coerce.number().int().positive({ message: 'Line number must be positive' }),
  itemType: itemTypeEnum,
  itemCode: z.string().max(100).optional(),
  itemDescription: z
    .string()
    .min(1, { message: 'Item description is required' })
    .max(500, { message: 'Item description cannot exceed 500 characters' }),
  itemCategory: z.string().max(100).optional(),
  whsCode: z.string().max(50).optional(),
  quantity: z.coerce.number().int().min(1, { message: 'Quantity must be at least 1' }).default(1),
  unitPrice: z.coerce.number().nonnegative({ message: 'Unit price cannot be negative' }),
  discountAmount: z.coerce
    .number()
    .max(0, { message: 'Discount amount must be negative or zero' })
    .default(0),
  discountPercentage: z.coerce
    .number()
    .min(0, { message: 'Discount percentage cannot be negative' })
    .max(100, { message: 'Discount percentage cannot exceed 100%' })
    .default(0),
  netPrice: z.coerce.number().nonnegative({ message: 'Net price cannot be negative' }),
  taxIncluded: yesNoEnum.default('N'),
  manufacturer: z.string().max(100).optional(),
  partNumber: z.string().max(100).optional(),
  warrantyPeriod: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
});

// =====================================================
// Create Quotation Schema
// =====================================================

export const createQuotationSchema = z.object({
  // Required: Enquiry reference
  enquirySlno: z.coerce.number().int().positive({ message: 'Valid enquiry ID is required' }),

  // Customer Information (auto-populated from enquiry but editable)
  customerName: z.string().max(200).optional(),
  customerMobile: z.string().max(50).optional(),
  customerEmail: z.string().email({ message: 'Invalid email address' }).max(200).optional().or(z.literal('')),
  customerAddress: z.string().max(500).optional(),

  // Vehicle Information
  vehicleMake: z.string().max(100).optional(),
  vehicleModel: z.string().max(100).optional(),
  vehicleVariant: z.string().max(100).optional(),
  vehicleYear: z.string().max(10).optional(),
  vehicleColor: z.string().max(100).optional(),
  vinNumber: z.string().max(100).optional(),

  // Vehicle Pricing
  vehicleBasePrice: z.coerce.number().nonnegative({ message: 'Vehicle base price cannot be negative' }),
  vehicleDiscount: z.coerce
    .number()
    .max(0, { message: 'Vehicle discount must be negative or zero' })
    .default(0),
  vehicleNetPrice: z.coerce.number().nonnegative({ message: 'Vehicle net price cannot be negative' }),

  // Accessories Pricing
  accessoriesTotal: z.coerce.number().nonnegative().default(0),
  accessoriesDiscount: z.coerce.number().max(0).default(0),
  accessoriesNetTotal: z.coerce.number().nonnegative().default(0),

  // Other Components
  warrantyTotal: z.coerce.number().nonnegative().default(0),
  insuranceTotal: z.coerce.number().nonnegative().default(0),

  // Total Calculations
  subtotal: z.coerce.number().nonnegative({ message: 'Subtotal cannot be negative' }),
  taxRate: z.coerce.number().min(0).max(100).default(15),
  taxAmount: z.coerce.number().nonnegative({ message: 'Tax amount cannot be negative' }),
  grandTotal: z.coerce.number().nonnegative({ message: 'Grand total cannot be negative' }),

  // Trade-in & Financing
  tradeInValue: z.coerce.number().nonnegative().default(0),
  tradeInAppraisalSlno: optionalNumber(z.coerce.number().int().positive()),
  financingSchemeSlno: optionalNumber(z.coerce.number().int().positive()),
  downpayment: z.coerce.number().nonnegative().default(0),
  netAmountDue: z.coerce.number().nonnegative({ message: 'Net amount due cannot be negative' }),

  // Discount Summary
  totalDiscountAmount: z.coerce.number().max(0).default(0),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),

  // Quotation Details
  validUntil: z.string().max(30).optional(),
  notes: z.string().max(10000).optional(),
  termsAndConditions: z.string().max(10000).optional(),
  internalNotes: z.string().max(10000).optional(),
  status: z.enum(['Draft', 'Sent']).optional().default('Draft'),

  // Line Items (at least one required)
  lineItems: z
    .array(lineItemSchema)
    .min(1, { message: 'At least one line item is required' }),
});

// =====================================================
// Update Quotation Schema
// =====================================================

export const updateQuotationSchema = createQuotationSchema.partial().omit({ enquirySlno: true });

// =====================================================
// Supersede (Create New Version) Schema
// =====================================================

export const supersedeQuotationSchema = z.object({
  parentQuotationSlno: z.number().int().positive({ message: 'Valid parent quotation ID is required' }),
  reason: z
    .string()
    .min(1, { message: 'Reason for superseding is required' })
    .max(500, { message: 'Reason cannot exceed 500 characters' }),
  // Include all quotation fields except enquirySlno
  ...createQuotationSchema.omit({ enquirySlno: true }).shape,
});

// =====================================================
// Discount Approval Request Schema
// =====================================================

export const requestDiscountApprovalSchema = z.object({
  discountAmount: z.number().negative({ message: 'Discount amount must be negative' }),
  discountPercentage: z
    .number()
    .min(0, { message: 'Discount percentage cannot be negative' })
    .max(100, { message: 'Discount percentage cannot exceed 100%' }),
  justification: z
    .string()
    .min(10, { message: 'Justification must be at least 10 characters' })
    .max(5000, { message: 'Justification cannot exceed 5000 characters' }),
  assignedTo: z
    .string()
    .min(1, { message: 'Manager to approve is required' })
    .max(100),
});

// =====================================================
// Approve/Reject Discount Schema
// =====================================================

export const approveDiscountSchema = z
  .object({
    approvalStatus: z.enum(['Approved', 'Rejected'], {
      error: 'Status must be either Approved or Rejected',
    }),
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

// =====================================================
// Pass to Cashier Schema
// =====================================================

export const passToCashierSchema = z.object({
  assignedTo: z
    .string()
    .min(1, { message: 'Cashier/assignee is required' })
    .max(100),
  depositAmount: z.number().nonnegative().optional(),
  requestNotes: z.string().max(5000).optional(),
});

// =====================================================
// Allocate Deposit Schema
// =====================================================

export const allocateDepositSchema = z.object({
  depositAmount: z.number().positive({ message: 'Deposit amount must be greater than 0' }),
  allocationNotes: z.string().max(5000).optional(),
});

// =====================================================
// Reserve Vehicle Schema
// =====================================================

export const reserveVehicleSchema = z.object({
  reservationFromDate: z.string().max(30).optional(),
  reservationToDate: z.string().max(30).optional(),
  reservationNotes: z.string().max(5000).optional(),
}).refine(
  (data) => {
    if (!data.reservationFromDate || !data.reservationToDate) {
      return true;
    }

    return data.reservationToDate >= data.reservationFromDate;
  },
  {
    message: 'Reservation To date must be on or after Reservation From date',
    path: ['reservationToDate'],
  }
);

// =====================================================
// Cancel Quotation Schema
// =====================================================

export const cancelQuotationSchema = z.object({
  cancellationReason: z
    .string()
    .min(3, { message: 'Cancellation reason is required' })
    .max(5000),
});

// =====================================================
// Activity Log Schema
// =====================================================

export const createActivitySchema = z.object({
  quotationSlno: z.number().int().positive({ message: 'Valid quotation ID is required' }),
  activityType: z.string().max(50),
  activityDescription: z.string().max(500).optional(),
  activityNotes: z.string().max(5000).optional(),
  isFollowUp: yesNoEnum.default('N'),
  followUpDate: z.string().max(30).optional(),
  followUpAssignedTo: z.string().max(100).optional(),
});

// =====================================================
// Query Parameter Schemas
// =====================================================

export const getQuotationByIdSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'ID must be a number' }).transform(Number),
});

export const getQuotationsByEnquirySchema = z.object({
  enquiryId: z.string().regex(/^\d+$/, { message: 'Enquiry ID must be a number' }).transform(Number),
});

export const getApprovalByIdSchema = z.object({
  approvalId: z.string().regex(/^\d+$/, { message: 'Approval ID must be a number' }).transform(Number),
});

// =====================================================
// Query Filters Schema
// =====================================================

export const quotationFiltersSchema = z.object({
  status: quotationStatusEnum.optional(),
  slpCode: z.string().max(50).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  enquirySlno: z.number().int().positive().optional(),
  quotationNumber: z.string().max(50).optional(),
  limit: z.number().int().positive().max(500).optional(),
  offset: z.number().int().min(0).optional(),
});

export const discountApprovalFiltersSchema = z.object({
  status: approvalStatusEnum.optional(),
  assignedTo: z.string().max(100).optional(),
  requestedBySlpCode: z.string().max(50).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// =====================================================
// Type Exports
// =====================================================

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type SupersedeQuotationInput = z.infer<typeof supersedeQuotationSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;
export type RequestDiscountApprovalInput = z.infer<typeof requestDiscountApprovalSchema>;
export type ApproveDiscountInput = z.infer<typeof approveDiscountSchema>;
export type PassToCashierInput = z.infer<typeof passToCashierSchema>;
export type AllocateDepositInput = z.infer<typeof allocateDepositSchema>;
export type ReserveVehicleInput = z.infer<typeof reserveVehicleSchema>;
export type CancelQuotationInput = z.infer<typeof cancelQuotationSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type QuotationFilters = z.infer<typeof quotationFiltersSchema>;
export type DiscountApprovalFilters = z.infer<typeof discountApprovalFiltersSchema>;
