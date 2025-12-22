import { Router, type Router as RouterType } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '@/middleware/validator.js';
import { z } from 'zod';
import {
  createBookTestDrive,
  getAllBookTestDrives,
  updateBookTestDrive,
  getCurrentlyBookedVehicles,
} from '@/services/bookTestDrive.service.js';

const router: RouterType = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const bookings = await getAllBookTestDrives();
    return sendSuccess(res, bookings);
  })
);

router.get(
  '/currently-booked',
  asyncHandler(async (_req, res) => {
    const bookedVehicles = await getCurrentlyBookedVehicles();
    return sendSuccess(res, bookedVehicles);
  })
);

router.post(
  '/',
  validate(
    z.object({
      // Customer Information
      customerId: z.string().optional(),
      customerName: z.string().min(1, 'Customer name is required'),
      companyName: z.string().optional(),
      postcode: z.string().optional(),
      address: z.string().min(1, 'Address is required'),
      phoneNumber: z.string().optional(),
      email: z
        .string()
        .email('Invalid email address')
        .optional()
        .or(z.literal('')),

      // Vehicle Booking Details
      registrationNumber: z.string().optional(),
      manufacturer: z.string().optional(),
      manufacturerName: z.string().optional(),
      model: z.string().optional(),
      modelName: z.string().optional(),
      variant: z.string().optional(),
      variantName: z.string().optional(),
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
      fuelOut: z.string().optional(),
      fuelIn: z.string().optional(),
      mileageOut: z.string().optional(),
      mileageIn: z.string().optional(),
    }),
    'body'
  ),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const createdBy = (
      req.user.SlpCode ||
      req.user.name ||
      'SYSTEM'
    ).toString();

    const booking = await createBookTestDrive({
      ...req.body,
      createdBy,
    });

    return sendSuccess(res, booking, 201);
  })
);

router.put(
  '/:id',
  validate(
    z.object({
      id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
    'params'
  ),
  validate(
    z.object({
      // Customer Information
      customerId: z.string().optional(),
      customerName: z.string().min(1, 'Customer name is required').optional(),
      companyName: z.string().optional(),
      postcode: z.string().optional(),
      address: z.string().min(1, 'Address is required').optional(),
      phoneNumber: z.string().optional(),
      email: z
        .string()
        .email('Invalid email address')
        .optional()
        .or(z.literal('')),

      // Vehicle Booking Details
      registrationNumber: z.string().optional(),
      manufacturer: z.string().optional(),
      manufacturerName: z.string().optional(),
      model: z.string().optional(),
      modelName: z.string().optional(),
      variant: z.string().optional(),
      variantName: z.string().optional(),
      description: z.string().optional(),
      bodyStyle: z.string().optional(),

      // Booking Details
      dateOut: z.string().min(1, 'Date out is required').optional(),
      timeOut: z.string().optional(),
      dateIn: z.string().min(1, 'Date in is required').optional(),
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
      fuelOut: z.string().optional(),
      fuelIn: z.string().optional(),
      mileageOut: z.string().optional(),
      mileageIn: z.string().optional(),
    }),
    'body'
  ),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const idParam = req.params.id as string;
    if (!idParam) {
      return res.status(400).json({
        success: false,
        message: 'ID parameter is required',
      });
    }
    const id: number = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID parameter',
      });
    }

    const updatedBy = (
      req.user.SlpCode ||
      req.user.name ||
      'SYSTEM'
    ).toString();

    const booking = await updateBookTestDrive(id, req.body, updatedBy);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Book test drive not found',
      });
    }

    return sendSuccess(res, booking, 200);
  })
);

export default router;
