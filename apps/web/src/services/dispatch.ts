import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS, buildQueryString } from '@/lib/api-endpoints';
import type { DispatchPOD, DispatchRecord, DeliveryNoteSource } from '@/types/dispatch';

export interface CreateDispatchData {
  dispatchDate: string;
  dNoteNo: string;
  dndocEntry?: string;
  dNoteDate?: string;
  customerCode: string;
  customerName: string;
  address?: string;
  salespersonName?: string;
  salespersonEmail?: string;
  soRef?: string;
  qty: number;
  remarks?: string;
  vehicles: Array<{
    deliveryNo?: string;
    soNo?: string;
    invoiceNo?: string;
    vinNo: string;
    model?: string;
    qty?: number;
  }>;
}

export const getDispatches = async (filters?: {
  dateFrom?: string;
  dateTo?: string;
  dispatchNo?: string;
  dNoteNo?: string;
}): Promise<DispatchRecord[]> => {
  const query = buildQueryString(filters || {});
  return apiClient.get<DispatchRecord[]>(`${API_ENDPOINTS.DISPATCH_POD}${query}`);
};

export const getAvailableDNotes = async (filters?: {
  dateFrom?: string;
  dateTo?: string;
  dNoteNo?: string;
  search?: string;
}): Promise<DeliveryNoteSource[]> => {
  const query = buildQueryString(filters || {});
  return apiClient.get<DeliveryNoteSource[]>(`${API_ENDPOINTS.DISPATCH_DNOTES}${query}`);
};

export const getDNoteByNo = async (dNoteNo: string): Promise<DeliveryNoteSource> => {
  return apiClient.get<DeliveryNoteSource>(API_ENDPOINTS.DISPATCH_DNOTE_BY_ID(dNoteNo));
};

export const getDispatchByNo = async (dispatchNo: string): Promise<DispatchRecord> => {
  return apiClient.get<DispatchRecord>(API_ENDPOINTS.DISPATCH_POD_BY_ID(dispatchNo));
};

export const createDispatch = async (data: CreateDispatchData): Promise<DispatchRecord> => {
  return apiClient.post<DispatchRecord>(API_ENDPOINTS.DISPATCH_POD, data);
};

export const submitDispatchPOD = async (
  dispatchNo: string,
  pod: Omit<DispatchPOD, 'submittedAt'>
): Promise<DispatchRecord> => {
  return apiClient.post<DispatchRecord>(API_ENDPOINTS.DISPATCH_POD_SUBMIT(dispatchNo), pod);
};
