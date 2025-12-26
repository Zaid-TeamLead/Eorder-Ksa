import { z } from 'zod';

/**
 * Schema for creating a new financing scheme
 */
export const createFinancingSchema = z.object({
  enquirySlno: z.number().int().positive(),
  lenderCode: z.string().min(1, 'Lender code is required'),
  lenderName: z.string().min(1, 'Lender name is required'),
  schemeName: z.string().optional(),

  // Financial Parameters
  vehiclePrice: z.number().nonnegative().optional(),
  downpayment: z.number().nonnegative().optional(),
  downpaymentPercent: z.number().min(0).max(100).optional(),
  tradeInValue: z.number().nonnegative().optional(),
  financeAmount: z.number().nonnegative().optional(),

  termMonths: z.number().int().min(1).max(120),
  interestRate: z.number().min(0).max(100).optional(),
  monthlyPayment: z.number().nonnegative().optional(),
  totalInterest: z.number().nonnegative().optional(),

  // Additional Parameters
  fda: z.number().nonnegative().optional(),
  gpvBalloon: z.number().nonnegative().optional(),
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
 * Type inference from schema
 */
export type CreateFinancingInput = z.infer<typeof createFinancingSchema>;
export type UpdateFinancingInput = z.infer<typeof updateFinancingSchema>;
