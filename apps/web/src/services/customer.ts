import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface CustomerSearchItem {
  CardCode: string;
  CardName: string;
  Phone1?: string | null;
  Phone2?: string | null;
  Cellular?: string | null;
  E_Mail?: string | null;
}

export const searchCustomers = async (search: string, slpCode: string) => {
  return apiClient.post<CustomerSearchItem[]>(API_ENDPOINTS.CUSTOMER_SEARCH, {
    search,
    slpCode,
  });
};

export const getCustomerAddress = async (cardCode: string) => {
  return apiClient.get<Record<string, unknown>[]>(
    API_ENDPOINTS.CUSTOMER_ADDRESS(cardCode)
  );
};

export const getCustomerfinancialInformation = async (cardCode: string) => {
  return apiClient.get<Record<string, unknown>[]>(
    API_ENDPOINTS.CUSTOMER_FINANCIAL(cardCode)
  );
};

export const getVehicleHistory = async (cardCode: string) => {
  return apiClient.get<Record<string, unknown>[]>(
    API_ENDPOINTS.CUSTOMER_VEHICLE_HISTORY(cardCode)
  );
};
