/**
 * Type Definitions for Quotation Module
 */

// ============================================================================
// API Response Types (Matching Database Schema)
// ============================================================================

export interface Quotation {
  SLNO: number;
  ENQUIRY_SLNO: number;
  QUOTATION_NUMBER: string;
  VERSION: number;
  PARENT_QUOTATION_SLNO: number | null;
  IS_LATEST_VERSION: 'Y' | 'N';
  SUPERSEDE_REASON: string | null;

  // Customer Information (denormalized)
  CUSTOMER_NAME: string | null;
  CUSTOMER_MOBILE: string | null;
  CUSTOMER_EMAIL: string | null;
  CUSTOMER_ADDRESS: string | null;

  // Vehicle Information (denormalized)
  VEHICLE_MAKE: string | null;
  VEHICLE_MODEL: string | null;
  VEHICLE_VARIANT: string | null;
  VEHICLE_YEAR: string | null;
  VEHICLE_COLOR: string | null;
  VIN_NUMBER: string | null;

  // Vehicle Pricing
  VEHICLE_BASE_PRICE: number;
  VEHICLE_DISCOUNT: number;
  VEHICLE_NET_PRICE: number;

  // Accessories Pricing
  ACCESSORIES_TOTAL: number;
  ACCESSORIES_DISCOUNT: number;
  ACCESSORIES_NET_TOTAL: number;

  // Other Components
  WARRANTY_TOTAL: number;
  INSURANCE_TOTAL: number;

  // Total Calculations
  SUBTOTAL: number;
  TAX_RATE: number;
  TAX_AMOUNT: number;
  GRAND_TOTAL: number;

  // Trade-in & Financing
  TRADE_IN_VALUE: number;
  TRADE_IN_APPRAISAL_SLNO: number | null;
  FINANCING_SCHEME_SLNO: number | null;
  DOWNPAYMENT: number;
  NET_AMOUNT_DUE: number;

  // Discount Summary
  TOTAL_DISCOUNT_AMOUNT: number;
  DISCOUNT_PERCENTAGE: number;
  REQUIRES_APPROVAL: 'Y' | 'N';

  // Approval
  DISCOUNT_APPROVAL_STATUS: string | null;
  DISCOUNT_APPROVED_BY: string | null;
  DISCOUNT_APPROVED_DATE: string | null;

  // Status
  STATUS: 'Draft' | 'Pending' | 'Approved' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Superseded';

  // Quotation Details
  VALID_UNTIL: string | null;
  NOTES: string | null;
  TERMS_AND_CONDITIONS: string | null;
  INTERNAL_NOTES: string | null;

  // Cashier
  PASSED_TO_CASHIER: 'Y' | 'N';
  PASSED_TO_CASHIER_DATE: string | null;
  PASSED_TO_CASHIER_BY: string | null;
  DEPOSIT_AMOUNT: number | null;
  DEPOSIT_COLLECTED: 'Y' | 'N';
  DEPOSIT_COLLECTED_DATE: string | null;
  DEPOSIT_COLLECTED_BY: string | null;

  // Ownership & Audit
  SLPCODE: string;
  CREATED_BY: string;
  CREATED_DATE: string;
  UPDATED_BY: string | null;
  UPDATED_DATE: string | null;
  IS_DELETED: 'Y' | 'N';
}

export interface QuotationLineItem {
  SLNO: number;
  QUOTATION_SLNO: number;
  LINE_NUMBER: number;
  ITEM_TYPE: 'Vehicle';
  ITEM_CODE: string | null;
  ITEM_DESCRIPTION: string;
  ITEM_CATEGORY: string | null;
  QUANTITY: number;
  UNIT_PRICE: number;
  DISCOUNT_AMOUNT: number;
  DISCOUNT_PERCENTAGE: number;
  NET_PRICE: number;
  TAX_INCLUDED: 'Y' | 'N';
  MANUFACTURER: string | null;
  PART_NUMBER: string | null;
  WARRANTY_PERIOD: string | null;
  NOTES: string | null;
}

export interface DiscountApproval {
  SLNO: number;
  QUOTATION_SLNO: number;
  REQUEST_TYPE: string;
  DISCOUNT_AMOUNT: number;
  DISCOUNT_PERCENTAGE: number;
  JUSTIFICATION: string;
  REQUESTED_BY: string;
  REQUESTED_BY_SLPCODE: string;
  REQUESTED_DATE: string;
  USER_DISCOUNT_LIMIT: number;
  AMOUNT_OVER_LIMIT: number;
  STATUS: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  ASSIGNED_TO: string;
  ASSIGNED_TO_ROLE: string | null;
  APPROVED_BY: string | null;
  APPROVED_DATE: string | null;
  APPROVAL_NOTES: string | null;
  REJECTION_REASON: string | null;
}

