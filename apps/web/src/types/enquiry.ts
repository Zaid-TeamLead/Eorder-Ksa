/**
 * Type Definitions for Sales Enquiry Module
 */

// ============================================================================
// API Response Types (Matching Database Schema)
// ============================================================================

export interface SalesEnquiry {
  SLNO: number;
  CUSTOMERID: string | null;
  CUSTOMERNAME: string | null;
  ADDRESS: string | null;
  POSTCODE: string | null;
  HOMEPHONE: string | null;
  WORKPHONE: string | null;
  MOBILE: string | null;
  HOMEEMAIL: string | null;
  MAKE: string | null;
  MODEL: string | null;
  VARIANT: string | null;
  YEAR: string | null;
  COLOR: string | null;
  SUPPCATNUM: string | null;
  MODELCODE: string | null;
  QUANTITY: number | null;
  VINNUMBER: string | null;
  VINDETAILS: string | null;
  BRANCH: string | null;
  BUDGET: string | null;
  FINANCING: string | null;
  PREFERREDCONTACT: string | null;
  PREFERREDTIME: string | null;
  PREFERREDDELIVERY: string | null;
  SOURCE: string | null;
  SALESTYPE: string | null;
  TRADEINMAKE: string | null;
  TRADEINMODEL: string | null;
  TRADEINYEAR: string | null;
  TRADEINKMS: string | null;
  TRADEINEXPECTEDPRICE: string | null;
  SALESPERSON: string | null;
  SLPCODE: string | null;
  NOTES: string | null;
  STATUS: string;
  PRIORITY: string | null;
  CREATEDDATE: string;
  CREATEDBY: string | null;
  LASTUPDATEDDATE: string | null;
  LASTUPDATEDBY: string | null;
  // Extended fields from joins
  MAKENAME?: string;
  MODELNAME?: string;
  VARIANTNAME?: string;
}

// ============================================================================
// API Request Types
// ============================================================================

export interface CreateEnquiryData {
  customerId?: string;
  customerName?: string;
  address?: string;
  postcode?: string;
  homePhone?: string;
  workPhone?: string;
  mobile?: string;
  homeEmail?: string;
  make?: string;
  model?: string;
  variant?: string;
  year?: string;
  color?: string;
  suppCatNum?: string;
  modelCode?: string;
  quantity?: number;
  vinNumber?: string;
  vinDetails?: string;
  branch?: string;
  budget?: string;
  financing?: string;
  preferredContact?: string;
  preferredTime?: string;
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
}

export interface UpdateEnquiryData extends Partial<CreateEnquiryData> {}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseEnquiriesReturn {
  enquiries: SalesEnquiry[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseEnquiryMutationsReturn {
  createEnquiry: (data: CreateEnquiryData) => Promise<void>;
  updateEnquiry: (id: number, data: UpdateEnquiryData) => Promise<void>;
  deleteEnquiry: (id: number) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseEnquiryStatusUpdateReturn {
  updateStatus: (id: number, status: string) => Promise<void>;
  isUpdating: boolean;
}
