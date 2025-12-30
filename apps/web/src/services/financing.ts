import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface Financing {
  SLNO: number;
  ENQUIRY_SLNO: number;
  LENDER_CODE: string;
  LENDER_NAME: string;
  SCHEME_NAME?: string;
  VEHICLE_PRICE?: number;
  DOWNPAYMENT?: number;
  DOWNPAYMENT_PERCENT?: number;
  TRADE_IN_VALUE?: number;
  FINANCE_AMOUNT?: number;
  TERM_MONTHS?: number;
  INTEREST_RATE?: number;
  MONTHLY_PAYMENT?: number;
  TOTAL_INTEREST?: number;
  FDA?: number;
  GPV_BALLOON?: number;
  SALE_CODE?: string;
  STATUS?: string;
  IS_SELECTED?: string;
  CREATED_DATE?: string;
  CREATED_BY?: string;
  UPDATED_DATE?: string;
  UPDATED_BY?: string;
}

export interface Lender {
  LENDER_CODE: string;
  LENDER_NAME: string;
  DESCRIPTION?: string;
  IS_ACTIVE?: string;
}

export interface CreateFinancingData {
  enquirySlno: number;
  lenderCode: string;
  lenderName: string;
  schemeName?: string;
  vehiclePrice?: number;
  downpayment?: number;
  downpaymentPercent?: number;
  tradeInValue?: number;
  financeAmount?: number;
  termMonths: number;
  interestRate?: number;
  monthlyPayment?: number;
  totalInterest?: number;
  fda?: number;
  gpvBalloon?: number;
  saleCode?: string;
  status?: string;
  isSelected?: string;
}

export interface UpdateFinancingData {
  lenderCode?: string;
  lenderName?: string;
  schemeName?: string;
  vehiclePrice?: number;
  downpayment?: number;
  downpaymentPercent?: number;
  tradeInValue?: number;
  financeAmount?: number;
  termMonths?: number;
  interestRate?: number;
  monthlyPayment?: number;
  totalInterest?: number;
  fda?: number;
  gpvBalloon?: number;
  saleCode?: string;
  status?: string;
  isSelected?: string;
}

/**
 * Get all financing schemes for an enquiry
 */
export const getFinancingByEnquiryId = async (enquiryId: number): Promise<Financing[]> => {
  return apiClient.get<Financing[]>(API_ENDPOINTS.FINANCING_BY_ENQUIRY(enquiryId));
};

/**
 * Get financing scheme by ID
 */
export const getFinancingById = async (id: number): Promise<Financing> => {
  return apiClient.get<Financing>(API_ENDPOINTS.FINANCING_BY_ID(id));
};

/**
 * Create a new financing scheme
 */
export const createFinancing = async (
  data: CreateFinancingData
): Promise<{ success: boolean; id: number }> => {
  return apiClient.post(API_ENDPOINTS.FINANCING, data);
};

/**
 * Update an existing financing scheme
 */
export const updateFinancing = async (
  id: number,
  data: UpdateFinancingData
): Promise<{ success: boolean }> => {
  return apiClient.put(API_ENDPOINTS.FINANCING_BY_ID(id), data);
};

/**
 * Delete a financing scheme (soft delete)
 */
export const deleteFinancing = async (id: number): Promise<{ success: boolean }> => {
  return apiClient.delete(API_ENDPOINTS.FINANCING_BY_ID(id));
};

/**
 * Get all active lenders
 */
export const getLenders = async (): Promise<Lender[]> => {
  return apiClient.get<Lender[]>(API_ENDPOINTS.LENDERS);
};

/**
 * Set a financing scheme as preferred
 */
export const setPreferredScheme = async (id: number): Promise<{ success: boolean }> => {
  return apiClient.patch(API_ENDPOINTS.FINANCING_PREFERRED(id), {});
};
