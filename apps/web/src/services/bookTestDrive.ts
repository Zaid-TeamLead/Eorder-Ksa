import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface BookTestDrive {
  SLNO: number;
  CUSTOMERID?: string;
  CUSTOMERNAME: string;
  POSTCODE?: string;
  ADDRESS: string;
  PHONENUMBER?: string;
  EMAIL?: string;
  REGISTRATIONNUM?: string;
  MANUFACTURER?: string;
  MODEL?: string;
  VARIANT?: string;
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
  return apiClient.get<BookTestDrive[]>(API_ENDPOINTS.BOOK_TEST_DRIVE);
};

export const getBookTestDriveById = async (
  id: number
): Promise<BookTestDrive> => {
  return apiClient.get<BookTestDrive>(API_ENDPOINTS.TEST_DRIVE_BY_ID(id));
};

export interface UpdateBookTestDriveData {
  customerId?: string;
  customerName?: string;
  postcode?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  registrationNumber?: string;
  manufacturer?: string;
  model?: string;
  variant?: string;
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
  return apiClient.put<BookTestDrive>(API_ENDPOINTS.TEST_DRIVE_BY_ID(id), data);
};

export interface CreateBookTestDriveData extends UpdateBookTestDriveData {
  // All fields from UpdateBookTestDriveData are available
}

export const createBookTestDrive = async (
  data: CreateBookTestDriveData
): Promise<BookTestDrive> => {
  return apiClient.post<BookTestDrive>(API_ENDPOINTS.BOOK_TEST_DRIVE, data);
};

export const deleteBookTestDrive = async (id: number): Promise<void> => {
  return apiClient.delete<void>(API_ENDPOINTS.TEST_DRIVE_BY_ID(id));
};
