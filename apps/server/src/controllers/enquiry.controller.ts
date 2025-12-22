import type { Request, Response } from 'express';
import EnquiryService, { type CreateEnquiryData, type UpdateEnquiryData } from '../services/enquiry.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { AuthorizationError, NotFoundError } from '../types/errors.js';

export const createEnquiry = async (req: Request, res: Response) => {
  const enquiryData: CreateEnquiryData = {
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

  // Authorization: Users can only view their own enquiries unless they have admin role
  // If user tries to filter by different slpCode, verify they have permission
  if (filters.slpCode && req.user?.slpCode) {
    if (filters.slpCode !== req.user.slpCode && req.user.role !== 'admin') {
      throw new AuthorizationError('You can only view your own enquiries');
    }
  }

  // Enforce slpCode filter for non-admin users
  if (!filters.slpCode && req.user?.slpCode && req.user.role !== 'admin') {
    filters.slpCode = req.user.slpCode;
  }

  const enquiries = await EnquiryService.getAllEnquiries(filters);
  sendSuccess(res, enquiries);
};

export const getEnquiryById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const enquiry = await EnquiryService.getEnquiryById(id);

  if (!enquiry) {
    throw new NotFoundError('Enquiry not found');
  }

  // Authorization: Users can only view their own enquiries unless they're admin
  if (req.user?.role !== 'admin' && enquiry.SLPCODE !== req.user?.slpCode) {
    throw new AuthorizationError('You can only view your own enquiries');
  }

  sendSuccess(res, enquiry);
};

export const updateEnquiry = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updatedBy = req.user?.name || 'System';
  const updateData: UpdateEnquiryData = req.body;

  // Authorization: Verify the enquiry belongs to the user before updating
  const existingEnquiry = await EnquiryService.getEnquiryById(id);
  if (!existingEnquiry) {
    throw new NotFoundError('Enquiry not found');
  }

  // Check ownership unless user is admin
  if (req.user?.role !== 'admin' && existingEnquiry.SLPCODE !== req.user?.slpCode) {
    throw new AuthorizationError('You can only update your own enquiries');
  }

  const result = await EnquiryService.updateEnquiry(id, updateData, updatedBy);
  sendSuccess(res, result);
};

export const updateEnquiryStatus = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;
  const updatedBy = req.user?.name || 'System';

  // Authorization: Verify the enquiry belongs to the user before updating status
  const existingEnquiry = await EnquiryService.getEnquiryById(id);
  if (!existingEnquiry) {
    throw new NotFoundError('Enquiry not found');
  }

  // Check ownership unless user is admin
  if (req.user?.role !== 'admin' && existingEnquiry.SLPCODE !== req.user?.slpCode) {
    throw new AuthorizationError('You can only update your own enquiries');
  }

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

  // Authorization: Verify the enquiry belongs to the user before deleting
  const existingEnquiry = await EnquiryService.getEnquiryById(id);
  if (!existingEnquiry) {
    throw new NotFoundError('Enquiry not found');
  }

  // Check ownership unless user is admin
  if (req.user?.role !== 'admin' && existingEnquiry.SLPCODE !== req.user?.slpCode) {
    throw new AuthorizationError('You can only delete your own enquiries');
  }

  const result = await EnquiryService.deleteEnquiry(id, deletedBy);
  sendSuccess(res, result);
};

export const getEnquiryStats = async (req: Request, res: Response) => {
  const slpCode = (req.query.slpCode as string) || req.user?.slpCode;

  const stats = await EnquiryService.getEnquiryStats(slpCode);
  sendSuccess(res, stats);
};
