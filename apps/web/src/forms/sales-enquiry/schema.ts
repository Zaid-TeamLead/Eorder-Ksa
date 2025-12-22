import { z } from 'zod';
import {
  customerBaseSchema,
  customerEnquiryContactSchema,
  optionalString,
  positiveNumber,
  financingOptions,
  preferredContactOptions,
  preferredTimeOptions,
  createEnumValidator,
} from '@/lib/validation';

// VIN Details Schema (same as before)
const vinDetailsSchema = z
  .object({
    Location: optionalString,
    VIN: optionalString,
    WhsCode: optionalString,
    WhsName: optionalString,
    ItemCode: optionalString,
    InDate: optionalString,
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
    Price: optionalString,
    Discount: z.string().nullable().optional(),
    Discprice: z.string().nullable().optional(),
    Currency: optionalString,
  })
  .optional();

// Vehicle details
const vehicleSchema = z.object({
  make: z.string().trim().min(1, 'Make is required'),
  model: z.string().trim().min(1, 'Model is required'),
  variant: optionalString,
  year: optionalString,
  color: optionalString,
  suppCatNum: optionalString,
  modelCode: optionalString,
  quantity: positiveNumber('Quantity').optional(),
  vinNumber: optionalString,
  vinDetails: vinDetailsSchema,
});

// Trade-in information
const tradeInSchema = z.object({
  tradeInMake: optionalString,
  tradeInModel: optionalString,
  tradeInYear: optionalString,
  tradeInKms: optionalString,
  tradeInExpectedPrice: optionalString,
});

// Enquiry details
const enquiryDetailsSchema = z.object({
  branch: optionalString,
  budget: optionalString,
  financing: createEnumValidator(financingOptions, 'financing option').optional(),
  preferredContact: createEnumValidator(
    preferredContactOptions,
    'contact method'
  ).optional(),
  preferredTime: createEnumValidator(
    preferredTimeOptions,
    'preferred time'
  ).optional(),
  preferredDelivery: optionalString,
  source: optionalString,
  sales_type: optionalString,
});

// Salesperson
const salespersonSchema = z.object({
  salesperson: optionalString,
  slpCode: optionalString,
  notes: optionalString,
});

// ============================================================================
// Main Schema
// ============================================================================

export const salesEnquirySchema = customerBaseSchema
  .merge(customerEnquiryContactSchema)
  .merge(vehicleSchema)
  .merge(tradeInSchema)
  .merge(enquiryDetailsSchema)
  .merge(salespersonSchema);

export type SalesEnquiryFormData = z.infer<typeof salesEnquirySchema>;
