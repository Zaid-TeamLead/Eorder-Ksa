import axios from 'axios';

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

const API_BASE = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/vehicles`;

export const getAllTestVehicles = async (): Promise<TestVehicle[]> => {
  const response = await axios.get(`${API_BASE}/test-vehicles`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data?.data || [];
};

export const getTestVehicleById = async (id: number): Promise<TestVehicle> => {
  const response = await axios.get(`${API_BASE}/test-vehicles/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

export const createTestVehicle = async (
  data: CreateTestVehicleData
): Promise<TestVehicle> => {
  const response = await axios.post(`${API_BASE}/test-vehicles`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

export const updateTestVehicle = async (
  id: number,
  data: UpdateTestVehicleData
): Promise<TestVehicle> => {
  const response = await axios.put(`${API_BASE}/test-vehicles/${id}`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

export const deleteTestVehicle = async (id: number): Promise<TestVehicle> => {
  const response = await axios.delete(`${API_BASE}/test-vehicles/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

export const updateTestVehicleStatus = async (
  id: number,
  status: 'true' | 'false'
): Promise<TestVehicle> => {
  const response = await axios.patch(
    `${API_BASE}/test-vehicles/${id}/status`,
    { status },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );
  return response.data.data;
};

export const getAllVehicleInventory = async (): Promise<VehicleInventory[]> => {
  const response = await axios.get(`${API_BASE}/get-all-vehicle-inventory`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data?.data || [];
};
