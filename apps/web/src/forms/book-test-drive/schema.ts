import { z } from "zod";

export const bookTestDriveSchema = z.object({
  // Customer Information
  customerName: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  homePhone: z.string().optional(),
  workPhone: z.string().optional(),
  mobile: z.string().min(1, "Mobile is required"),
  homeEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  workEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  previousName: z.string().optional(),
  jobTitle: z.string().optional(),
  companyPosition: z.string().optional(),
  businessType: z.string().optional(),
  sourceOfInfo: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().optional(),

  // Vehicle Details
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  variant: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
  fuelType: z
    .enum(["petrol", "diesel", "cng", "electric", "hybrid"])
    .optional(),
  transmission: z.enum(["manual", "automatic", "amt", "cvt"]).optional(),

  // Enquiry Details
  budget: z.string().optional(),
  financing: z.enum(["yes", "no", "maybe"]).optional(),
  preferredContact: z.enum(["phone", "email", "whatsapp", "sms"]).optional(),
  preferredTime: z
    .enum(["morning", "afternoon", "evening", "anytime"])
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

export type BookTestDriveFormData = z.infer<typeof bookTestDriveSchema>;