export interface QuotationActivity {
  SLNO: number;
  QUOTATION_SLNO: number;
  ACTIVITY_TYPE: string;
  ACTIVITY_DESCRIPTION: string | null;
  ACTIVITY_DATE: string;
  ACTIVITY_NOTES: string | null;
  IS_FOLLOW_UP: 'Y' | 'N';
  FOLLOW_UP_DATE: string | null;
  FOLLOW_UP_ASSIGNED_TO: string | null;
  FOLLOW_UP_STATUS: string | null;
  CREATED_BY: string;
  CREATED_DATE: string;
}

// ============================================================================
// Combined Response Types
// ============================================================================

export interface QuotationWithLineItems extends Quotation {
  lineItems: QuotationLineItem[];
}

export interface QuotationWithDetails extends QuotationWithLineItems {
  activities?: QuotationActivity[];
  approvals?: DiscountApproval[];
}

// ============================================================================
// API Request Types (camelCase for forms)
// ============================================================================

export interface LineItemInput {
  lineNumber: number;
  itemType: 'Vehicle';
  itemCode?: string;
  itemDescription: string;
  itemCategory?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  discountPercentage: number;
  netPrice: number;
  taxIncluded?: 'Y' | 'N';
  manufacturer?: string;
  partNumber?: string;
  warrantyPeriod?: string;
  notes?: string;
}

export interface CreateQuotationData {
  enquirySlno: number;

  // Customer Information
  customerName?: string;
  customerMobile?: string;
  customerEmail?: string;
  customerAddress?: string;

  // Vehicle Information
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleVariant?: string;
  vehicleYear?: string;
  vehicleColor?: string;
  vinNumber?: string;

  // Vehicle Pricing
  vehicleBasePrice: number;
  vehicleDiscount: number;
  vehicleNetPrice: number;

  // Accessories Pricing
  accessoriesTotal: number;
  accessoriesDiscount: number;
  accessoriesNetTotal: number;

  // Other Components
  warrantyTotal: number;
  insuranceTotal: number;

  // Total Calculations
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;

  // Trade-in & Financing
  tradeInValue: number;
  tradeInAppraisalSlno?: number;
  financingSchemeSlno?: number;
  downpayment: number;
  netAmountDue: number;

  // Discount Summary
  totalDiscountAmount: number;
  discountPercentage: number;

  // Quotation Details
  validUntil?: string;
  notes?: string;
  termsAndConditions?: string;
  internalNotes?: string;
  status?: 'Draft' | 'Sent';

  // Line Items
  lineItems: LineItemInput[];
}

export interface UpdateQuotationData extends Partial<Omit<CreateQuotationData, 'enquirySlno'>> {}

export interface SupersedeQuotationData extends Omit<CreateQuotationData, 'enquirySlno'> {
  parentQuotationSlno: number;
  reason: string;
}

export interface RequestDiscountApprovalData {
  discountAmount: number;
  discountPercentage: number;
  justification: string;
  assignedTo: string;
}

export interface ApproveDiscountData {
  approvalStatus: 'Approved' | 'Rejected';
  approvalNotes?: string;
  rejectionReason?: string;
}

export interface PassToCashierData {
  depositAmount?: number;
  notes?: string;
}

export interface CreateActivityData {
  activityType: string;
  activityDescription?: string;
  activityNotes?: string;
  isFollowUp?: 'Y' | 'N';
  followUpDate?: string;
  followUpAssignedTo?: string;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface QuotationFilters {
  status?: Quotation['STATUS'];
  slpCode?: string;
  dateFrom?: string;
  dateTo?: string;
  enquirySlno?: number;
  quotationNumber?: string;
}

export interface DiscountApprovalFilters {
  status?: DiscountApproval['STATUS'];
  assignedTo?: string;
  requestedBySlpCode?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseQuotationsReturn {
  quotations: Quotation[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseQuotationByIdReturn {
  quotation: QuotationWithLineItems | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseQuotationsByEnquiryReturn {
  quotations: Quotation[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseQuotationMutationsReturn {
  createQuotation: (data: CreateQuotationData) => Promise<{ success: boolean; id: number; quotationNumber: string }>;
  updateQuotation: (id: number, data: UpdateQuotationData) => Promise<void>;
  deleteQuotation: (id: number) => Promise<void>;
  supersedeQuotation: (data: SupersedeQuotationData) => Promise<{ success: boolean; id: number; quotationNumber: string }>;
  requestApproval: (quotationId: number, data: RequestDiscountApprovalData) => Promise<void>;
  approveDiscount: (approvalId: number, data: ApproveDiscountData) => Promise<void>;
  passToCashier: (quotationId: number, data: PassToCashierData) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSuperseding: boolean;
}

export interface UseDiscountApprovalsReturn {
  approvals: DiscountApproval[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type QuotationStatus = Quotation['STATUS'];
export type ItemType = QuotationLineItem['ITEM_TYPE'];
export type ApprovalStatus = DiscountApproval['STATUS'];
export type YesNo = 'Y' | 'N';
