import axios from 'axios';

const API_BASE = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/book-test-drive`;

export interface BookTestDrive {
  SLNO: number;
  CUSTOMERID?: string;
  CUSTOMERNAME: string;
  COMPANYNAME?: string;
  POSTCODE?: string;
  ADDRESS: string;
  PHONENUMBER?: string;
  EMAIL?: string;
  REGISTRATIONNUM?: string;
  MANUFACTURER?: string;
  MANUFACTURERNAME?: string;
  MODEL?: string;
  MODELNAME?: string;
  VARIANT?: string;
  VARIANTNAME?: string;
  DESCRIPTION?: string;
  BODYSTYLE?: string;
  DATEOUT: string;
  TIMEOUT?: string;
  DATEIN: string;
  TIMEIN?: string;
  OUTBRANCH?: string;
  OUTBRANCHNAME?: string;
  INBRANCH?: string;
  INBRANCHNAME?: string;
  SALESEXECUTIVE?: string;
  SALESEXECUTIVENAME?: string;
  APPROVEDBY?: string;
  QUICKBOOKING?: string;
  NEWORUSED?: string;
  NEWORUSEDLABEL?: string;
  NOTES?: string;
  FUELOUT?: string;
  FUELIN?: string;
  MILEAGEOUT?: string;
  MILEAGEIN?: string;
  CREATEDDATE?: string;
  CREATEDBY?: string;
  UPDATEDDATE?: string;
  UPDATEDBY?: string;
  STATUS?: string;
}

export const getAllBookTestDrives = async (): Promise<BookTestDrive[]> => {
  const response = await axios.get(`${API_BASE}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data?.data || [];
};

export const getBookTestDriveById = async (
  id: number
): Promise<BookTestDrive> => {
  const response = await axios.get(`${API_BASE}/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};

export interface UpdateBookTestDriveData {
  customerId?: string;
  customerName?: string;
  companyName?: string;
  postcode?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  registrationNumber?: string;
  manufacturer?: string;
  manufacturerName?: string;
  model?: string;
  modelName?: string;
  variant?: string;
  variantName?: string;
  description?: string;
  bodyStyle?: string;
  dateOut?: string;
  timeOut?: string;
  dateIn?: string;
  timeIn?: string;
  outBranch?: string;
  outBranchName?: string;
  inBranch?: string;
  inBranchName?: string;
  salesExecutive?: string;
  salesExecutiveName?: string;
  approvedBy?: string;
  quickBooking?: boolean;
  newOrUsed?: 'N' | 'U';
  newOrUsedLabel?: string;
  notes?: string;
  fuelOut?: string;
  fuelIn?: string;
  mileageOut?: string;
  mileageIn?: string;
}

export const updateBookTestDrive = async (
  id: number,
  data: UpdateBookTestDriveData
): Promise<BookTestDrive> => {
  const response = await axios.put(`${API_BASE}/${id}`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data.data;
};
