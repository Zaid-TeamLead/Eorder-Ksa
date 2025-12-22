import { Router } from 'express';
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
import {
  createEnquirySchema,
  updateEnquirySchema,
  updateStatusSchema,
} from '../schemas/enquiry.schema.js';

const router = Router();

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
