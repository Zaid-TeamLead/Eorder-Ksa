import axios from 'axios';
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
  CreateActivityData,
  QuotationFilters,
  DiscountApprovalFilters,
} from '@/types/quotation';

const API_BASE = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/quotations`;

// ============================================================================
// Quotation CRUD Operations
// ============================================================================

/**
 * Get all quotations with optional filters
 */
export const getAllQuotations = async (
  filters?: QuotationFilters
): Promise<Quotation[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.slpCode) params.append('slpCode', filters.slpCode);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.enquirySlno) params.append('enquirySlno', filters.enquirySlno.toString());
  if (filters?.quotationNumber) params.append('quotationNumber', filters.quotationNumber);

  const response = await axios.get(`${API_BASE}?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data?.data || [];
};

/**
 * Get a quotation by ID (with line items)
 */
export const getQuotationById = async (id: number): Promise<QuotationWithLineItems> => {
  const response = await axios.get(`${API_BASE}/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Get all quotations for a specific enquiry
 */
export const getQuotationsByEnquiryId = async (enquiryId: number): Promise<Quotation[]> => {
  const response = await axios.get(`${API_BASE}/enquiry/${enquiryId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data?.data || [];
};

/**
 * Create a new quotation from an enquiry
 */
export const createQuotation = async (
  data: CreateQuotationData
): Promise<{ success: boolean; id: number; quotationNumber: string }> => {
  const response = await axios.post(`${API_BASE}`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Update an existing quotation
 */
export const updateQuotation = async (
  id: number,
  data: UpdateQuotationData
): Promise<{ success: boolean; message: string }> => {
  const response = await axios.put(`${API_BASE}/${id}`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Supersede a quotation (create new version)
 */
export const supersedeQuotation = async (
  data: SupersedeQuotationData
): Promise<{ success: boolean; id: number; quotationNumber: string }> => {
  const response = await axios.post(`${API_BASE}/supersede`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Delete a quotation (soft delete)
 */
export const deleteQuotation = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await axios.delete(`${API_BASE}/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
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
  const response = await axios.post(`${API_BASE}/${quotationId}/request-approval`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Approve or reject a discount request
 */
export const approveDiscount = async (
  approvalId: number,
  data: ApproveDiscountData
): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post(`${API_BASE}/approvals/${approvalId}`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Get all discount approval requests with optional filters
 */
export const getAllDiscountApprovals = async (
  filters?: DiscountApprovalFilters
): Promise<DiscountApproval[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
  if (filters?.requestedBySlpCode) params.append('requestedBySlpCode', filters.requestedBySlpCode);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);

  const response = await axios.get(`${API_BASE}/discount-approvals?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data?.data || [];
};

/**
 * Get pending discount approvals assigned to the current user
 */
export const getPendingDiscountApprovals = async (): Promise<DiscountApproval[]> => {
  const response = await axios.get(`${API_BASE}/discount-approvals/pending`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data?.data || [];
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
  const response = await axios.post(`${API_BASE}/${quotationId}/pass-to-cashier`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
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
  const response = await axios.post(`${API_BASE}/${quotationId}/activity`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Get all activities for a quotation
 */
export const getQuotationActivities = async (quotationId: number): Promise<QuotationActivity[]> => {
  const response = await axios.get(`${API_BASE}/${quotationId}/activities`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data?.data || [];
};
