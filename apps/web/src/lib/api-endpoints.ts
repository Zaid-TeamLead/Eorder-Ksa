/**
 * Centralized API endpoint constants
 * Eliminates hardcoded API URLs and process.env references throughout the codebase
 */

export const API_ENDPOINTS = {
  // Enquiry endpoints
  ENQUIRIES: '/api/enquiries',
  ENQUIRY_BY_ID: (id: string | number) => `/api/enquiries/${id}`,
  ENQUIRY_STATS: '/api/enquiries/stats',
  ENQUIRY_DASHBOARD: '/api/enquiries/dashboard',
  ENQUIRY_STATUS: (id: string | number) => `/api/enquiries/${id}/status`,

  // Quotation endpoints
  QUOTATIONS: '/api/quotations',
  QUOTATION_BY_ID: (id: string | number) => `/api/quotations/${id}`,
  QUOTATION_STATS: '/api/quotations/stats',
  QUOTATION_STATUS: (id: string | number) => `/api/quotations/${id}/status`,
  QUOTATION_PDF: (id: string | number) => `/api/quotations/${id}/pdf`,
  QUOTATION_DISCOUNT_APPROVAL: (id: string | number) => `/api/quotations/${id}/discount-approval`,
  QUOTATION_APPROVE_DISCOUNT: (id: string | number) => `/api/quotations/${id}/approve-discount`,
  QUOTATIONS_BY_ENQUIRY: (enquiryId: number) => `/api/quotations/enquiry/${enquiryId}` as const,
  QUOTATIONS_OPEN_DEPOSITS: '/api/quotations/open-deposits',
  QUOTATION_ALLOCATE_DEPOSIT: (id: string | number) => `/api/quotations/${id}/allocate-deposit`,
  QUOTATION_RESERVE_VEHICLE: (id: string | number) => `/api/quotations/${id}/reserve-vehicle`,
  QUOTATION_CANCEL: (id: string | number) => `/api/quotations/${id}/cancel`,

  // Sales Order endpoints
  SALES_ORDERS: '/api/sales-orders',
  SALES_ORDER_BY_ID: (id: string | number) => `/api/sales-orders/${id}`,
  SALES_ORDER_FROM_QUOTATION: '/api/sales-orders/from-quotation',
  SALES_ORDER_PRINT: (id: string | number) => `/api/sales-orders/${id}/print`,
  SALES_ORDER_PASS_TO_VA: (id: string | number) => `/api/sales-orders/${id}/pass-to-vehicle-admin`,
  SALES_ORDER_RESERVE_VEHICLE: (id: string | number) => `/api/sales-orders/${id}/reserve-vehicle`,
  SALES_ORDER_CREATE_HANDOVER: (id: string | number) => `/api/sales-orders/${id}/create-handover-booking`,
  SALES_ORDER_RECORD_LOST: (id: string | number) => `/api/sales-orders/${id}/record-lost-sale`,
  SALES_ORDER_CANCEL: (id: string | number) => `/api/sales-orders/${id}/cancel`,

  // Vehicle endpoints
  VEHICLES: '/api/vehicles',
  VEHICLE_SEARCH: '/api/vehicles/search',
  VEHICLE_CHARGES: '/api/vehicles/charges',
  VEHICLE_INVENTORY: '/api/vehicles/inventory',
  VEHICLE_VIN: '/api/vehicles/vin',
  TEST_VEHICLES: '/api/vehicles/test-vehicles',
  TEST_VEHICLE_BY_ID: (id: string | number) => `/api/vehicles/test-vehicles/${id}`,
  TEST_VEHICLE_STATUS: (id: string | number) => `/api/vehicles/test-vehicles/${id}/status`,

  // Book Test Drive endpoints
  BOOK_TEST_DRIVE: '/api/book-test-drive',
  TEST_DRIVE_BY_ID: (id: string | number) => `/api/book-test-drive/${id}`,
  TEST_DRIVE_STATUS: (id: string | number) => `/api/book-test-drive/${id}/status`,

  // Dispatch & POD endpoints
  DISPATCH_POD: '/api/dispatch-pod',
  DISPATCH_POD_BY_ID: (dispatchNo: string | number) => `/api/dispatch-pod/${dispatchNo}`,
  DISPATCH_DNOTES: '/api/dispatch-pod/dnotes',
  DISPATCH_DNOTE_BY_ID: (dNoteNo: string | number) => `/api/dispatch-pod/dnotes/${dNoteNo}`,
  DISPATCH_POD_SUBMIT: (dispatchNo: string | number) => `/api/dispatch-pod/${dispatchNo}/pod`,

  // Financing endpoints
  FINANCING: '/api/financing',
  FINANCING_BY_ID: (id: string | number) => `/api/financing/${id}`,
  FINANCING_BY_ENQUIRY: (enquiryId: string | number) => `/api/financing/enquiry/${enquiryId}`,
  FINANCING_PREFERRED: (id: string | number) => `/api/financing/${id}/preferred`,
  LENDERS: '/api/financing/lenders',
  FINANCING_CURRENCIES: '/api/financing/currencies',

  // Trade-in Appraisal endpoints
  TRADE_IN_APPRAISAL: '/api/trade-in-appraisal',
  TRADE_IN_BY_ID: (id: string | number) => `/api/trade-in-appraisal/${id}`,
  TRADE_IN_BY_ENQUIRY: (enquiryId: string | number) => `/api/trade-in-appraisal/enquiry/${enquiryId}`,

  // Customer endpoints
  CUSTOMERS: '/api/customers',
  CUSTOMER_SEARCH: '/api/customers/search',
  CUSTOMER_BY_ID: (id: string) => `/api/customers/${id}`,
  CUSTOMER_ADDRESS: (cardCode: string) => `/api/customers/address/${cardCode}` as const,
  CUSTOMER_FINANCIAL: (cardCode: string) => `/api/customers/financial-information/${cardCode}` as const,
  CUSTOMER_VEHICLE_HISTORY: (cardCode: string) => `/api/customers/vehicle-history/${cardCode}` as const,
} as const;

/**
 * Helper to build query string from filters object
 * @param filters - Object with key-value pairs for query parameters
 * @returns Query string (e.g., '?status=active&branch=main')
 */
export function buildQueryString(filters: Record<string, any>): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}
