/**
 * Centralized Query Key Factory
 *
 * This file provides type-safe query keys for all entities in the application.
 * Benefits:
 * - Type-safe query keys with IDE autocomplete
 * - Consistent naming across the app
 * - Easy invalidation patterns
 * - Better debugging with React Query DevTools
 */

export const queryKeys = {
  // Enquiries
  enquiries: {
    all: ["enquiries"] as const,
    detail: (id: number) => ["enquiry", id] as const,
    dashboard: ["enquiries", "dashboard"] as const,
  },

  // Financing / Bank Funding
  financing: {
    all: ["financing"] as const,
    schemes: (enquiryId: number) => ["financing-schemes", enquiryId] as const,
    detail: (id: number) => ["financing", id] as const,
  },

  // Lenders
  lenders: {
    all: ["lenders"] as const,
    byType: (qryType: string) => ["lenders", qryType.toUpperCase()] as const,
  },

  salesEmployees: {
    all: ["sales-employees"] as const,
  },

  currencies: {
    all: ["currencies"] as const,
  },

  // Trade-in Appraisal
  tradeInAppraisal: {
    all: ["trade-in-appraisal"] as const,
    byEnquiry: (enquiryId: number) => ["trade-in-appraisal", enquiryId] as const,
    detail: (id: number) => ["trade-in-appraisal", id] as const,
  },

  // Test Drive Bookings
  testDrive: {
    all: ["test-drive-bookings"] as const,
    calendar: ["test-drive-calendar"] as const,
    detail: (id: number) => ["test-drive-booking", id] as const,
    conflicts: (vehicleId: number, dateTime: string) =>
      ["test-drive-conflicts", vehicleId, dateTime] as const,
  },

  // Vehicle Inventory
  vehicles: {
    all: ["vehicle-inventory"] as const,
    byCustomer: (customerCode: string) => ["vehicle-inventory", customerCode] as const,
    chargesByCustomer: (customerCode: string) => ["vehicle-charges", customerCode] as const,
    detail: (id: number) => ["vehicle", id] as const,
    available: ["vehicle-inventory", "available"] as const,
  },

  // Customers
  customers: {
    all: ["customers"] as const,
    detail: (cardCode: string) => ["customer", cardCode] as const,
    addresses: (cardCode: string) => ["customer-addresses", cardCode] as const,
    financial: (cardCode: string) => ["customer-financial", cardCode] as const,
    history: (cardCode: string) => ["customer-history", cardCode] as const,
    search: (query: string) => ["customer-search", query] as const,
  },

  // Quotations
  quotations: {
    all: ["quotations"] as const,
    byEnquiry: (enquiryId: number) => ["quotations", "enquiry", enquiryId] as const,
    detail: (id: number) => ["quotation", id] as const,
    openDeposits: ["quotations", "open-deposits"] as const,
    versions: (quotationNumber: string) => ["quotation-versions", quotationNumber] as const,
    activities: (quotationId: number) => ["quotation-activities", quotationId] as const,
  },

  // Sales Orders
  salesOrders: {
    all: ['sales-orders'] as const,
    detail: (id: number) => ['sales-order', id] as const,
  },

  // Discount Approvals
  discountApprovals: {
    all: ["discount-approvals"] as const,
    pending: ["discount-approvals", "pending"] as const,
    byQuotation: (quotationId: number) => ["discount-approvals", quotationId] as const,
  },
} as const;
