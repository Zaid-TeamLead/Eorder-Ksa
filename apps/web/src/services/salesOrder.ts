import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS, buildQueryString } from '@/lib/api-endpoints';
import type {
  CancelSalesOrderData,
  CreateHandoverBookingData,
  CreateSalesOrderFromQuotationData,
  PassToVehicleAdminData,
  RecordLostSaleData,
  ReserveVehicleData,
  SalesOrder,
  SalesOrderFilters,
  UpdateSalesOrderData,
} from '@/types/salesOrder';

export const getAllSalesOrders = async (
  filters?: SalesOrderFilters
): Promise<SalesOrder[]> => {
  const queryString = filters ? buildQueryString(filters) : '';
  return apiClient.get<SalesOrder[]>(`${API_ENDPOINTS.SALES_ORDERS}${queryString}`);
};

export const getSalesOrderById = async (id: number): Promise<SalesOrder> => {
  return apiClient.get<SalesOrder>(API_ENDPOINTS.SALES_ORDER_BY_ID(id));
};

export const createSalesOrderFromQuotation = async (
  data: CreateSalesOrderFromQuotationData
): Promise<{
  success: boolean;
  id: number;
  salesOrderNumber: string;
  sapPosting?: {
    status: 'Posted' | 'Queued' | 'Failed';
    integrationLogId?: number;
    reportUrl?: string;
    referenceNumber?: string;
    referenceSource?: 'docEntry' | 'stagingSlno';
    errorMessage?: string;
  };
}> => {
  return apiClient.post(API_ENDPOINTS.SALES_ORDER_FROM_QUOTATION, data);
};

export const confirmSalesOrderToSalesOrder = async (
  id: number
): Promise<{
  targetDocumentNumber: string;
  status: string;
  errorCode: string;
  sapDocEntry?: string;
  sapDocNum?: string;
  sapPosting?: {
    status: 'Posted' | 'Queued' | 'Failed';
    integrationLogId?: number;
    reportUrl?: string;
    referenceNumber?: string;
    referenceSource?: 'docEntry' | 'stagingSlno';
    errorMessage?: string;
  };
}> => {
  return apiClient.post(API_ENDPOINTS.SALES_ORDER_CONFIRM_TO_SALES_ORDER(id), {});
};

export const updateSalesOrder = async (
  id: number,
  data: UpdateSalesOrderData
): Promise<{ success: boolean }> => {
  return apiClient.patch(API_ENDPOINTS.SALES_ORDER_BY_ID(id), data);
};

export const markSalesOrderAsPrinted = async (
  id: number
): Promise<{ success: boolean }> => {
  return apiClient.post(API_ENDPOINTS.SALES_ORDER_PRINT(id), {});
};

export const passSalesOrderToVehicleAdmin = async (
  id: number,
  data: PassToVehicleAdminData
): Promise<{ success: boolean }> => {
  return apiClient.post(API_ENDPOINTS.SALES_ORDER_PASS_TO_VA(id), data);
};

export const reserveSalesOrderVehicle = async (
  id: number,
  data: ReserveVehicleData
): Promise<{ success: boolean }> => {
  return apiClient.post(API_ENDPOINTS.SALES_ORDER_RESERVE_VEHICLE(id), data);
};

export const createSalesOrderHandoverBooking = async (
  id: number,
  data: CreateHandoverBookingData
): Promise<{ success: boolean }> => {
  return apiClient.post(API_ENDPOINTS.SALES_ORDER_CREATE_HANDOVER(id), data);
};

export const recordSalesOrderAsLost = async (
  id: number,
  data: RecordLostSaleData
): Promise<{ success: boolean }> => {
  return apiClient.post(API_ENDPOINTS.SALES_ORDER_RECORD_LOST(id), data);
};

export const cancelSalesOrder = async (
  id: number,
  data: CancelSalesOrderData
): Promise<{ success: boolean }> => {
  return apiClient.post(API_ENDPOINTS.SALES_ORDER_CANCEL(id), data);
};
