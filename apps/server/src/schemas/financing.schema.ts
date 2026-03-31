import { z } from 'zod';

const emptyToUndefined = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  return value;
};

const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().nonnegative().optional()
);
const optionalPercent = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0).max(100).optional()
);
const requiredInteger = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).max(120)
);

/**
 * Schema for creating a new financing scheme
 */
export const createFinancingSchema = z.object({
  enquirySlno: z.coerce.number().int().positive(),
  lenderCode: z.string().min(1, 'Lender code is required'),
  lenderName: z.string().min(1, 'Lender name is required'),
  schemeName: z.string().optional(),
  currency: z.string().optional(),

  // Financial Parameters
  vehiclePrice: optionalNumber,
  downpayment: optionalNumber,
  downpaymentPercent: optionalPercent,
  tradeInValue: optionalNumber,
  financeAmount: optionalNumber,

  termMonths: requiredInteger,
  interestRate: optionalPercent,
  monthlyPayment: optionalNumber,
  totalInterest: optionalNumber,

  // Additional Parameters
  fda: optionalNumber,
  gpvBalloon: optionalNumber,
  saleCode: z.string().optional(),

  // Status
  status: z.enum(['Draft', 'Active', 'Approved', 'Rejected']).optional(),
  isSelected: z.enum(['Y', 'N']).optional(),
});

/**
 * Schema for updating an existing financing scheme
 * All fields are optional for partial updates
 */
export const updateFinancingSchema = createFinancingSchema.partial().omit({ enquirySlno: true });

/**
 * Schema for validating ID params in routes (GET/:id, PUT/:id, DELETE/:id, PATCH/:id/preferred)
 */
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number'),
});

/**
 * Type inference from schema
 */
export type CreateFinancingInput = z.infer<typeof createFinancingSchema>;
export type UpdateFinancingInput = z.infer<typeof updateFinancingSchema>;
