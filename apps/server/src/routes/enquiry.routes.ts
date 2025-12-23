/**
 * Enquiry Routes
 * Handles routing for sales enquiry operations
 */

import { Router, type Router as ExpressRouter } from 'express';
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
  checkResourceOwnership,
  enforceOwnershipFilter,
} from '../middleware/resource-ownership.js';
import EnquiryService from '../services/enquiry.service.js';
import {
  createEnquirySchema,
  updateEnquirySchema,
  updateStatusSchema,
  idParamSchema,
} from '../schemas/enquiry.schema.js';

const router: ExpressRouter = Router();

/**
 * POST /api/enquiry
 * Create new enquiry
 */
router.post(
  '/',
  validate(createEnquirySchema),
  asyncHandler(createEnquiry)
);

/**
 * GET /api/enquiry
 * Get all enquiries (filtered by ownership for non-admin users)
 */
router.get(
  '/',
  enforceOwnershipFilter((req) => req.user?.SlpCode, 'slpCode'),
  asyncHandler(getAllEnquiries)
);

/**
 * GET /api/enquiry/stats
 * Get enquiry statistics
 */
router.get('/stats', asyncHandler(getEnquiryStats));

/**
 * GET /api/enquiry/:id
 * Get single enquiry by ID (with ownership check)
 */
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: EnquiryService.getEnquiryById,
      getOwnerId: (enquiry) => enquiry.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Enquiry',
      allowUnassigned: true,
    })
  ),
  asyncHandler(getEnquiryById)
);

/**
 * PUT /api/enquiry/:id
 * Update enquiry (with ownership check)
 */
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateEnquirySchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: EnquiryService.getEnquiryById,
      getOwnerId: (enquiry) => enquiry.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Enquiry',
      allowUnassigned: true,
    })
  ),
  asyncHandler(updateEnquiry)
);

/**
 * PATCH /api/enquiry/:id/status
 * Update enquiry status (with ownership check)
 */
router.patch(
  '/:id/status',
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: EnquiryService.getEnquiryById,
      getOwnerId: (enquiry) => enquiry.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Enquiry',
      allowUnassigned: true,
    })
  ),
  asyncHandler(updateEnquiryStatus)
);

/**
 * DELETE /api/enquiry/:id
 * Delete enquiry (soft delete - with ownership check)
 */
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: EnquiryService.getEnquiryById,
      getOwnerId: (enquiry) => enquiry.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Enquiry',
      allowUnassigned: true,
    })
  ),
  asyncHandler(deleteEnquiry)
);

export default router;
