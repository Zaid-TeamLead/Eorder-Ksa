import { z } from 'zod';

// ============================================================================
// Reusable Field Validators
// ============================================================================

export const emailValidator = z
  .string()
  .trim()
  .email('Invalid email address')
  .optional()
  .or(z.literal(''));

export const phoneValidator = z.string().trim().optional();

export const requiredStringValidator = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} is required`);

export const optionalStringValidator = z.string().trim().optional();

export const nonEmptyStringValidator = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} cannot be empty`).optional();

export const postcodeValidator = z.string().trim().optional();

export const idValidator = z.string().regex(/^\d+$/, 'ID must be a number');

// ============================================================================
// Common Field Groups (Base Schemas)
// ============================================================================

// Customer Information Schema
export const customerBaseSchema = z.object({
  customerId: optionalStringValidator,
  customerName: requiredStringValidator('Customer name'),
  address: optionalStringValidator,
  postcode: postcodeValidator,
});

// Extended Customer Info for different contexts
export const customerContactSchema = z.object({
  phoneNumber: phoneValidator,
  email: emailValidator,
});

export const customerEnquiryContactSchema = z.object({
  homePhone: phoneValidator,
  workPhone: phoneValidator,
  mobile: requiredStringValidator('Mobile'),
  homeEmail: emailValidator,
});

// Vehicle Base Schema (for Sales Enquiry)
export const vehicleBaseSchema = z.object({
  make: optionalStringValidator,
  makeName: optionalStringValidator,
  model: optionalStringValidator,
  modelName: optionalStringValidator,
  variant: optionalStringValidator,
  variantName: optionalStringValidator,
});

// Vehicle Schema for Test Drive (no name fields - they don't exist in DB)
export const vehicleTestDriveSchema = z.object({
  manufacturer: optionalStringValidator,
  model: optionalStringValidator,
  variant: optionalStringValidator,
  registrationNumber: optionalStringValidator,
  description: optionalStringValidator,
  bodyStyle: optionalStringValidator,
});

// Branch Schema
export const branchSchema = z.object({
  branch: optionalStringValidator,
  branchName: optionalStringValidator,
});

// Audit Schema (typically added by system, not user input)
export const auditCreateSchema = z.object({
  createdBy: z.string(),
  createdDate: z.string().optional(),
});

export const auditUpdateSchema = z.object({
  updatedBy: z.string().optional(),
  updatedDate: z.string().optional(),
});

// ============================================================================
// Enums for Constrained Fields
// ============================================================================

export const financingEnum = z.enum(['yes', 'no', 'maybe']);
export const preferredContactEnum = z.enum(['phone', 'email', 'whatsapp', 'sms']);
export const preferredTimeEnum = z.enum(['morning', 'afternoon', 'evening', 'anytime']);
export const newOrUsedEnum = z.enum(['N', 'U']);
export const statusEnum = z.enum(['Active', 'Inactive', 'Pending', 'Completed', 'Cancelled', 'Deleted']);
export const priorityEnum = z.enum(['Low', 'Medium', 'High', 'Urgent']);

// ============================================================================
// Common Parameter Schemas
// ============================================================================

export const idParamSchema = z.object({
  id: idValidator,
});
