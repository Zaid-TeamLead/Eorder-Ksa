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
