import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import * as financingController from '../controllers/financing.controller.js';
import { validate } from '../middleware/validator.js';
import {
  createFinancingSchema,
  updateFinancingSchema,
  idParamSchema,
} from '../schemas/financing.schema.js';

const router: ExpressRouter = Router();

/**
 * Financing Routes
 */

// Get all lenders
router.get('/lenders', financingController.getLenders);

// Get all sales employees
router.get('/sales-employees', financingController.getSalesEmployees);

// Get all currencies
router.get('/currencies', financingController.getCurrencies);

// Get all financing schemes for an enquiry
router.get(
  '/enquiry/:enquiryId',
  validate(z.object({ enquiryId: z.string().regex(/^\d+$/) }), 'params'),
  financingController.getFinancingByEnquiryId
);

// Get financing scheme by ID
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  financingController.getFinancingById
);

// Create new financing scheme
router.post(
  '/',
  validate(createFinancingSchema),
  financingController.createFinancing
);

// Update financing scheme
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateFinancingSchema),
  financingController.updateFinancing
);

// Set preferred scheme
router.patch(
  '/:id/preferred',
  validate(idParamSchema, 'params'),
  financingController.setPreferredScheme
);

// Delete financing scheme (soft delete)
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  financingController.deleteFinancing
);

export default router;
