import { z } from 'zod';
import {
  customerBaseSchema,
  customerEnquiryContactSchema,
  vehicleBaseSchema,
  branchSchema,
  optionalStringValidator,
  requiredStringValidator,
  financingEnum,
  preferredContactEnum,
  preferredTimeEnum,
  idParamSchema as baseIdParamSchema,
} from './shared/base.schema.js';

// VIN Details Schema (specific to enquiry)
const vinDetailsSchema = z
  .object({
    Location: z.string().nullable().optional(),
    VIN: z.string().nullable().optional(),
    WhsCode: z.string().nullable().optional(),
    WhsName: z.string().nullable().optional(),
    ItemCode: z.string().nullable().optional(),
    InDate: z.string().nullable().optional(),
    U_Veh_StockID: z.string().nullable().optional(),
    U_Veh_Brand: z.string().nullable().optional(),
    U_Veh_Model: z.string().nullable().optional(),
    U_Veh_Color: z.string().nullable().optional(),
    U_Veh_Transmutation: z.string().nullable().optional(),
    U_Veh_ModelDescr: z.string().nullable().optional(),
    U_Veh_ModelFull: z.string().nullable().optional(),
    U_Veh_EngineNo: z.string().nullable().optional(),
    U_Veh_MY: z.string().nullable().optional(),
    U_Vehicle_MC: z.string().nullable().optional(),
    U_Veh_OrderNo: z.string().nullable().optional(),
    U_Veh_DispDate: z.string().nullable().optional(),
    U_Veh_IC: z.string().nullable().optional(),
    AgeinDays: z.number().optional(),
    Price: z.string().nullable().optional(),
    Discount: z.string().nullable().optional(),
    Discprice: z.string().nullable().optional(),
    Currency: z.string().nullable().optional(),
  })
  .passthrough()
  .optional();

// Vehicle Details for Enquiry (extends base)
const enquiryVehicleSchema = vehicleBaseSchema.extend({
  make: requiredStringValidator('Make'),
  model: requiredStringValidator('Model'),
  year: optionalStringValidator,
  color: optionalStringValidator,
  suppCatNum: optionalStringValidator,
  modelCode: optionalStringValidator,
  quantity: z.number().min(1).optional(),
  vinNumber: optionalStringValidator,
  vinDetails: vinDetailsSchema,
});

// Trade-in Vehicle Schema
const tradeInSchema = z.object({
  tradeInMake: optionalStringValidator,
  tradeInModel: optionalStringValidator,
  tradeInYear: optionalStringValidator,
  tradeInKms: optionalStringValidator,
  tradeInExpectedPrice: optionalStringValidator,
});

// Enquiry Details Schema
const enquiryDetailsSchema = z.object({
  budget: optionalStringValidator,
  financing: financingEnum.optional(),
  chargeCode: optionalStringValidator,
  chargeName: optionalStringValidator,
  chargePrice: optionalStringValidator,
  chargeDetails: z.record(z.string(), z.any()).optional(),
  preferredContact: preferredContactEnum.optional(),
  preferredTime: preferredTimeEnum.optional(),
  preferredDelivery: optionalStringValidator,
  source: optionalStringValidator,
  salesType: optionalStringValidator,
});

// Salesperson Schema
const salespersonSchema = z.object({
  salesperson: optionalStringValidator,
  slpCode: optionalStringValidator,
  notes: optionalStringValidator,
});

// Status & Follow-up Schema
const followUpSchema = z.object({
  status: optionalStringValidator,
  priority: optionalStringValidator,
  followUpDate: optionalStringValidator,
  followUpNotes: optionalStringValidator,
});

// ============================================================================
// Main Create Schema (merge all sections)
// ============================================================================

export const createEnquirySchema = customerBaseSchema
  .merge(customerEnquiryContactSchema)
  .merge(enquiryVehicleSchema)
  .merge(branchSchema)
  .merge(tradeInSchema)
  .merge(enquiryDetailsSchema)
  .merge(salespersonSchema)
  .merge(followUpSchema);

// ============================================================================
// Update Schema (using .partial())
// ============================================================================

export const updateEnquirySchema = createEnquirySchema.partial();

// ============================================================================
// Status Update Schema
// ============================================================================

export const updateStatusSchema = z.object({
  status: requiredStringValidator('Status'),
  notes: optionalStringValidator,
});

// ============================================================================
// Export ID param schema
// ============================================================================

export const idParamSchema = baseIdParamSchema;

// ============================================================================
// Type Exports
// ============================================================================

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
