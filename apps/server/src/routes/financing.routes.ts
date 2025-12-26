import { Router } from 'express';
import * as financingController from '../controllers/financing.controller.js';

const router = Router();

/**
 * Financing Routes
 */

// Get all lenders
router.get('/lenders', financingController.getLenders);

// Get all financing schemes for an enquiry
router.get('/enquiry/:enquiryId', financingController.getFinancingByEnquiryId);

// Get financing scheme by ID
router.get('/:id', financingController.getFinancingById);

// Create new financing scheme
router.post('/', financingController.createFinancing);

// Update financing scheme
router.put('/:id', financingController.updateFinancing);

// Set preferred scheme
router.patch('/:id/preferred', financingController.setPreferredScheme);

// Delete financing scheme (soft delete)
router.delete('/:id', financingController.deleteFinancing);

export default router;
