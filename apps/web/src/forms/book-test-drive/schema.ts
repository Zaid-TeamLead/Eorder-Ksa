import { z } from 'zod';

export const bookTestDriveSchema = z.object({
  // Customer Information
  customerName: z.string().min(1, 'Customer name is required'),
  address: z.string().min(1, 'Address is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),

  // Contact Preferences
  modeOfContact: z
    .enum(['phone', 'email', 'whatsapp', 'sms'])
    .refine((val) => val !== undefined, {
      message: 'Please select a mode of contact',
    }),

  // Booking Details
  bookingDate: z
    .string()
    .min(1, 'Booking date is required')
    .refine((val) => val !== undefined, {
      message: 'Booking date is required',
    }),
  timeSlot: z
    .string()
    .min(1, 'Time slot is required')
    .refine((val) => val !== undefined, {
      message: 'Time slot is required',
    }),

  // Optional Notes
  notes: z.string().optional(),
});

export type BookTestDriveFormData = z.infer<typeof bookTestDriveSchema>;
