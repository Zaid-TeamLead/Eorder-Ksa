import { z } from 'zod';
import {
  customerBaseSchema,
  customerContactSchema,
  requiredString,
  optionalString,
  newOrUsedOptions,
  createEnumValidator,
} from '@/lib/validation';

// Test drive specific customer fields
const testDriveCustomerExtension = z.object({
  companyName: optionalString,
});

// Vehicle details for test drive
const testDriveVehicleSchema = z.object({
  registrationNumber: optionalString,
  manufacturer: optionalString,
  model: optionalString,
  variant: optionalString,
  description: optionalString,
  bodyStyle: optionalString,
});

// Booking details
const bookingDetailsSchema = z.object({
  dateOut: requiredString('Date out'),
  timeOut: optionalString,
  dateIn: requiredString('Date in'),
  timeIn: optionalString,
  outBranch: optionalString,
  outBranchName: optionalString,
  inBranch: optionalString,
  inBranchName: optionalString,
  salesExecutive: optionalString,
  salesExecutiveName: optionalString,
  approvedBy: optionalString,
  quickBooking: z.boolean().optional(),
  newOrUsed: createEnumValidator(newOrUsedOptions, 'vehicle type').optional(),
  newOrUsedLabel: optionalString,
});

// Booking notes and metrics
const bookingNotesSchema = z.object({
  notes: optionalString,
  fuelOut: optionalString,
  fuelIn: optionalString,
  mileageOut: optionalString,
  mileageIn: optionalString,
});

// ============================================================================
// Main Schema
// ============================================================================

export const bookTestDriveSchema = customerBaseSchema
  .merge(testDriveCustomerExtension)
  .merge(customerContactSchema)
  .merge(testDriveVehicleSchema)
  .merge(bookingDetailsSchema)
  .merge(bookingNotesSchema)
  .extend({
    address: requiredString('Address'), // Override to make required
  });

export type BookTestDriveFormData = z.infer<typeof bookTestDriveSchema>;
