import { z } from 'zod';

export const salesEnquirySchema = z.object({
  // Customer Information
  customerName: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  homePhone: z.string().optional(),
  workPhone: z.string().optional(),
  mobile: z.string().min(1, 'Mobile is required'),
  homeEmail: z.string().email('Invalid email').optional().or(z.literal('')),

  // Vehicle Details
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  variant: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
  suppCatNum: z.string().optional(),
  modelCode: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1').optional(),

  // Enquiry Details
  budget: z.string().optional(),
  financing: z.enum(['yes', 'no', 'maybe']).optional(),
  preferredContact: z.enum(['phone', 'email', 'whatsapp', 'sms']).optional(),
  preferredTime: z
    .enum(['morning', 'afternoon', 'evening', 'anytime'])
    .optional(),
  preferredDelivery: z.string().optional(),
  source: z.string().optional(),

  // Trade-in Vehicle
  tradeInMake: z.string().optional(),
  tradeInModel: z.string().optional(),
  tradeInYear: z.string().optional(),
  tradeInKms: z.string().optional(),
  tradeInExpectedPrice: z.string().optional(),

  // Additional Information
  salesperson: z.string().optional(),
  notes: z.string().optional(),
});

export type SalesEnquiryFormData = z.infer<typeof salesEnquirySchema>;
