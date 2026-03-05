/**
 * Book Test Drive Controller
 * Handles HTTP requests for test drive booking operations
 */

import type { Request, Response } from 'express';
import * as BookTestDriveService from '../services/bookTestDrive.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { NotFoundError } from '../types/errors.js';
import { getAuditUserWithSlpCode } from '../utils/user-context.js';

/**
 * Create a new test drive booking
 * @route POST /api/book-test-drive
 */
export const createBookTestDrive = async (req: Request, res: Response) => {
  const createdBy = getAuditUserWithSlpCode(req);

  const booking = await BookTestDriveService.createBookTestDrive({
    ...req.body,
    createdBy,
  });

  sendSuccess(res, booking, 201);
};

/**
 * Get all test drive bookings
 * @route GET /api/book-test-drive
 * @note Authorization middleware will filter by slpCode for non-admin users
 */
export const getAllBookTestDrives = async (req: Request, res: Response) => {
  const filters = {
    slpCode: req.query.slpCode as string,
    status: req.query.status as string,
    includeDeleted: req.query.includeDeleted === 'true',
  };

  const bookings = await BookTestDriveService.getAllBookTestDrives(filters);
  sendSuccess(res, bookings);
};

/**
 * Get a single test drive booking by ID
 * @route GET /api/book-test-drive/:id
 * @note Resource already fetched and authorized by middleware
 */
export const getBookTestDriveById = async (req: Request, res: Response) => {
  // Resource already fetched and authorized by middleware
  const booking = req.resource;
  sendSuccess(res, booking);
};

/**
 * Update a test drive booking
 * @route PUT /api/book-test-drive/:id
 * @note Resource ownership already verified by middleware
 */
export const updateBookTestDrive = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updatedBy = getAuditUserWithSlpCode(req);

  const booking = await BookTestDriveService.updateBookTestDrive(
    id,
    req.body,
    updatedBy
  );

  if (!booking) {
    throw new NotFoundError('Book test drive not found');
  }

  sendSuccess(res, booking);
};

/**
 * Delete a test drive booking (soft delete)
 * @route DELETE /api/book-test-drive/:id
 * @note Resource ownership already verified by middleware
 */
export const deleteBookTestDrive = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deletedBy = getAuditUserWithSlpCode(req);

  const result = await BookTestDriveService.deleteBookTestDrive(id, deletedBy);
  sendSuccess(res, result);
};

/**
 * Get currently booked vehicles
 * @route GET /api/book-test-drive/currently-booked
 */
export const getCurrentlyBookedVehicles = async (
  _req: Request,
  res: Response
) => {
  const bookedVehicles =
    await BookTestDriveService.getCurrentlyBookedVehicles();
  sendSuccess(res, bookedVehicles);
};
