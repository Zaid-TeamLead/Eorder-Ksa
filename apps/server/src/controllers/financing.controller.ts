import type { Request, Response } from 'express';
import { financingService } from '../services/financing.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { NotFoundError } from '../types/errors.js';
import { logger } from '../utils/logger.js';
import { getAuditUser } from '../utils/user-context.js';

/**
 * Get all financing schemes for an enquiry
 */
export const getFinancingByEnquiryId = async (req: Request, res: Response) => {
  const enquiryId = Number(req.params.enquiryId);

  const schemes = await financingService.getByEnquiryId(enquiryId);

  return sendSuccess(res, schemes);
};

/**
 * Get financing scheme by ID
 */
export const getFinancingById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const scheme = await financingService.getById(id);

  if (!scheme) {
    throw new NotFoundError('Financing scheme not found');
  }

  return sendSuccess(res, scheme);
};

/**
 * Create a new financing scheme
 */
export const createFinancing = async (req: Request, res: Response) => {
  const userId = getAuditUser(req);

  const result = await financingService.create({
    ...req.body,
    createdBy: userId,
  });

  logger.info({ financingId: result.id }, 'Financing scheme created successfully');

  return sendSuccess(res, result, 201);
};

/**
 * Update an existing financing scheme
 */
export const updateFinancing = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userId = getAuditUser(req);

  // Check if financing scheme exists
  const existing = await financingService.getById(id);
  if (!existing) {
    throw new NotFoundError('Financing scheme not found');
  }

  const result = await financingService.update(id, {
    ...req.body,
    updatedBy: userId,
  });

  logger.info({ financingId: id }, 'Financing scheme updated successfully');

  return sendSuccess(res, result);
};

/**
 * Delete a financing scheme (soft delete)
 */
export const deleteFinancing = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userId = getAuditUser(req);

  // Check if financing scheme exists
  const existing = await financingService.getById(id);
  if (!existing) {
    throw new NotFoundError('Financing scheme not found');
  }

  const result = await financingService.delete(id, userId);

  logger.info({ financingId: id }, 'Financing scheme deleted successfully');

  return sendSuccess(res, result);
};

/**
 * Get all active lenders
 */
export const getLenders = async (_req: Request, res: Response) => {
  const qryType =
    typeof _req.query.qryType === 'string' && _req.query.qryType.trim()
      ? _req.query.qryType.trim()
      : undefined;
  const lenders = await financingService.getLenders(qryType);

  return sendSuccess(res, lenders);
};

export const getSalesEmployees = async (_req: Request, res: Response) => {
  const salesEmployees = await financingService.getSalesEmployees();

  return sendSuccess(res, salesEmployees);
};

export const getCurrencies = async (_req: Request, res: Response) => {
  const currencies = await financingService.getCurrencies();

  return sendSuccess(res, currencies);
};

/**
 * Set a financing scheme as preferred
 */
export const setPreferredScheme = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userId = getAuditUser(req);

  // Check if financing scheme exists
  const existing = await financingService.getById(id);
  if (!existing) {
    throw new NotFoundError('Financing scheme not found');
  }

  const result = await financingService.setPreferred(id, existing.ENQUIRY_SLNO, userId);

  logger.info({ financingId: id }, 'Financing scheme set as preferred');

  return sendSuccess(res, result);
};
