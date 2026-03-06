import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS, buildQueryString } from '@/lib/api-endpoints';
import type {
  Quotation,
  QuotationWithLineItems,
  QuotationLineItem,
  DiscountApproval,
  QuotationActivity,
  CreateQuotationData,
  UpdateQuotationData,
  SupersedeQuotationData,
  RequestDiscountApprovalData,
  ApproveDiscountData,
  PassToCashierData,
  AllocateDepositData,
  CreateActivityData,
  QuotationFilters,
  DiscountApprovalFilters,
} from '@/types/quotation';

// ============================================================================
// Quotation CRUD Operations
// ============================================================================

/**
 * Get all quotations with optional filters
 */
export const getAllQuotations = async (
  filters?: QuotationFilters
): Promise<Quotation[]> => {
  const queryString = filters ? buildQueryString(filters) : '';
  return apiClient.get<Quotation[]>(`${API_ENDPOINTS.QUOTATIONS}${queryString}`);
};

/**
 * Get a quotation by ID (with line items)
 */
export const getQuotationById = async (id: number): Promise<QuotationWithLineItems> => {
  return apiClient.get<QuotationWithLineItems>(API_ENDPOINTS.QUOTATION_BY_ID(id));
};

/**
 * Get all quotations for a specific enquiry
 */
export const getQuotationsByEnquiryId = async (enquiryId: number): Promise<Quotation[]> => {
  return apiClient.get<Quotation[]>(API_ENDPOINTS.QUOTATIONS_BY_ENQUIRY(enquiryId));
};

/**
 * Create a new quotation from an enquiry
 */
export const createQuotation = async (
  data: CreateQuotationData
): Promise<{ success: boolean; id: number; quotationNumber: string }> => {
  return apiClient.post(API_ENDPOINTS.QUOTATIONS, data);
};

/**
 * Update an existing quotation
 */
export const updateQuotation = async (
  id: number,
  data: UpdateQuotationData
): Promise<{ success: boolean; message: string }> => {
  return apiClient.put(API_ENDPOINTS.QUOTATION_BY_ID(id), data);
};

/**
 * Supersede a quotation (create new version)
 */
export const supersedeQuotation = async (
  data: SupersedeQuotationData
): Promise<{ success: boolean; id: number; quotationNumber: string }> => {
  return apiClient.post(`${API_ENDPOINTS.QUOTATIONS}/supersede`, data);
};

/**
 * Delete a quotation (soft delete)
 */
export const deleteQuotation = async (id: number): Promise<{ success: boolean; message: string }> => {
  return apiClient.delete(API_ENDPOINTS.QUOTATION_BY_ID(id));
};

// ============================================================================
// Discount Approval Operations
// ============================================================================

/**
 * Request discount approval from manager
 */
export const requestDiscountApproval = async (
  quotationId: number,
  data: RequestDiscountApprovalData
): Promise<{ success: boolean; id: number }> => {
  return apiClient.post(`${API_ENDPOINTS.QUOTATIONS}/${quotationId}/request-approval`, data);
};

/**
 * Approve or reject a discount request
 */
export const approveDiscount = async (
  approvalId: number,
  data: ApproveDiscountData
): Promise<{ success: boolean; message: string }> => {
  return apiClient.post(`${API_ENDPOINTS.QUOTATIONS}/approvals/${approvalId}`, data);
};

/**
 * Get all discount approval requests with optional filters
 */
export const getAllDiscountApprovals = async (
  filters?: DiscountApprovalFilters
): Promise<DiscountApproval[]> => {
  const queryString = filters ? buildQueryString(filters) : '';
  return apiClient.get<DiscountApproval[]>(`${API_ENDPOINTS.QUOTATIONS}/discount-approvals${queryString}`);
};

/**
 * Get pending discount approvals assigned to the current user
 */
export const getPendingDiscountApprovals = async (): Promise<DiscountApproval[]> => {
  return apiClient.get<DiscountApproval[]>(`${API_ENDPOINTS.QUOTATIONS}/discount-approvals/pending`);
};

// ============================================================================
// Quotation Actions
// ============================================================================

/**
 * Pass quotation to cashier for deposit collection
 */
export const passToCashier = async (
  quotationId: number,
  data: PassToCashierData
): Promise<{ success: boolean; message: string }> => {
  return apiClient.post(`${API_ENDPOINTS.QUOTATIONS}/${quotationId}/pass-to-cashier`, data);
};

/**
 * Get open deposits received (passed to cashier but not allocated yet)
 */
export const getOpenDeposits = async (): Promise<Quotation[]> => {
  return apiClient.get<Quotation[]>(API_ENDPOINTS.QUOTATIONS_OPEN_DEPOSITS);
};

/**
 * Allocate deposit to an enquiry/quotation
 */
export const allocateDeposit = async (
  quotationId: number,
  data: AllocateDepositData
): Promise<{ success: boolean; message: string }> => {
  return apiClient.post(API_ENDPOINTS.QUOTATION_ALLOCATE_DEPOSIT(quotationId), data);
};

// ============================================================================
// Activity Logging
// ============================================================================

/**
 * Log activity for a quotation
 */
export const logActivity = async (
  quotationId: number,
  data: CreateActivityData
): Promise<{ success: boolean; message: string }> => {
  return apiClient.post(`${API_ENDPOINTS.QUOTATIONS}/${quotationId}/activity`, data);
};

/**
 * Get all activities for a quotation
 */
export const getQuotationActivities = async (quotationId: number): Promise<QuotationActivity[]> => {
  return apiClient.get<QuotationActivity[]>(`${API_ENDPOINTS.QUOTATIONS}/${quotationId}/activities`);
};
