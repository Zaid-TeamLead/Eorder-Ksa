import type { BookTestDriveFormData } from '../schema';

/**
 * Returns default values for Book Test Drive form
 * Single source of truth for default form state
 *
 * @param salesExecutiveName - Current user's name for salesExecutive field
 * @param overrides - Optional partial values to override defaults
 * @returns Complete default form values
 */
export function getBookTestDriveDefaultValues(
  salesExecutiveName?: string,
  overrides?: Partial<BookTestDriveFormData>
): BookTestDriveFormData {
  return {
    // Customer Details
    customerId: '',
    customerName: '',
    postcode: '',
    address: '',
    phoneNumber: '',
    email: '',

    // Vehicle Details
    registrationNumber: '',
    manufacturer: '',
    model: '',
    variant: '',
    description: '',
    bodyStyle: '',

    // Booking Details
    dateOut: '',
    timeOut: '',
    dateIn: '',
    timeIn: '',
    outBranch: '',
    outBranchName: '',
    inBranch: '',
    inBranchName: '',
    salesExecutive: salesExecutiveName || '',
    approvedBy: '',
    quickBooking: false,
    newOrUsed: undefined,
    newOrUsedLabel: '',

    // Booking Notes
    notes: '',
    fuelOut: '',
    fuelIn: '',
    mileageOut: '',
    mileageIn: '',

    // Apply any overrides
    ...overrides,
  };
}

/**
 * Returns default values for resetting customer fields only
 * Used when "New Customer" is clicked
 *
 * @param currentValues - Current form values to preserve non-customer fields
 * @returns Form values with customer fields reset
 */
export function getResetCustomerFieldsValues(
  currentValues: BookTestDriveFormData
): BookTestDriveFormData {
  return {
    ...currentValues,
    // Reset only customer fields
    customerId: '',
    customerName: '',
    postcode: '',
    address: '',
    phoneNumber: '',
    email: '',
  };
}
