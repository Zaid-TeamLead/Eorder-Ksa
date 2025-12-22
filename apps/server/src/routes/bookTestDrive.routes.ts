import { Router, type Router as RouterType } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '@/middleware/validator.js';
import {
  createBookTestDriveSchema,
  updateBookTestDriveSchema,
  idParamSchema,
} from '@/schemas/bookTestDrive.schema.js';
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
  validate(createBookTestDriveSchema, 'body'),
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
  validate(idParamSchema, 'params'),
  validate(updateBookTestDriveSchema, 'body'),
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
