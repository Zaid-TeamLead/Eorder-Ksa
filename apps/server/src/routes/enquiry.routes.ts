import { Router } from 'express';
import { z } from 'zod';
import {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  updateEnquiryStatus,
  deleteEnquiry,
  getEnquiryStats,
} from '../controllers/enquiry.controller.js';
import { validate } from '../middleware/validator.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

// Validation schemas
const createEnquirySchema = z.object({
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
  make: z.string().optional(),
  makeName: z.string().optional(),
  model: z.string().optional(),
  modelName: z.string().optional(),
  variant: z.string().optional(),
  variantName: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
  suppCatNum: z.string().optional(),
  modelCode: z.string().optional(),
  quantity: z.number().min(1).optional(),
  vinNumber: z.string().optional(),
  vinDetails: z.any().optional(), // JSON object

  // Enquiry Details
  branch: z.string().optional(),
  branchName: z.string().optional(),
  budget: z.string().optional(),
  financing: z.enum(['yes', 'no', 'maybe']).optional(),
  preferredContact: z
    .enum(['phone', 'email', 'whatsapp', 'sms'])
    .optional(),
  preferredTime: z
    .enum(['morning', 'afternoon', 'evening', 'anytime'])
    .optional(),
  preferredDelivery: z.string().optional(),
  source: z.string().optional(),
  salesType: z.string().optional(),

  // Trade-in Vehicle
  tradeInMake: z.string().optional(),
  tradeInModel: z.string().optional(),
  tradeInYear: z.string().optional(),
  tradeInKms: z.string().optional(),
  tradeInExpectedPrice: z.string().optional(),

  // Additional Information
  salesperson: z.string().optional(),
  slpCode: z.string().optional(),
  notes: z.string().optional(),

  // Status & Follow-up
  status: z.string().optional(),
  priority: z.string().optional(),
  followUpDate: z.string().optional(),
  followUpNotes: z.string().optional(),
});

const updateEnquirySchema = createEnquirySchema.partial();

const updateStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
});

// Routes
router.post(
  '/',
  validate(createEnquirySchema),
  asyncHandler(createEnquiry)
);

router.get('/', asyncHandler(getAllEnquiries));

router.get('/stats', asyncHandler(getEnquiryStats));

router.get('/:id', asyncHandler(getEnquiryById));

router.put(
  '/:id',
  validate(updateEnquirySchema),
  asyncHandler(updateEnquiry)
);

router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  asyncHandler(updateEnquiryStatus)
);

router.delete('/:id', asyncHandler(deleteEnquiry));

export default router;
