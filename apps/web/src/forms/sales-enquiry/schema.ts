import { z } from 'zod';

export const salesEnquirySchema = z.object({
  // Customer Information
  customerId: z.string().optional(),
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
  vinNumber: z.string().optional(),
  vinDetails: z
    .object({
      Location: z.string().optional(),
      VIN: z.string().optional(),
      WhsCode: z.string().optional(),
      WhsName: z.string().optional(),
      ItemCode: z.string().optional(),
      InDate: z.string().optional(),
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
      Price: z.string().optional(),
      Discount: z.string().nullable().optional(),
      Discprice: z.string().nullable().optional(),
      Currency: z.string().optional(),
    })
    .optional(),

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
