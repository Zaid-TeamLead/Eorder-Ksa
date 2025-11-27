import { Router, type Router as RouterType } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '@/middleware/validator.js';
import { z } from 'zod';
import {
  getAllTestVehicles,
  getTestVehicleById,
  createTestVehicle,
  updateTestVehicle,
  deleteTestVehicle,
  updateTestVehicleStatus,
  getVinNumber,
  searchVehicles,
  getAllVehicleInventory,
} from '@/services/vehicles.service.js';

const router: RouterType = Router();

router.get(
  '/search',
  validate(
    z.object({
      search: z.string().optional(),
    }),
    'query'
  ),
  asyncHandler(async (req, res) => {
    const search = req.query.search as string | undefined;
    const vehicles = await searchVehicles(search);
    return sendSuccess(res, vehicles);
  })
);

router.post(
  '/get-vin-number',
  validate(
    z.object({
      ProductCode: z.string().min(1, 'ProductCode is required'),
      customerId: z.string().min(1, 'customerId is required'),
    }),
    'body'
  ),
  asyncHandler(async (req, res) => {
    const ProductCode = req.body.ProductCode as string;
    const customerId = req.body.customerId as string;
    const vinNumber = await getVinNumber(ProductCode, customerId);
    return sendSuccess(res, vinNumber);
  })
);

router.get(
  '/get-all-test-vehicles',
  asyncHandler(async (_req, res) => {
    const vehicles = await getAllTestVehicles();
    return sendSuccess(res, vehicles);
  })
);

router.get(
  '/get-all-vehicle-inventory',
  asyncHandler(async (_req, res) => {
    const vehicles = await getAllVehicleInventory();
    return sendSuccess(res, vehicles);
  })
);

router.get(
  '/test-vehicles',
  asyncHandler(async (_req, res) => {
    const vehicles = await getAllTestVehicles();
    return sendSuccess(res, vehicles);
  })
);

router.get(
  '/test-vehicles/:id',
  validate(
    z.object({
      id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
    'params'
  ),
  asyncHandler(async (req, res) => {
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
    const vehicle = await getTestVehicleById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Test vehicle not found',
      });
    }
    return sendSuccess(res, vehicle);
  })
);

router.post(
  '/test-vehicles',
  validate(
    z.object({
      REGISTRATIONNUM: z.string().optional(),
      MANUFACTURER: z.string().optional(),
      MODEL: z.string().optional(),
      VARIANT: z.string().optional(),
      DESCRIPTION: z.string().optional(),
      BODYSTYLE: z.string().optional(),
      VEHICLESTATUS: z.enum(['true', 'false']).optional(),
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
    const vehicle = await createTestVehicle({
      ...req.body,
      CREATEDBY: createdBy,
    });
    return sendSuccess(res, vehicle, 201);
  })
);

router.put(
  '/test-vehicles/:id',
  validate(
    z.object({
      id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
    'params'
  ),
  validate(
    z.object({
      REGISTRATIONNUM: z.string().optional(),
      MANUFACTURER: z.string().optional(),
      MODEL: z.string().optional(),
      VARIANT: z.string().optional(),
      DESCRIPTION: z.string().optional(),
      BODYSTYLE: z.string().optional(),
      VEHICLESTATUS: z.enum(['true', 'false']).optional(),
    }),
    'body'
  ),
  asyncHandler(async (req, res) => {
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
    const vehicle = await updateTestVehicle(id, req.body);
    return sendSuccess(res, vehicle, 200);
  })
);

router.delete(
  '/test-vehicles/:id',
  validate(
    z.object({
      id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
    'params'
  ),
  asyncHandler(async (req, res) => {
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
    const vehicle = await deleteTestVehicle(id);
    return sendSuccess(res, vehicle, 200);
  })
);

router.patch(
  '/test-vehicles/:id/status',
  validate(
    z.object({
      id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
    'params'
  ),
  validate(
    z.object({
      status: z
        .enum(['true', 'false'])
        .refine((val) => val === 'true' || val === 'false', {
          message: 'Status must be "true" or "false"',
        }),
    }),
    'body'
  ),
  asyncHandler(async (req, res) => {
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
    const status = req.body.status;
    if (!status || (status !== 'true' && status !== 'false')) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "true" or "false"',
      });
    }
    const vehicle = await updateTestVehicleStatus(id, status);
    return sendSuccess(res, vehicle, 200);
  })
);

export default router;
