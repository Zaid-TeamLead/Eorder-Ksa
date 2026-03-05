import type { Request, Response } from 'express';
import { tradeInAppraisalService } from '../services/tradeInAppraisal.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { NotFoundError } from '../types/errors.js';
import { logger } from '../utils/logger.js';
import { getAuditUser } from '../utils/user-context.js';

/**
 * Create a new trade-in appraisal
 */
export const createTradeInAppraisal = async (req: Request, res: Response) => {
  const userId = getAuditUser(req);

  const result = await tradeInAppraisalService.createTradeInAppraisal({
    ...req.body,
    createdBy: userId,
  });

  logger.info({ appraisalId: result.id }, 'Trade-in appraisal created');
  return sendSuccess(res, result, 201);
};

/**
 * Get trade-in appraisal by ID
 */
export const getTradeInAppraisalById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const appraisal = await tradeInAppraisalService.getTradeInAppraisalById(id);

  if (!appraisal) {
    throw new NotFoundError('Trade-in appraisal not found');
  }

  return sendSuccess(res, appraisal);
};

/**
 * Get trade-in appraisal by enquiry ID
 */
export const getTradeInAppraisalByEnquiryId = async (req: Request, res: Response) => {
  const enquiryId = Number(req.params.enquiryId);

  const appraisal = await tradeInAppraisalService.getTradeInAppraisalByEnquiryId(enquiryId);

  // It's okay if there's no appraisal for an enquiry (not all enquiries have trade-ins)
  return sendSuccess(res, appraisal || null);
};

/**
 * Update trade-in appraisal
 */
export const updateTradeInAppraisal = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userId = getAuditUser(req);

  // Check if appraisal exists
  const existing = await tradeInAppraisalService.getTradeInAppraisalById(id);
  if (!existing) {
    throw new NotFoundError('Trade-in appraisal not found');
  }

  const result = await tradeInAppraisalService.updateTradeInAppraisal(id, {
    ...req.body,
    updatedBy: userId,
  });

  logger.info({ appraisalId: id }, 'Trade-in appraisal updated');
  return sendSuccess(res, result);
};

/**
 * Request appraisal - assign to a user
 */
export const requestAppraisal = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userId = getAuditUser(req);

  // Check if appraisal exists
  const existing = await tradeInAppraisalService.getTradeInAppraisalById(id);
  if (!existing) {
    throw new NotFoundError('Trade-in appraisal not found');
  }

  const result = await tradeInAppraisalService.requestAppraisal(id, {
    assignedTo: req.body.assignedTo,
    requestNotes: req.body.requestNotes,
    requestedBy: userId,
  });

  logger.info({ appraisalId: id, assignedTo: req.body.assignedTo }, 'Appraisal request sent');
  return sendSuccess(res, result);
};

/**
 * Update appraisal status
 */
export const updateAppraisalStatus = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userId = getAuditUser(req);

  // Check if appraisal exists
  const existing = await tradeInAppraisalService.getTradeInAppraisalById(id);
  if (!existing) {
    throw new NotFoundError('Trade-in appraisal not found');
  }

  const result = await tradeInAppraisalService.updateAppraisalStatus(
    id,
    req.body.status,
    req.body.appraisalNotes,
    userId
  );

  logger.info({ appraisalId: id, status: req.body.status }, 'Appraisal status updated');
  return sendSuccess(res, result);
};

/**
 * Delete trade-in appraisal (soft delete)
 */
export const deleteTradeInAppraisal = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userId = getAuditUser(req);

  // Check if appraisal exists
  const existing = await tradeInAppraisalService.getTradeInAppraisalById(id);
  if (!existing) {
    throw new NotFoundError('Trade-in appraisal not found');
  }

  const result = await tradeInAppraisalService.deleteTradeInAppraisal(id, userId);

  logger.info({ appraisalId: id }, 'Trade-in appraisal deleted');
  return sendSuccess(res, result);
};
