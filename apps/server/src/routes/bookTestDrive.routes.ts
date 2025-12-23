/**
 * Book Test Drive Routes
 * Handles routing for test drive booking operations
 */

import { Router, type Router as ExpressRouter } from 'express';
import {
  createBookTestDrive,
  getAllBookTestDrives,
  getBookTestDriveById,
  updateBookTestDrive,
  deleteBookTestDrive,
  getCurrentlyBookedVehicles,
} from '../controllers/bookTestDrive.controller.js';
import { validate } from '../middleware/validator.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  checkResourceOwnership,
  enforceOwnershipFilter,
} from '../middleware/resource-ownership.js';
import * as BookTestDriveService from '../services/bookTestDrive.service.js';
import {
  createBookTestDriveSchema,
  updateBookTestDriveSchema,
  idParamSchema,
} from '../schemas/bookTestDrive.schema.js';

const router: ExpressRouter = Router();

/**
 * GET /api/book-test-drive
 * Get all test drive bookings (filtered by ownership for non-admin users)
 */
router.get(
  '/',
  enforceOwnershipFilter((req) => req.user?.SlpCode, 'slpCode'),
  asyncHandler(getAllBookTestDrives)
);

/**
 * GET /api/book-test-drive/currently-booked
 * Get currently booked vehicles (utility endpoint - no auth needed)
 */
router.get('/currently-booked', asyncHandler(getCurrentlyBookedVehicles));

/**
 * GET /api/book-test-drive/:id
 * Get single test drive booking by ID (with ownership check)
 */
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: BookTestDriveService.getBookTestDriveById,
      getOwnerId: (booking) => booking.SALESEXECUTIVE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Book test drive',
      allowUnassigned: true,
    })
  ),
  asyncHandler(getBookTestDriveById)
);

/**
 * POST /api/book-test-drive
 * Create new test drive booking
 */
router.post(
  '/',
  validate(createBookTestDriveSchema, 'body'),
  asyncHandler(createBookTestDrive)
);

/**
 * PUT /api/book-test-drive/:id
 * Update test drive booking (with ownership check)
 */
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateBookTestDriveSchema, 'body'),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: BookTestDriveService.getBookTestDriveById,
      getOwnerId: (booking) => booking.SALESEXECUTIVE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Book test drive',
      allowUnassigned: true,
    })
  ),
  asyncHandler(updateBookTestDrive)
);

/**
 * DELETE /api/book-test-drive/:id
 * Delete test drive booking (soft delete - with ownership check)
 */
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: BookTestDriveService.getBookTestDriveById,
      getOwnerId: (booking) => booking.SALESEXECUTIVE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Book test drive',
      allowUnassigned: true,
    })
  ),
  asyncHandler(deleteBookTestDrive)
);

export default router;
