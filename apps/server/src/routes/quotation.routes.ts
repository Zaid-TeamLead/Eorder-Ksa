/**
 * Quotation Routes
 * Handles routing for quotation operations including discount approvals
 */

import { Router, type Router as ExpressRouter } from 'express';
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  getQuotationsByEnquiryId,
  updateQuotation,
  supersedeQuotation,
  deleteQuotation,
  requestDiscountApproval,
  approveDiscount,
  getAllDiscountApprovals,
  getPendingDiscountApprovals,
  passToCashier,
  getOpenDeposits,
  allocateDeposit,
  cancelQuotation,
  logActivity,
  getQuotationActivities,
} from '../controllers/quotation.controller.js';
import { validate } from '../middleware/validator.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  checkResourceOwnership,
  enforceOwnershipFilter,
} from '../middleware/resource-ownership.js';
import { quotationService } from '../services/quotation.service.js';
import {
  createQuotationSchema,
  updateQuotationSchema,
  supersedeQuotationSchema,
  requestDiscountApprovalSchema,
  approveDiscountSchema,
  passToCashierSchema,
  allocateDepositSchema,
  cancelQuotationSchema,
  createActivitySchema,
  getQuotationByIdSchema,
  getQuotationsByEnquirySchema,
  getApprovalByIdSchema,
} from '../schemas/quotation.schema.js';

const router: ExpressRouter = Router();

// ============================================================================
// Quotation CRUD Routes
// ============================================================================

/**
 * POST /api/quotations
 * Create new quotation from enquiry
 */
router.post(
  '/',
  validate(createQuotationSchema),
  asyncHandler(createQuotation)
);

/**
 * GET /api/quotations
 * Get all quotations (filtered by ownership for non-admin users)
 */
router.get(
  '/',
  enforceOwnershipFilter((req) => req.user?.SlpCode, 'slpCode'),
  asyncHandler(getAllQuotations)
);

/**
 * POST /api/quotations/supersede
 * Create new version of a quotation (supersede)
 * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
 */
router.post(
  '/supersede',
  validate(supersedeQuotationSchema),
  asyncHandler(supersedeQuotation)
);

/**
 * GET /api/quotations/enquiry/:enquiryId
 * Get all quotations for a specific enquiry
 */
router.get(
  '/enquiry/:enquiryId',
  validate(getQuotationsByEnquirySchema, 'params'),
  asyncHandler(getQuotationsByEnquiryId)
);

// ============================================================================
// Discount Approval Routes
// IMPORTANT: These routes must come BEFORE /:id to avoid route conflicts
// ============================================================================

/**
 * GET /api/quotations/discount-approvals
 * Get all discount approval requests (filtered by role)
 */
router.get(
  '/discount-approvals',
  asyncHandler(getAllDiscountApprovals)
);

/**
 * GET /api/quotations/discount-approvals/pending
 * Get pending discount approvals assigned to the current user
 */
router.get(
  '/discount-approvals/pending',
  asyncHandler(getPendingDiscountApprovals)
);

/**
 * GET /api/quotations/open-deposits
 * Get quotations passed to cashier with unallocated deposits
 */
router.get(
  '/open-deposits',
  asyncHandler(getOpenDeposits)
);

/**
 * GET /api/quotations/:id
 * Get single quotation by ID (no ownership check - allows viewing for supersede)
 * Note: Users can view any quotation but can only UPDATE their own (see PUT route below)
 */
router.get(
  '/:id',
  validate(getQuotationByIdSchema, 'params'),
  asyncHandler(getQuotationById)
);

/**
 * PUT /api/quotations/:id
 * Update quotation (with ownership check)
 */
router.put(
  '/:id',
  validate(getQuotationByIdSchema, 'params'),
  validate(updateQuotationSchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => quotationService.getQuotationById(Number(id)),
      getOwnerId: (quotation) => quotation.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Quotation',
      allowUnassigned: false,
    })
  ),
  asyncHandler(updateQuotation)
);

/**
 * DELETE /api/quotations/:id
 * Delete quotation (soft delete - with ownership check)
 */
router.delete(
  '/:id',
  validate(getQuotationByIdSchema, 'params'),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => quotationService.getQuotationById(Number(id)),
      getOwnerId: (quotation) => quotation.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Quotation',
      allowUnassigned: false,
    })
  ),
  asyncHandler(deleteQuotation)
);

// ============================================================================
// Discount Approval Action Routes
// ============================================================================

/**
 * POST /api/quotations/:id/request-approval
 * Request discount approval from manager
 */
router.post(
  '/:id/request-approval',
  validate(getQuotationByIdSchema, 'params'),
  validate(requestDiscountApprovalSchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => quotationService.getQuotationById(Number(id)),
      getOwnerId: (quotation) => quotation.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Quotation',
      allowUnassigned: false,
    })
  ),
  asyncHandler(requestDiscountApproval)
);

/**
 * POST /api/quotations/approvals/:approvalId
 * Approve or reject a discount request (manager only)
 */
router.post(
  '/approvals/:approvalId',
  validate(getApprovalByIdSchema, 'params'),
  validate(approveDiscountSchema),
  asyncHandler(approveDiscount)
);

// ============================================================================
// Quotation Actions
// ============================================================================

/**
 * POST /api/quotations/:id/pass-to-cashier
 * Pass quotation to cashier for deposit collection
 */
router.post(
  '/:id/pass-to-cashier',
  validate(getQuotationByIdSchema, 'params'),
  validate(passToCashierSchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => quotationService.getQuotationById(Number(id)),
      getOwnerId: (quotation) => quotation.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Quotation',
      allowUnassigned: false,
    })
  ),
  asyncHandler(passToCashier)
);

/**
 * POST /api/quotations/:id/allocate-deposit
 * Allocate (collect) a deposit against a passed enquiry/quotation
 */
router.post(
  '/:id/allocate-deposit',
  validate(getQuotationByIdSchema, 'params'),
  validate(allocateDepositSchema),
  asyncHandler(allocateDeposit)
);

/**
 * POST /api/quotations/:id/cancel
 * Cancel a quotation
 */
router.post(
  '/:id/cancel',
  validate(getQuotationByIdSchema, 'params'),
  validate(cancelQuotationSchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => quotationService.getQuotationById(Number(id)),
      getOwnerId: (quotation) => quotation.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Quotation',
      allowUnassigned: false,
    })
  ),
  asyncHandler(cancelQuotation)
);

// ============================================================================
// Activity Logging Routes
// ============================================================================

/**
 * POST /api/quotations/:id/activity
 * Log activity for a quotation
 */
router.post(
  '/:id/activity',
  validate(getQuotationByIdSchema, 'params'),
  validate(createActivitySchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => quotationService.getQuotationById(Number(id)),
      getOwnerId: (quotation) => quotation.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Quotation',
      allowUnassigned: false,
    })
  ),
  asyncHandler(logActivity)
);

/**
 * GET /api/quotations/:id/activities
 * Get all activities for a quotation
 */
router.get(
  '/:id/activities',
  validate(getQuotationByIdSchema, 'params'),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => quotationService.getQuotationById(Number(id)),
      getOwnerId: (quotation) => quotation.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Quotation',
      allowUnassigned: false,
    })
  ),
  asyncHandler(getQuotationActivities)
);

export default router;
