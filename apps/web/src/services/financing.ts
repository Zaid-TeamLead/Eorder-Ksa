import axios from 'axios';

const API_BASE = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/financing`;

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
  const response = await axios.get(`${API_BASE}/enquiry/${enquiryId}`, {
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Get financing scheme by ID
 */
export const getFinancingById = async (id: number): Promise<Financing> => {
  const response = await axios.get(`${API_BASE}/${id}`, {
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Create a new financing scheme
 */
export const createFinancing = async (
  data: CreateFinancingData
): Promise<{ success: boolean; id: number }> => {
  const response = await axios.post(API_BASE, data, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Update an existing financing scheme
 */
export const updateFinancing = async (
  id: number,
  data: UpdateFinancingData
): Promise<{ success: boolean }> => {
  const response = await axios.put(`${API_BASE}/${id}`, data, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Delete a financing scheme (soft delete)
 */
export const deleteFinancing = async (id: number): Promise<{ success: boolean }> => {
  const response = await axios.delete(`${API_BASE}/${id}`, {
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Get all active lenders
 */
export const getLenders = async (): Promise<Lender[]> => {
  const response = await axios.get(`${API_BASE}/lenders`, {
    withCredentials: true,
  });
  return response.data.data;
};

/**
 * Set a financing scheme as preferred
 */
export const setPreferredScheme = async (id: number): Promise<{ success: boolean }> => {
  const response = await axios.patch(
    `${API_BASE}/${id}/preferred`,
    {},
    {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    }
  );
  return response.data.data;
};
