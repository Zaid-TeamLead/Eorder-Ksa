import { Router, type Router as RouterType } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '@/middleware/validator.js';
import { z } from 'zod';
import {
  getCustomerAddress,
  getCustomerfinancialInformation,
  getVehicleHistory,
  searchCustomers,
} from '@/services/customer.service.js';

const router: RouterType = Router();

router.post(
  '/search',
  validate(
    z.object({
      search: z.string().min(1, 'Search is required'),
      slpCode: z.string().min(1, 'SLP Code is required'),
    }),
    'body'
  ),
  asyncHandler(async (req, res) => {
    const { search, slpCode } = req.body;
    const customers = await searchCustomers(search, slpCode);
    return sendSuccess(res, customers);
  })
);

router.get(
  '/address/:cardCode',
  validate(
    z.object({
      cardCode: z.string().min(1, 'Card Code is required'),
    }),
    'params'
  ),
  asyncHandler(async (req, res) => {
    const cardCode = req.params.cardCode as string;
    const address = await getCustomerAddress(cardCode);
    return sendSuccess(res, address);
  })
);

router.get(
  '/financial-information/:cardCode',
  validate(
    z.object({
      cardCode: z.string().min(1, 'Card Code is required'),
    }),
    'params'
  ),
  asyncHandler(async (req, res) => {
    const cardCode = req.params.cardCode as string;
    const financialInformation = await getCustomerfinancialInformation(
      cardCode
    );
    return sendSuccess(res, financialInformation);
  })
);

router.get(
  '/vehicle-history/:cardCode',
  validate(
    z.object({
      cardCode: z.string().min(1, 'Card Code is required'),
    }),
    'params'
  ),
  asyncHandler(async (req, res) => {
    const cardCode = req.params.cardCode as string;

    const vehicleHistory = await getVehicleHistory(cardCode);
    return sendSuccess(res, vehicleHistory);
  })
);

export default router;
