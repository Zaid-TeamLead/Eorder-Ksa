import { z } from 'zod';

/**
 * Schema for creating a new trade-in appraisal
 */
export const createTradeInAppraisalSchema = z.object({
  enquirySlno: z.number().int().positive('Enquiry ID is required'),
  registrationNumber: z.string().max(50).optional(),
  vin: z.string().max(50).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  variant: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  colour: z.string().max(50).optional(),
  trim: z.string().max(50).optional(),
  bodyStyle: z.string().max(50).optional(),
  transmission: z.string().max(50).optional(),
  fuelType: z.string().max(50).optional(),
  engineSize: z.string().max(50).optional(),
  registrationDate: z.string().max(30).optional(),
  odometerReading: z.string().max(20).optional(),
  numberOfDoors: z.string().max(10).optional(),
  customerExpectedPrice: z.string().max(20).optional(),
  marketValue: z.string().max(20).optional(),
  appraisalOffer: z.string().max(20).optional(),
}).refine(
  (data) => data.registrationNumber || data.vin,
  {
    message: 'Either Registration Number or VIN is required',
    path: ['registrationNumber'],
  }
);

/**
 * Schema for updating a trade-in appraisal
 */
export const updateTradeInAppraisalSchema = z.object({
  registrationNumber: z.string().max(50).optional(),
  vin: z.string().max(50).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  variant: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  colour: z.string().max(50).optional(),
  trim: z.string().max(50).optional(),
  bodyStyle: z.string().max(50).optional(),
  transmission: z.string().max(50).optional(),
  fuelType: z.string().max(50).optional(),
  engineSize: z.string().max(50).optional(),
  registrationDate: z.string().max(30).optional(),
  odometerReading: z.string().max(20).optional(),
  numberOfDoors: z.string().max(10).optional(),
  customerExpectedPrice: z.string().max(20).optional(),
  marketValue: z.string().max(20).optional(),
  appraisalOffer: z.string().max(20).optional(),
});

/**
 * Schema for requesting an appraisal
 */
export const requestAppraisalSchema = z.object({
  assignedTo: z.string().min(1, 'Assigned user is required').max(100),
  requestNotes: z.string().max(5000).optional(),
});

/**
 * Schema for updating appraisal status
 */
export const updateAppraisalStatusSchema = z.object({
  status: z.enum(['Pending', 'InProgress', 'Completed', 'Approved', 'Rejected']),
  appraisalNotes: z.string().max(5000).optional(),
  appraisalOffer: z.string().max(20).optional(),
});

/**
 * Schema for query parameters
 */
export const getTradeInAppraisalByIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const getTradeInAppraisalByEnquiryIdSchema = z.object({
  enquiryId: z.string().regex(/^\d+$/, 'Enquiry ID must be a number').transform(Number),
});
