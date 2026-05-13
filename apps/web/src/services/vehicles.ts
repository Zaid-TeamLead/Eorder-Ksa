import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface TestVehicle {
  SLNO: number;
  REGISTRATIONNUM?: string;
  MANUFACTURER?: string;
  MODEL?: string;
  VARIANT?: string;
  DESCRIPTION?: string;
  BODYSTYLE?: string;
  VEHICLESTSATUS?: string;
  CREATEDDATE?: string;
  CREATEDBY?: string;
}

export interface VehicleInventory {
  Location: string;
  VIN?: string;
  VINNUMBER?: string;
  vin?: string;
  vinNumber?: string;
  WhsCode: string;
  WhsName: string;
  ItemCode: string;
  InDate: string;
  U_Veh_StockID: string | null;
  U_Veh_Brand: string | null;
  U_Veh_Model: string | null;
  U_Veh_Color: string | null;
  U_Veh_Transmutation: string | null;
  U_Veh_ModelDescr: string | null;
  U_Veh_ModelFull: string | null;
  U_Veh_EngineNo: string | null;
  U_Veh_MY: string | null;
  U_Vehicle_MC: string | null;
  U_Veh_OrderNo: string | null;
  U_Veh_DispDate: string | null;
  U_Veh_IC: string | null;
  AgeinDays: number;
  RESERVED_STATUS?: string | null;
  RESERVED_SOURCE_TYPE?: string | null;
  RESERVED_SOURCE_ID?: number | null;
  RESERVED_SOURCE_NUMBER?: string | null;
  RESERVED_BY?: string | null;
  RESERVED_ON?: string | null;
  RESERVED_FROM?: string | null;
  RESERVED_TO?: string | null;
  RESERVED_NOTES?: string | null;
}

export interface VehicleInventoryOptions {
  includeReservations?: boolean;
}

export interface VehicleChargeItem {
  ITMSGRPNAM?: string | null;
  ITEMCODE?: string | null;
  FRGNANME?: string | null;
  RESTRICTED?: string | null;
  ITEMNAME?: string | null;
  SUPPCATNUM?: string | null;
  ORIGIN?: string | null;
  PROPERTYNAME?: string | null;
  ITEMCAT?: string | null;
  VALIDFOR?: string | null;
  SALESRESTRICTION?: string | null;
  ITMDISCCON?: string | null;
  NUMINSALE?: number | null;
  PRICE?: string | number | null;
  Price?: string | number | null;
  UNITPRICE?: string | number | null;
  UnitPrice?: string | number | null;
  DISCPRICE?: string | number | null;
  Discprice?: string | number | null;
  AMOUNT?: string | number | null;
  Amount?: string | number | null;
  [key: string]: unknown;
}

export interface CreateTestVehicleData {
  REGISTRATIONNUM?: string;
  MANUFACTURER?: string;
  MODEL?: string;
  VARIANT?: string;
  DESCRIPTION?: string;
  BODYSTYLE?: string;
  VEHICLESTATUS?: 'true' | 'false';
}

export interface UpdateTestVehicleData extends CreateTestVehicleData {}

export const getAllTestVehicles = async (): Promise<TestVehicle[]> => {
  return apiClient.get<TestVehicle[]>(API_ENDPOINTS.TEST_VEHICLES);
};

export const getTestVehicleById = async (id: number): Promise<TestVehicle> => {
  return apiClient.get<TestVehicle>(API_ENDPOINTS.TEST_VEHICLE_BY_ID(id));
};

export const createTestVehicle = async (
  data: CreateTestVehicleData
): Promise<TestVehicle> => {
  return apiClient.post<TestVehicle>(API_ENDPOINTS.TEST_VEHICLES, data);
};

export const updateTestVehicle = async (
  id: number,
  data: UpdateTestVehicleData
): Promise<TestVehicle> => {
  return apiClient.put<TestVehicle>(API_ENDPOINTS.TEST_VEHICLE_BY_ID(id), data);
};

export const deleteTestVehicle = async (id: number): Promise<TestVehicle> => {
  return apiClient.delete<TestVehicle>(API_ENDPOINTS.TEST_VEHICLE_BY_ID(id));
};

export const updateTestVehicleStatus = async (
  id: number,
  status: 'true' | 'false'
): Promise<TestVehicle> => {
  return apiClient.patch<TestVehicle>(API_ENDPOINTS.TEST_VEHICLE_STATUS(id), { status });
};

export const getAllVehicleInventory = async (
  customerCode?: string,
  options: VehicleInventoryOptions = {}
): Promise<VehicleInventory[]> => {
  return apiClient.get<VehicleInventory[]>(API_ENDPOINTS.VEHICLE_INVENTORY, {
    params: {
      customerCode: customerCode || '',
      includeReservations: options.includeReservations ?? true,
    },
  });
};

export const getVehicleChargeItems = async (params?: {
  search?: string;
  customerCode?: string;
  itemGroup?: string;
}): Promise<VehicleChargeItem[]> => {
  return apiClient.get<VehicleChargeItem[]>(API_ENDPOINTS.VEHICLE_CHARGES, {
    params: {
      search: params?.search || '',
      customerCode: params?.customerCode || '',
      itemGroup: params?.itemGroup || 'CHARGE',
    },
  });
};
