import { z } from 'zod';

export const bookTestDriveSchema = z.object({
  // Customer Information
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  companyName: z.string().optional(),
  postcode: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),

  // Vehicle Booking Details
  registrationNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  variant: z.string().optional(),
  description: z.string().optional(),
  bodyStyle: z.string().optional(),

  // Booking Details
  dateOut: z.string().min(1, 'Date out is required'),
  timeOut: z.string().optional(),
  dateIn: z.string().min(1, 'Date in is required'),
  timeIn: z.string().optional(),
  outBranch: z.string().optional(),
  outBranchName: z.string().optional(),
  inBranch: z.string().optional(),
  inBranchName: z.string().optional(),
  salesExecutive: z.string().optional(),
  salesExecutiveName: z.string().optional(),
  approvedBy: z.string().optional(),
  quickBooking: z.boolean().optional(),
  newOrUsed: z.enum(['N', 'U']).optional(),
  newOrUsedLabel: z.string().optional(),

  // Optional Notes
  notes: z.string().optional(),
});

export type BookTestDriveFormData = z.infer<typeof bookTestDriveSchema>;
