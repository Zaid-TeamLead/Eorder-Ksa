import { z } from 'zod';

export const salesOrderStatusEnum = z.enum([
  'Provisional',
  'Printed',
  'Superseded',
  'PassedToVehicleAdmin',
  'HandoverBooked',
  'Lost',
  'Cancelled',
]);

export const createSalesOrderFromQuotationSchema = z.object({
  quotationSlno: z
    .number()
    .int()
    .positive({ message: 'Valid quotation ID is required' }),
  notes: z.string().max(5000).optional(),
});

export const updateSalesOrderSchema = z
  .object({
    notes: z.string().max(5000).optional(),
    vinNumber: z.string().trim().min(1).max(100).optional(),
  })
  .refine((data) => data.notes !== undefined || data.vinNumber !== undefined, {
    message: 'At least one field must be provided',
  });

export const passToVehicleAdminSchema = z.object({
  assignedTo: z
    .string()
    .min(1, { message: 'Vehicle admin assignee is required' })
    .max(100),
  notes: z.string().max(5000).optional(),
});

export const reserveVehicleSchema = z.object({
  reservationNotes: z.string().max(5000).optional(),
});

export const createHandoverBookingSchema = z.object({
  handoverDate: z
    .string()
    .min(1, { message: 'Handover date is required' })
    .max(30),
  handoverTime: z.string().max(30).optional(),
  handoverLocation: z.string().max(255).optional(),
  notes: z.string().max(5000).optional(),
});

export const recordLostSaleSchema = z.object({
  lostReason: z
    .string()
    .min(3, { message: 'Lost reason is required' })
    .max(5000),
  notes: z.string().max(5000).optional(),
});

export const cancelSalesOrderSchema = z.object({
  cancellationReason: z
    .string()
    .min(3, { message: 'Cancellation reason is required' })
    .max(5000),
});

export const salesOrderFiltersSchema = z.object({
  status: salesOrderStatusEnum.optional(),
  slpCode: z.string().max(50).optional(),
  quotationSlno: z.number().int().positive().optional(),
  enquirySlno: z.number().int().positive().optional(),
  orderNumber: z.string().max(50).optional(),
});

export const getSalesOrderByIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, { message: 'ID must be a number' })
    .transform(Number),
});

export type CreateSalesOrderFromQuotationInput = z.infer<
  typeof createSalesOrderFromQuotationSchema
>;
export type UpdateSalesOrderInput = z.infer<typeof updateSalesOrderSchema>;
export type PassToVehicleAdminInput = z.infer<typeof passToVehicleAdminSchema>;
export type ReserveVehicleInput = z.infer<typeof reserveVehicleSchema>;
export type CreateHandoverBookingInput = z.infer<
  typeof createHandoverBookingSchema
>;
export type RecordLostSaleInput = z.infer<typeof recordLostSaleSchema>;
export type CancelSalesOrderInput = z.infer<typeof cancelSalesOrderSchema>;
export type SalesOrderFilters = z.infer<typeof salesOrderFiltersSchema>;
