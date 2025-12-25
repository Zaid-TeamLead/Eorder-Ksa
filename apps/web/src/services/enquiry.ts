import axios from 'axios';

const API_BASE = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/enquiries`;

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

export const getAllEnquiries = async (
  filters?: EnquiryFilters
): Promise<SalesEnquiry[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.slpCode) params.append('slpCode', filters.slpCode);
  if (filters?.customerId) params.append('customerId', filters.customerId);
  if (filters?.fromDate) params.append('fromDate', filters.fromDate);
  if (filters?.toDate) params.append('toDate', filters.toDate);

  const response = await axios.get(`${API_BASE}?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data?.data || [];
};

export const getEnquiryById = async (id: number): Promise<SalesEnquiry> => {
  const response = await axios.get(`${API_BASE}/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

export const createEnquiry = async (
  data: CreateEnquiryData
): Promise<SalesEnquiry> => {
  const response = await axios.post(`${API_BASE}`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

export const updateEnquiry = async (
  id: number,
  data: UpdateEnquiryData
): Promise<SalesEnquiry> => {
  const response = await axios.put(`${API_BASE}/${id}`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

export const updateEnquiryStatus = async (
  id: number,
  status: string,
  notes?: string
): Promise<any> => {
  const response = await axios.patch(
    `${API_BASE}/${id}/status`,
    { status, notes },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );
  return response.data.data;
};

export const deleteEnquiry = async (id: number): Promise<any> => {
  const response = await axios.delete(`${API_BASE}/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

export const getEnquiryStats = async (slpCode?: string): Promise<any[]> => {
  const params = slpCode ? `?slpCode=${slpCode}` : '';
  const response = await axios.get(`${API_BASE}/stats${params}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data?.data || [];
};
