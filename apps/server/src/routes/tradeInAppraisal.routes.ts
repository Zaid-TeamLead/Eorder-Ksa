/**
 * Trade-in Appraisal Routes
 * Handles routing for trade-in appraisal operations
 */

import { Router, type Router as ExpressRouter } from 'express';
import {
  createTradeInAppraisal,
  getTradeInAppraisalById,
  getTradeInAppraisalByEnquiryId,
  updateTradeInAppraisal,
  requestAppraisal,
  updateAppraisalStatus,
  deleteTradeInAppraisal,
} from '../controllers/tradeInAppraisal.controller.js';
import { validate } from '../middleware/validator.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createTradeInAppraisalSchema,
  updateTradeInAppraisalSchema,
  requestAppraisalSchema,
  updateAppraisalStatusSchema,
  getTradeInAppraisalByIdSchema,
  getTradeInAppraisalByEnquiryIdSchema,
} from '../schemas/tradeInAppraisal.schema.js';

const router: ExpressRouter = Router();

/**
 * POST /api/trade-in-appraisal
 * Create new trade-in appraisal
 */
router.post(
  '/',
  validate(createTradeInAppraisalSchema, 'body'),
  asyncHandler(createTradeInAppraisal)
);

/**
 * GET /api/trade-in-appraisal/:id
 * Get trade-in appraisal by ID
 */
router.get(
  '/:id',
  validate(getTradeInAppraisalByIdSchema, 'params'),
  asyncHandler(getTradeInAppraisalById)
);

/**
 * GET /api/trade-in-appraisal/enquiry/:enquiryId
 * Get trade-in appraisal by enquiry ID
 */
router.get(
  '/enquiry/:enquiryId',
  validate(getTradeInAppraisalByEnquiryIdSchema, 'params'),
  asyncHandler(getTradeInAppraisalByEnquiryId)
);

/**
 * PUT /api/trade-in-appraisal/:id
 * Update trade-in appraisal
 */
router.put(
  '/:id',
  validate(getTradeInAppraisalByIdSchema, 'params'),
  validate(updateTradeInAppraisalSchema, 'body'),
  asyncHandler(updateTradeInAppraisal)
);

/**
 * POST /api/trade-in-appraisal/:id/request
 * Request appraisal - assign to a user
 */
router.post(
  '/:id/request',
  validate(getTradeInAppraisalByIdSchema, 'params'),
  validate(requestAppraisalSchema, 'body'),
  asyncHandler(requestAppraisal)
);

/**
 * PATCH /api/trade-in-appraisal/:id/status
 * Update appraisal status
 */
router.patch(
  '/:id/status',
  validate(getTradeInAppraisalByIdSchema, 'params'),
  validate(updateAppraisalStatusSchema, 'body'),
  asyncHandler(updateAppraisalStatus)
);

/**
 * DELETE /api/trade-in-appraisal/:id
 * Delete trade-in appraisal (soft delete)
 */
router.delete(
  '/:id',
  validate(getTradeInAppraisalByIdSchema, 'params'),
  asyncHandler(deleteTradeInAppraisal)
);

export default router;
