import type { FieldMapping, ValueTransformer } from '../../utils/db-helpers.js';

/**
 * Field mappings for Sales Enquiry
 * Maps API/schema field names to database column names
 */
export const enquiryFieldMapping: FieldMapping = {
  // Customer Information
  customerId: 'CUSTOMERID',
  customerName: 'CUSTOMERNAME',
  address: 'ADDRESS',
  postcode: 'POSTCODE',
  homePhone: 'HOMEPHONE',
  workPhone: 'WORKPHONE',
  mobile: 'MOBILE',
  homeEmail: 'HOMEEMAIL',

  // Vehicle Details
  make: 'MAKE',
  makeName: 'MAKENAME',
  model: 'MODEL',
  modelName: 'MODELNAME',
  variant: 'VARIANT',
  variantName: 'VARIANTNAME',
  year: 'YEAR',
  color: 'COLOR',
  suppCatNum: 'SUPPCATNUM',
  modelCode: 'MODELCODE',
  quantity: 'QUANTITY',
  vinNumber: 'VINNUMBER',
  vinDetails: 'VINDETAILS',

  // Enquiry Details
  branch: 'BRANCH',
  branchName: 'BRANCHNAME',
  budget: 'BUDGET',
  financing: 'FINANCING',
  preferredContact: 'PREFERREDCONTACT',
  preferredTime: 'PREFERREDTIME',
  preferredDelivery: 'PREFERREDDELIVERY',
  source: 'SOURCE',
  salesType: 'SALESTYPE',

  // Trade-in
  tradeInMake: 'TRADEINMAKE',
  tradeInModel: 'TRADEINMODEL',
  tradeInYear: 'TRADEINYEAR',
  tradeInKms: 'TRADEINKMS',
  tradeInExpectedPrice: 'TRADEINEXPECTEDPRICE',

  // Additional
  salesperson: 'SALESPERSON',
  slpCode: 'SLPCODE',
  notes: 'NOTES',
  status: 'STATUS',
  priority: 'PRIORITY',
  followUpDate: 'FOLLOWUPDATE',
  followUpNotes: 'FOLLOWUPNOTES',
};

/**
 * Value transformers for Sales Enquiry
 * Custom logic for specific fields
 */
export const enquiryValueTransformers: ValueTransformer = {
  vinDetails: (value: any) => (value ? JSON.stringify(value) : null),
  quantity: (value: any) => (value === undefined ? 1 : value),
};

/**
 * Field mappings for Book Test Drive
 */
export const bookTestDriveFieldMapping: FieldMapping = {
  // Customer Information
  customerId: 'CUSTOMERID',
  customerName: 'CUSTOMERNAME',
  postcode: 'POSTCODE',
  address: 'ADDRESS',
  phoneNumber: 'PHONENUMBER',
  email: 'EMAIL',

  // Vehicle Details
  registrationNumber: 'REGISTRATIONNUM',
  manufacturer: 'MANUFACTURER',
  model: 'MODEL',
  variant: 'VARIANT',
  description: 'DESCRIPTION',
  bodyStyle: 'BODYSTYLE',

  // Booking Details
  dateOut: 'DATEOUT',
  timeOut: 'TIMEOUT',
  dateIn: 'DATEIN',
  timeIn: 'TIMEIN',
  outBranch: 'OUTBRANCH',
  outBranchName: 'OUTBRANCHNAME',
  inBranch: 'INBRANCH',
  inBranchName: 'INBRANCHNAME',
  salesExecutive: 'SALESEXECUTIVE',
  approvedBy: 'APPROVEDBY',
  quickBooking: 'QUICKBOOKING',
  newOrUsed: 'NEWORUSED',
  newOrUsedLabel: 'NEWORUSEDLABEL',

  // Notes
  notes: 'NOTES',
  fuelOut: 'FUELOUT',
  fuelIn: 'FUELIN',
  mileageOut: 'MILEAGEOUT',
  mileageIn: 'MILEAGEIN',
};

/**
 * Value transformers for Book Test Drive
 */
export const bookTestDriveValueTransformers: ValueTransformer = {
  quickBooking: (value: any) => {
    if (value === undefined) return null;
    return value ? 'true' : 'false';
  },
  fuelOut: (value: any) => (value && value.trim() !== '' ? value : null),
  fuelIn: (value: any) => (value && value.trim() !== '' ? value : null),
  mileageOut: (value: any) => (value && value.trim() !== '' ? value : null),
  mileageIn: (value: any) => (value && value.trim() !== '' ? value : null),
};
