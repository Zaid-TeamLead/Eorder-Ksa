import { z } from 'zod';
import {
  customerBaseSchema,
  customerContactSchema,
  vehicleTestDriveSchema,
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

// ============================================================================
// Main Create Schema
// ============================================================================

export const createBookTestDriveSchema = customerBaseSchema
  .merge(customerContactSchema)
  .merge(vehicleTestDriveSchema)
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
