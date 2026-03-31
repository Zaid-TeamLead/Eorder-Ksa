import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS, buildQueryString } from '@/lib/api-endpoints';

export interface SalesEnquiry {
  SLNO: number;
  // Customer Information
  CUSTOMERID?: string;
  CUSTOMERNAME?: string;
  ADDRESS?: string;
  POSTCODE?: string;
  HOMEPHONE?: string;
  WORKPHONE?: string;
  MOBILE: string;
  HOMEEMAIL?: string;

  // Vehicle Details
  MAKE?: string;
  MAKENAME?: string;
  MODEL?: string;
  MODELNAME?: string;
  VARIANT?: string;
  VARIANTNAME?: string;
  YEAR?: string;
  COLOR?: string;
  SUPPCATNUM?: string;
  MODELCODE?: string;
  QUANTITY?: number;
  VINNUMBER?: string;
  VINDETAILS?: any;

  // Enquiry Details
  BRANCH?: string;
  BRANCHNAME?: string;
  BUDGET?: string;
  FINANCING?: string;
  CHARGECODE?: string;
  CHARGENAME?: string;
  CHARGEPRICE?: string;
  CHARGEDETAILS?: Record<string, unknown>;
  PREFERREDCONTACT?: string;
  PREFERREDTIME?: string;
  PREFERREDDELIVERY?: string;
  SOURCE?: string;
  SALESTYPE?: string;

  // Trade-in Vehicle (basic fields - kept for backward compatibility)
  TRADEINMAKE?: string;
  TRADEINMODEL?: string;
  TRADEINYEAR?: string;
  TRADEINKMS?: string;
  TRADEINEXPECTEDPRICE?: string;

  // Trade-in Appraisal Reference
  TRADEIN_APPRAISAL_SLNO?: number;

  // Additional Information
  SALESPERSON?: string;
  SLPCODE?: string;
  NOTES?: string;

  // Status & Tracking
  STATUS?: string;
  PRIORITY?: string;
  FOLLOWUPDATE?: string;
  FOLLOWUPNOTES?: string;

  // Audit Fields
  CREATEDDATE?: string;
  CREATEDBY?: string;
  UPDATEDDATE?: string;
  UPDATEDBY?: string;
}

export interface CreateEnquiryData {
  customerId?: string;
  customerName?: string;
  address?: string;
  postcode?: string;
  homePhone?: string;
  workPhone?: string;
  mobile: string;
  homeEmail?: string;
  make?: string;
  makeName?: string;
  model?: string;
  modelName?: string;
  variant?: string;
  variantName?: string;
  year?: string;
  color?: string;
  suppCatNum?: string;
  modelCode?: string;
  quantity?: number;
  vinNumber?: string;
  vinDetails?: any;
  branch?: string;
  branchName?: string;
  budget?: string;
  financing?: 'yes' | 'no' | 'maybe';
  chargeCode?: string;
  chargeName?: string;
  chargePrice?: string;
  chargeDetails?: Record<string, unknown>;
  preferredContact?: 'phone' | 'email' | 'whatsapp' | 'sms';
  preferredTime?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  preferredDelivery?: string;
  source?: string;
  salesType?: string;
  tradeInMake?: string;
  tradeInModel?: string;
  tradeInYear?: string;
  tradeInKms?: string;
  tradeInExpectedPrice?: string;
  salesperson?: string;
  slpCode?: string;
  notes?: string;
  status?: string;
  priority?: string;
  followUpDate?: string;
  followUpNotes?: string;
}

export interface UpdateEnquiryData extends Partial<CreateEnquiryData> {}

export interface EnquiryFilters {
  status?: string;
  slpCode?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

export type SalespersonDashboardRow = Record<string, string | number | null>;

export const getAllEnquiries = async (
  filters?: EnquiryFilters
): Promise<SalesEnquiry[]> => {
  const queryString = filters ? buildQueryString(filters) : '';
  return apiClient.get<SalesEnquiry[]>(`${API_ENDPOINTS.ENQUIRIES}${queryString}`);
};

export const getEnquiryById = async (id: number): Promise<SalesEnquiry> => {
  return apiClient.get<SalesEnquiry>(API_ENDPOINTS.ENQUIRY_BY_ID(id));
};

export const createEnquiry = async (
  data: CreateEnquiryData
): Promise<SalesEnquiry> => {
  return apiClient.post<SalesEnquiry>(API_ENDPOINTS.ENQUIRIES, data);
};

export const updateEnquiry = async (
  id: number,
  data: UpdateEnquiryData
): Promise<SalesEnquiry> => {
  return apiClient.put<SalesEnquiry>(API_ENDPOINTS.ENQUIRY_BY_ID(id), data);
};

export const updateEnquiryStatus = async (
  id: number,
  status: string,
  notes?: string
): Promise<any> => {
  return apiClient.patch(API_ENDPOINTS.ENQUIRY_STATUS(id), { status, notes });
};

export const deleteEnquiry = async (id: number): Promise<any> => {
  return apiClient.delete(API_ENDPOINTS.ENQUIRY_BY_ID(id));
};

export const getEnquiryStats = async (slpCode?: string): Promise<any[]> => {
  const queryString = slpCode ? buildQueryString({ slpCode }) : '';
  return apiClient.get<any[]>(`${API_ENDPOINTS.ENQUIRY_STATS}${queryString}`);
};

export const getSalespersonDashboard = async (
  slpCode?: string
): Promise<SalespersonDashboardRow[]> => {
  const queryString = slpCode ? buildQueryString({ slpCode }) : '';
  return apiClient.get<SalespersonDashboardRow[]>(
    `${API_ENDPOINTS.ENQUIRY_DASHBOARD}${queryString}`
  );
};
