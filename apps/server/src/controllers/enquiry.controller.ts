import type { Request, Response } from 'express';
import EnquiryService, { type CreateEnquiryData, type UpdateEnquiryData } from '../services/enquiry.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { getAuditUserWithSlpCode } from '../utils/user-context.js';

export const createEnquiry = async (req: Request, res: Response) => {
  const enquiryData: CreateEnquiryData = {
    ...req.body,
    createdBy: getAuditUserWithSlpCode(req),
    slpCode: req.body.slpCode || req.user?.SlpCode,
    salesperson: req.body.salesperson || req.user?.name,
  };

  const result = await EnquiryService.createEnquiry(enquiryData);
  sendSuccess(res, result, 201);
};

export const getAllEnquiries = async (req: Request, res: Response) => {
  // Authorization middleware has already filtered by slpCode for non-admin users
  const filters = {
    status: req.query.status as string,
    slpCode: req.query.slpCode as string,
    customerId: req.query.customerId as string,
    fromDate: req.query.fromDate as string,
    toDate: req.query.toDate as string,
  };

  const enquiries = await EnquiryService.getAllEnquiries(filters);
  sendSuccess(res, enquiries);
};

export const getEnquiryById = async (req: Request, res: Response) => {
  // Resource already fetched and authorized by middleware
  const enquiry = req.resource;
  sendSuccess(res, enquiry);
};

export const updateEnquiry = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updatedBy = getAuditUserWithSlpCode(req);
  const updateData: UpdateEnquiryData = req.body;

  // Admin-only: Allow slpCode/salesperson changes
  // Non-admin users cannot change ownership fields
  if (req.user?.role !== 'admin') {
    delete updateData.slpCode;
    delete updateData.salesperson;
  }

  const result = await EnquiryService.updateEnquiry(id, updateData, updatedBy);
  sendSuccess(res, result);
};

export const updateEnquiryStatus = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status, notes } = req.body;
  const updatedBy = getAuditUserWithSlpCode(req);

  // Resource ownership already verified by middleware
  const result = await EnquiryService.updateEnquiryStatus(
    id ,
    status,
    updatedBy,
    notes
  );
  sendSuccess(res, result);
};

export const deleteEnquiry = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deletedBy = getAuditUserWithSlpCode(req);

  // Resource ownership already verified by middleware
  const result = await EnquiryService.deleteEnquiry(id, deletedBy);
  sendSuccess(res, result);
};

export const getEnquiryStats = async (req: Request, res: Response) => {
  const slpCode = (req.query.slpCode as string) || req.user?.SlpCode;

  const stats = await EnquiryService.getEnquiryStats(slpCode);
  sendSuccess(res, stats);
};

export const getSalespersonDashboard = async (_req: Request, res: Response) => {
  const slpCode = '14';

  if (!slpCode) {
    return res.status(400).json({
      success: false,
      message: 'SLPCODE is required',
    });
  }

  const dashboardData = await EnquiryService.getSalespersonDashboard(slpCode);
  sendSuccess(res, dashboardData);
};
