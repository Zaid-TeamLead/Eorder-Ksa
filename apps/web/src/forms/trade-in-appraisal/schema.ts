import { z } from 'zod';

/**
 * Trade-In Appraisal Form Schema
 * Standalone schema for the trade-in appraisal module
 */

// Optional string helper
export const optionalString = z.string().trim().optional();

export const tradeInAppraisalSchema = z.object({
  // Vehicle Identification
  registrationNumber: optionalString,
  vin: optionalString,
  manufacturer: optionalString,
  model: optionalString,
  variant: optionalString,
  description: optionalString,

  // Vehicle Specification
  colour: optionalString,
  trim: optionalString,
  bodyStyle: optionalString,
  transmission: optionalString,
  fuelType: optionalString,
  engineSize: optionalString,
  numberOfDoors: optionalString,

  // Registration & Mileage
  registrationDate: optionalString,
  odometerReading: optionalString,

  // Valuation
  customerExpectedPrice: optionalString,
  marketValue: optionalString,
  appraisalOffer: optionalString,
}).refine(
  (data) => data.registrationNumber || data.vin,
  {
    message: 'Either Registration Number or VIN is required',
    path: ['registrationNumber'],
  }
);

export type TradeInAppraisalFormData = z.infer<typeof tradeInAppraisalSchema>;
