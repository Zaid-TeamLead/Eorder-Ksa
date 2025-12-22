import { z } from 'zod';
import {
  customerBaseSchema,
  customerContactSchema,
  vehicleExtendedSchema,
  optionalStringValidator,
  requiredStringValidator,
  nonEmptyStringValidator,
  newOrUsedEnum,
  idParamSchema as baseIdParamSchema,
} from './shared/base.schema.js';

// Booking-specific schemas
const bookingDetailsSchema = z.object({
  dateOut: requiredStringValidator('Date out'),
  timeOut: optionalStringValidator,
  dateIn: requiredStringValidator('Date in'),
  timeIn: optionalStringValidator,
  outBranch: optionalStringValidator,
  outBranchName: optionalStringValidator,
  inBranch: optionalStringValidator,
  inBranchName: optionalStringValidator,
  salesExecutive: optionalStringValidator,
  salesExecutiveName: optionalStringValidator,
  approvedBy: optionalStringValidator,
  quickBooking: z.boolean().optional(),
  newOrUsed: newOrUsedEnum.optional(),
  newOrUsedLabel: optionalStringValidator,
});

const bookingNotesSchema = z.object({
  notes: optionalStringValidator,
  fuelOut: optionalStringValidator,
  fuelIn: optionalStringValidator,
  mileageOut: optionalStringValidator,
  mileageIn: optionalStringValidator,
});

// Additional fields specific to test drive
const testDriveCustomerSchema = z.object({
  companyName: optionalStringValidator,
});

// ============================================================================
// Main Create Schema
// ============================================================================

export const createBookTestDriveSchema = customerBaseSchema
  .merge(testDriveCustomerSchema)
  .merge(customerContactSchema)
  .merge(vehicleExtendedSchema)
  .merge(bookingDetailsSchema)
  .merge(bookingNotesSchema)
  .extend({
    address: requiredStringValidator('Address'), // Override to make required
  });

// ============================================================================
// Update Schema (using .partial() - eliminates 103 lines of duplication!)
// ============================================================================

export const updateBookTestDriveSchema = createBookTestDriveSchema.partial().extend({
  // For update, if provided, these fields must still meet minimum requirements
  customerName: nonEmptyStringValidator('Customer name'),
  address: nonEmptyStringValidator('Address'),
});

// ============================================================================
// Export ID param schema
// ============================================================================

export const idParamSchema = baseIdParamSchema;

// ============================================================================
// Type Exports
// ============================================================================

export type CreateBookTestDriveInput = z.infer<typeof createBookTestDriveSchema>;
export type UpdateBookTestDriveInput = z.infer<typeof updateBookTestDriveSchema>;
