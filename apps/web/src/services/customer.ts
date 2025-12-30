import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const searchCustomers = async (search: string, slpCode: string) => {
  return apiClient.post(API_ENDPOINTS.CUSTOMER_SEARCH, {
    search,
    slpCode,
  });
};

export const getCustomerAddress = async (cardCode: string) => {
  return apiClient.get(API_ENDPOINTS.CUSTOMER_ADDRESS(cardCode));
};

export const getCustomerfinancialInformation = async (cardCode: string) => {
  return apiClient.get(API_ENDPOINTS.CUSTOMER_FINANCIAL(cardCode));
};

export const getVehicleHistory = async (cardCode: string) => {
  return apiClient.get(API_ENDPOINTS.CUSTOMER_VEHICLE_HISTORY(cardCode));
};
