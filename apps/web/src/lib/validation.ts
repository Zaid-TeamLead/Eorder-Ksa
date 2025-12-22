import { z } from 'zod';

// ============================================================================
// Reusable Validators
// ============================================================================

/**
 * Email validator with empty string support
 */
export const emailValidator = z
  .string()
  .trim()
  .email('Invalid email address')
  .optional()
  .or(z.literal(''));

/**
 * Phone number validator (basic format check)
 */
export const phoneValidator = z
  .string()
  .trim()
  .regex(/^[0-9+\-() ]*$/, 'Invalid phone number format')
  .optional();

/**
 * Required phone validator
 */
export const requiredPhoneValidator = (fieldName: string = 'Phone number') =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .regex(/^[0-9+\-() ]+$/, 'Invalid phone number format');

/**
 * Required string validator with custom message
 */
export const requiredString = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} is required`);

/**
 * Optional string validator
 */
export const optionalString = z.string().trim().optional();

/**
 * Non-empty optional string (if provided, must not be empty)
 */
export const nonEmptyOptionalString = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} cannot be empty`).optional();

/**
 * Postcode validator
 */
export const postcodeValidator = z.string().trim().optional();

/**
 * Number validator with minimum
 */
export const positiveNumber = (fieldName: string, min: number = 1) =>
  z.number().min(min, `${fieldName} must be at least ${min}`);

// ============================================================================
// Common Enums
// ============================================================================

export const financingOptions = ['yes', 'no', 'maybe'] as const;
export const preferredContactOptions = ['phone', 'email', 'whatsapp', 'sms'] as const;
export const preferredTimeOptions = ['morning', 'afternoon', 'evening', 'anytime'] as const;
export const newOrUsedOptions = ['N', 'U'] as const;

// ============================================================================
// Common Field Groups
// ============================================================================

/**
 * Base customer information schema
 */
export const customerBaseSchema = z.object({
  customerId: optionalString,
  customerName: requiredString('Customer name'),
  address: optionalString,
  postcode: postcodeValidator,
});

/**
 * Customer contact information
 */
export const customerContactSchema = z.object({
  phoneNumber: phoneValidator,
  email: emailValidator,
});

/**
 * Extended customer contact for enquiry
 */
export const customerEnquiryContactSchema = z.object({
  homePhone: phoneValidator,
  workPhone: phoneValidator,
  mobile: requiredString('Mobile'),
  homeEmail: emailValidator,
});

/**
 * Vehicle base information
 */
export const vehicleBaseSchema = z.object({
  make: requiredString('Make'),
  model: requiredString('Model'),
  variant: optionalString,
});

/**
 * Branch information
 */
export const branchSchema = z.object({
  branch: optionalString,
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Transform empty strings to undefined for optional fields
 */
export function transformEmptyToUndefined<T extends Record<string, any>>(data: T): T {
  const result = { ...data };
  for (const key in result) {
    if (result[key] === '') {
      result[key] = undefined as any;
    }
  }
  return result;
}

/**
 * Create enum validator with custom error message
 */
export function createEnumValidator<T extends readonly string[]>(
  values: T,
  fieldName: string
) {
  return z.enum(values as [string, ...string[]], {
    errorMap: () => ({ message: `Invalid ${fieldName}` }),
  });
}
