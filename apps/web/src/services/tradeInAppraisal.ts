import axios from 'axios';

export interface TradeInAppraisal {
  SLNO: number;
  ENQUIRY_SLNO: number;
  REGISTRATION_NUMBER?: string;
  VIN?: string;
  MANUFACTURER?: string;
  MODEL?: string;
  VARIANT?: string;
  DESCRIPTION?: string;
  COLOUR?: string;
  TRIM?: string;
  BODY_STYLE?: string;
  TRANSMISSION?: string;
  FUEL_TYPE?: string;
  ENGINE_SIZE?: string;
  REGISTRATION_DATE?: string;
  ODOMETER_READING?: string;
  NUMBER_OF_DOORS?: string;
  CUSTOMER_EXPECTED_PRICE?: string;
  MARKET_VALUE?: string;
  APPRAISAL_OFFER?: string;
  APPRAISAL_STATUS?: 'Pending' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
  REQUESTED_BY?: string;
  REQUESTED_DATE?: string;
  ASSIGNED_TO?: string;
  APPRAISED_BY?: string;
  APPRAISED_DATE?: string;
  REQUEST_NOTES?: string;
  APPRAISAL_NOTES?: string;
  CREATED_BY?: string;
  CREATED_DATE?: string;
  UPDATED_BY?: string;
  UPDATED_DATE?: string;
  IS_DELETED?: string;
}

export interface CreateTradeInAppraisalData {
  enquirySlno: number;
  registrationNumber?: string;
  vin?: string;
  manufacturer?: string;
  model?: string;
  variant?: string;
  description?: string;
  colour?: string;
  trim?: string;
  bodyStyle?: string;
  transmission?: string;
  fuelType?: string;
  engineSize?: string;
  registrationDate?: string;
  odometerReading?: string;
  numberOfDoors?: string;
  customerExpectedPrice?: string;
  marketValue?: string;
  appraisalOffer?: string;
}

export interface UpdateTradeInAppraisalData {
  registrationNumber?: string;
  vin?: string;
  manufacturer?: string;
  model?: string;
  variant?: string;
  description?: string;
  colour?: string;
  trim?: string;
  bodyStyle?: string;
  transmission?: string;
  fuelType?: string;
  engineSize?: string;
  registrationDate?: string;
  odometerReading?: string;
  numberOfDoors?: string;
  customerExpectedPrice?: string;
  marketValue?: string;
  appraisalOffer?: string;
}

export interface RequestAppraisalData {
  assignedTo: string;
  requestNotes?: string;
}

export interface UpdateAppraisalStatusData {
  status: 'Pending' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
  appraisalNotes?: string;
  appraisalOffer?: string;
}

/**
 * Create a new trade-in appraisal
 */
export const createTradeInAppraisal = async (
  data: CreateTradeInAppraisalData
): Promise<{ success: boolean; id: number }> => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/trade-in-appraisal`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );
  return response.data.data;
};

/**
 * Get trade-in appraisal by ID
 */
export const getTradeInAppraisalById = async (id: number): Promise<TradeInAppraisal> => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/trade-in-appraisal/${id}`,
    {
      withCredentials: true,
    }
  );
  return response.data.data;
};

/**
 * Get trade-in appraisal by enquiry ID
 */
export const getTradeInAppraisalByEnquiryId = async (
  enquiryId: number
): Promise<TradeInAppraisal | null> => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/trade-in-appraisal/enquiry/${enquiryId}`,
    {
      withCredentials: true,
    }
  );
  return response.data.data;
};

/**
 * Update trade-in appraisal
 */
export const updateTradeInAppraisal = async (
  id: number,
  data: UpdateTradeInAppraisalData
): Promise<{ success: boolean }> => {
  const response = await axios.put(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/trade-in-appraisal/${id}`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );
  return response.data.data;
};

/**
 * Request appraisal - assign to a user
 */
export const requestAppraisal = async (
  id: number,
  data: RequestAppraisalData
): Promise<{ success: boolean }> => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/trade-in-appraisal/${id}/request`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );
  return response.data.data;
};

/**
 * Update appraisal status
 */
export const updateAppraisalStatus = async (
  id: number,
  data: UpdateAppraisalStatusData
): Promise<{ success: boolean }> => {
  const response = await axios.patch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/trade-in-appraisal/${id}/status`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );
  return response.data.data;
};

/**
 * Delete trade-in appraisal (soft delete)
 */
export const deleteTradeInAppraisal = async (id: number): Promise<{ success: boolean }> => {
  const response = await axios.delete(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/trade-in-appraisal/${id}`,
    {
      withCredentials: true,
    }
  );
  return response.data.data;
};
