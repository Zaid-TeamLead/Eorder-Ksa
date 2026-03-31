export type SalesOrderStatus =
  | 'Provisional'
  | 'Printed'
  | 'Superseded'
  | 'PassedToVehicleAdmin'
  | 'HandoverBooked'
  | 'Lost'
  | 'Cancelled';

export interface SalesOrder {
  SLNO: number;
  SALES_ORDER_NUMBER: string;
  QUOTATION_SLNO: number;
  ENQUIRY_SLNO: number;
  VERSION: number;
  PARENT_ORDER_SLNO?: number | null;
  IS_LATEST_VERSION: 'Y' | 'N';
  CUSTOMER_NAME?: string | null;
  CUSTOMER_MOBILE?: string | null;
  CUSTOMER_EMAIL?: string | null;
  VEHICLE_MAKE?: string | null;
  VEHICLE_MODEL?: string | null;
  VEHICLE_VARIANT?: string | null;
  VIN_NUMBER?: string | null;
  GRAND_TOTAL: number;
  STATUS: SalesOrderStatus;
  NOTES?: string | null;
  VEHICLE_RESERVED?: 'Y' | 'N' | null;
  VEHICLE_RESERVED_DATE?: string | null;
  VEHICLE_RESERVED_BY?: string | null;
  VEHICLE_RESERVATION_NOTES?: string | null;
  HANDOVER_BOOKED?: 'Y' | 'N' | null;
  HANDOVER_DATE?: string | null;
  HANDOVER_TIME?: string | null;
  HANDOVER_LOCATION?: string | null;
  HANDOVER_NOTES?: string | null;
  HANDOVER_BOOKED_BY?: string | null;
  HANDOVER_BOOKED_DATE?: string | null;
  PRINTED_BY?: string | null;
  PRINTED_DATE?: string | null;
  PASSED_TO_VEHICLE_ADMIN?: 'Y' | 'N' | null;
  PASSED_TO_VA_DATE?: string | null;
  PASSED_TO_VA_BY?: string | null;
  VEHICLE_ADMIN_ASSIGNED_TO?: string | null;
  VEHICLE_ADMIN_NOTES?: string | null;
  IS_LOST_SALE?: 'Y' | 'N' | null;
  LOST_SALE_DATE?: string | null;
  LOST_REASON?: string | null;
  LOST_NOTES?: string | null;
  CANCELLATION_REASON?: string | null;
  CANCELLED_DATE?: string | null;
  CANCELLED_BY?: string | null;
  SLPCODE: string;
  CREATED_BY: string;
  CREATED_DATE: string;
  UPDATED_BY?: string | null;
  UPDATED_DATE?: string | null;
  IS_DELETED: 'Y' | 'N';
  quotation?: SalesOrderQuotation | null;
  lineItems?: SalesOrderLineItem[];
  enquiry?: SalesOrderEnquiry | null;
  financingSchemes?: SalesOrderFinancingScheme[];
}

export interface SalesOrderQuotation {
  [key: string]: any;
  CUSTOMER_ADDRESS?: string | null;
  VEHICLE_YEAR?: string | null;
  VEHICLE_COLOR?: string | null;
  VEHICLE_BASE_PRICE?: number;
  VEHICLE_DISCOUNT?: number;
  VEHICLE_NET_PRICE?: number;
  ACCESSORIES_TOTAL?: number;
  ACCESSORIES_DISCOUNT?: number;
  ACCESSORIES_NET_TOTAL?: number;
  WARRANTY_TOTAL?: number;
  INSURANCE_TOTAL?: number;
  SUBTOTAL?: number;
  TAX_RATE?: number;
  TAX_AMOUNT?: number;
  GRAND_TOTAL?: number;
  TRADE_IN_VALUE?: number;
  DOWNPAYMENT?: number;
  NET_AMOUNT_DUE?: number;
  TERMS_AND_CONDITIONS?: string | null;
  INTERNAL_NOTES?: string | null;
}

export interface SalesOrderLineItem {
  [key: string]: any;
  SLNO: number;
  LINE_NUMBER: number;
  ITEM_TYPE: string;
  ITEM_CODE?: string | null;
  ITEM_DESCRIPTION?: string | null;
  ITEM_CATEGORY?: string | null;
  QUANTITY?: number | null;
  UNIT_PRICE?: number | null;
  DISCOUNT_AMOUNT?: number | null;
  DISCOUNT_PERCENTAGE?: number | null;
  NET_PRICE?: number | null;
}

export interface SalesOrderEnquiry {
  [key: string]: any;
  CUSTOMERID?: string | null;
  ADDRESS?: string | null;
  POSTCODE?: string | null;
  BRANCH?: string | null;
  BRANCHNAME?: string | null;
  BUDGET?: string | null;
  FINANCING?: string | null;
  MAKE?: string | null;
  MODEL?: string | null;
  VARIANT?: string | null;
  YEAR?: string | null;
  COLOR?: string | null;
  SUPPCATNUM?: string | null;
  MODELCODE?: string | null;
  QUANTITY?: number | null;
  VINNUMBER?: string | null;
  VINDETAILS?: Record<string, unknown> | null;
  CHARGECODE?: string | null;
  CHARGENAME?: string | null;
  CHARGEPRICE?: string | null;
  CHARGEDETAILS?: Record<string, unknown> | null;
  SALESPERSON?: string | null;
  NOTES?: string | null;
}

export interface SalesOrderFinancingScheme {
  [key: string]: any;
  SLNO: number;
  LENDER_CODE?: string | null;
  LENDER_NAME?: string | null;
  SCHEME_NAME?: string | null;
  CURRENCY?: string | null;
  VEHICLE_PRICE?: number | null;
  DOWNPAYMENT?: number | null;
  DOWNPAYMENT_PERCENT?: number | null;
  TRADE_IN_VALUE?: number | null;
  FINANCE_AMOUNT?: number | null;
  TERM_MONTHS?: number | null;
  INTEREST_RATE?: number | null;
  MONTHLY_PAYMENT?: number | null;
  TOTAL_INTEREST?: number | null;
  FDA?: number | null;
  GPV_BALLOON?: number | null;
  SALE_CODE?: string | null;
  STATUS?: string | null;
  IS_SELECTED?: string | null;
}

export interface CreateSalesOrderFromQuotationData {
  quotationSlno: number;
  notes?: string;
}

export interface UpdateSalesOrderData {
  notes?: string;
  vinNumber?: string;
}

export interface PassToVehicleAdminData {
  assignedTo: string;
  notes?: string;
}

export interface ReserveVehicleData {
  reservationNotes?: string;
}

export interface RecordLostSaleData {
  lostReason: string;
  notes?: string;
}

export interface CreateHandoverBookingData {
  handoverDate: string;
  handoverTime?: string;
  handoverLocation?: string;
  notes?: string;
}

export interface CancelSalesOrderData {
  cancellationReason: string;
}

export interface SalesOrderFilters {
  status?: SalesOrderStatus;
  slpCode?: string;
  quotationSlno?: number;
  enquirySlno?: number;
  orderNumber?: string;
}
