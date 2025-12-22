import type { Request, Response } from 'express';
import EnquiryService from '../services/enquiry.service.js';
import { sendSuccess } from '../utils/api-response.js';

export const createEnquiry = async (req: Request, res: Response) => {
  const enquiryData = {
    ...req.body,
    createdBy: req.user?.name || 'System',
    slpCode: req.body.slpCode || req.user?.slpCode,
    salesperson: req.body.salesperson || req.user?.name,
  };

  const result = await EnquiryService.createEnquiry(enquiryData);
  sendSuccess(res, result, 201);
};

export const getAllEnquiries = async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as string,
    slpCode: req.query.slpCode as string,
    customerId: req.query.customerId as string,
    fromDate: req.query.fromDate as string,
    toDate: req.query.toDate as string,
  };

  // If no slpCode filter provided and user is not admin, filter by user's slpCode
  if (!filters.slpCode && req.user?.slpCode) {
    filters.slpCode = req.user.slpCode;
  }

  const enquiries = await EnquiryService.getAllEnquiries(filters);
  sendSuccess(res, enquiries);
};

export const getEnquiryById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const enquiry = await EnquiryService.getEnquiryById(id);
  sendSuccess(res, enquiry);
};

export const updateEnquiry = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updatedBy = req.user?.name || 'System';

  const result = await EnquiryService.updateEnquiry(id, req.body, updatedBy);
  sendSuccess(res, result);
};

export const updateEnquiryStatus = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;
  const updatedBy = req.user?.name || 'System';

  const result = await EnquiryService.updateEnquiryStatus(
    id,
    status,
    updatedBy,
    notes
  );
  sendSuccess(res, result);
};

export const deleteEnquiry = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const deletedBy = req.user?.name || 'System';

  const result = await EnquiryService.deleteEnquiry(id, deletedBy);
  sendSuccess(res, result);
};

export const getEnquiryStats = async (req: Request, res: Response) => {
  const slpCode = (req.query.slpCode as string) || req.user?.slpCode;

  const stats = await EnquiryService.getEnquiryStats(slpCode);
  sendSuccess(res, stats);
};
