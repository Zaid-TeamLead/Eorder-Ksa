import { Router, type Router as RouterType } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '@/middleware/validator.js';
import { z } from 'zod';
import { getVinNumber, searchVehicles } from '@/services/vehicles.service.js';

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

export default router;
