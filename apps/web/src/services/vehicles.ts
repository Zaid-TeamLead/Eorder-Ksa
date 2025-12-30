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
  VIN: string;
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

export const getAllVehicleInventory = async (): Promise<VehicleInventory[]> => {
  return apiClient.get<VehicleInventory[]>(API_ENDPOINTS.VEHICLE_INVENTORY);
};
