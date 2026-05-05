import type { Request, Response } from 'express';
import { quotationService } from '../services/quotation.service.js';
import { sapOrderIntegrationService } from '../services/sapOrderIntegration.service.js';
import { logger } from '../utils/logger.js';
import type {
  CreateQuotationInput,
  UpdateQuotationInput,
  SupersedeQuotationInput,
  RequestDiscountApprovalInput,
  ApproveDiscountInput,
  PassToCashierInput,
  AllocateDepositInput,
  ReserveVehicleInput,
  CancelQuotationInput,
  CreateActivityInput,
  QuotationFilters,
  DiscountApprovalFilters,
} from '../schemas/quotation.schema.js';
import { sendSuccess } from '../utils/api-response.js';
import { getAuditUser } from '../utils/user-context.js';

/**
 * Create a new quotation from an enquiry
 * POST /api/quotations
 */
export const createQuotation = async (req: Request, res: Response) => {
  // IMPORTANT: Always use the current user's SlpCode, never from request body
  // This prevents authorization issues when accessing the quotation later

  // Validate user has SlpCode
  if (!req.user?.SlpCode) {
    return res.status(400).json({
      success: false,
      message: 'User SlpCode is required to create quotations',
    });
  }

  // Log for debugging
  console.log('Creating quotation for user:', {
    userId: req.user.email || req.user.name,
    slpCode: req.user.SlpCode,
    bodySlpCode: req.body.slpCode,
  });

  // Remove slpCode from body if it exists (prevent unauthorized assignment)
  const { slpCode: _ignored, ...bodyData } = req.body;

  const enquirySlno = Number(bodyData.enquirySlno);
  if (Number.isFinite(enquirySlno) && enquirySlno > 0) {
    const existingQuotations = await quotationService.getQuotationsByEnquiryId(enquirySlno);
    const existingQuotation = existingQuotations[0];
    if (existingQuotation) {
      return res.status(409).json({
        success: false,
        message: 'Quotation already exists for this enquiry',
        data: {
          id: existingQuotation.SLNO,
          quotationNumber: existingQuotation.QUOTATION_NUMBER,
        },
      });
    }
  }

  const quotationData: CreateQuotationInput & {
    createdBy: string;
    slpCode: string;
  } = {
    ...bodyData,
    createdBy: getAuditUser(req),
    slpCode: req.user.SlpCode, // Always use authenticated user's SlpCode
  };

  const result = await quotationService.createQuotation(quotationData);
  logger.info(
    {
      quotationId: result.id,
      quotationNumber: result.quotationNumber,
      enquirySlno: quotationData.enquirySlno,
      customerName: quotationData.customerName,
      userId: req.user?.userId,
      slpCode: req.user?.SlpCode,
    },
    'Quotation created locally, starting DMS/SAP posting'
  );

  let sapPosting: {
    status: 'Posted' | 'Queued' | 'Failed';
    integrationLogId?: number;
    reportUrl?: string;
    referenceNumber?: string;
    referenceSource?: 'docEntry' | 'stagingSlno';
    errorMessage?: string;
  } | undefined;

  try {
    const postingResult = await sapOrderIntegrationService.postQuotationToSap(result.id, {
      userId: req.user?.userId,
      email: req.user?.email,
      name: req.user?.name,
      SlpCode: req.user?.SlpCode,
    });

    sapPosting = {
      status:
        postingResult.referenceSource === 'docEntry' ? 'Posted' : 'Queued',
      integrationLogId: postingResult.integrationLogId,
      reportUrl: postingResult.reportUrl,
      referenceNumber: postingResult.referenceNumber,
      referenceSource: postingResult.referenceSource,
    };
    logger.info(
      {
        quotationId: result.id,
        quotationNumber: result.quotationNumber,
        sapPosting,
      },
      'Quotation DMS/SAP posting completed'
    );
  } catch (error: any) {
    console.error('Quotation SAP posting failed after local create:', error);
    logger.error(
      {
        error,
        quotationId: result.id,
        quotationNumber: result.quotationNumber,
      },
      'Quotation DMS/SAP posting failed after local create'
    );
    sapPosting = {
      status: 'Failed',
      errorMessage: error?.message || 'Failed to post quotation to SAP',
    };
  }

  sendSuccess(res, { ...result, sapPosting }, 201);
};

/**
 * Get all quotations with optional filters
 * GET /api/quotations
 */
export const getAllQuotations = async (req: Request, res: Response) => {
  // Authorization middleware has already filtered by slpCode for non-admin users
  const filters: QuotationFilters = {
    status: req.query.status as any,
    slpCode: req.query.slpCode as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
    enquirySlno: req.query.enquirySlno
      ? Number(req.query.enquirySlno as string)
      : undefined,
    quotationNumber: req.query.quotationNumber as string,
  };

  const quotations = await quotationService.getAllQuotations(filters);
  sendSuccess(res, quotations);
};

/**
 * Get a specific quotation by ID
 * GET /api/quotations/:id
 */
export const getQuotationById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const quotation = await quotationService.getQuotationById(id, { resolveLatest: true });

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: 'Quotation not found',
    });
  }

  sendSuccess(res, quotation);
};

/**
 * Get all quotations for a specific enquiry
 * GET /api/quotations/enquiry/:enquiryId
 */
export const getQuotationsByEnquiryId = async (req: Request, res: Response) => {
  const enquiryId = Number(req.params.enquiryId);
  const quotations = await quotationService.getQuotationsByEnquiryId(enquiryId);
  sendSuccess(res, quotations);
};

/**
 * Update an existing quotation
 * PUT /api/quotations/:id
 */
export const updateQuotation = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updatedBy = getAuditUser(req);
  const updateData: UpdateQuotationInput = req.body;

  // Admin-only: Allow slpCode changes
  // Non-admin users cannot change ownership fields
  if (req.user?.role !== 'admin') {
    delete (updateData as any).slpCode;
  }

  const result = await quotationService.updateQuotation(id, {
    ...updateData,
    updatedBy,
  });
  sendSuccess(res, result);
};

/**
 * Supersede a quotation (create new version)
 * POST /api/quotations/supersede
 */
export const supersedeQuotation = async (req: Request, res: Response) => {
  if (!req.user?.SlpCode) {
    return res.status(400).json({
      success: false,
      message: 'User SlpCode is required to create a new quotation version',
    });
  }

  const { slpCode: _ignored, ...bodyData } = req.body;

  const supersedeData: SupersedeQuotationInput & {
    createdBy: string;
    slpCode: string;
  } = {
    ...bodyData,
    createdBy: getAuditUser(req),
    slpCode: req.user.SlpCode,
  };

  const result = await quotationService.supersedeQuotation(supersedeData);

  let sapPosting: {
    status: 'Posted' | 'Queued' | 'Failed';
    integrationLogId?: number;
    reportUrl?: string;
    referenceNumber?: string;
    referenceSource?: 'docEntry' | 'stagingSlno';
    errorMessage?: string;
  } | undefined;

  try {
    const postingResult = await sapOrderIntegrationService.postQuotationToSap(result.id, {
      userId: req.user?.userId,
      email: req.user?.email,
      name: req.user?.name,
      SlpCode: req.user?.SlpCode,
    });

    sapPosting = {
      status:
        postingResult.referenceSource === 'docEntry' ? 'Posted' : 'Queued',
      integrationLogId: postingResult.integrationLogId,
      reportUrl: postingResult.reportUrl,
      referenceNumber: postingResult.referenceNumber,
      referenceSource: postingResult.referenceSource,
    };
  } catch (error: any) {
    console.error('Superseded quotation SAP posting failed after local create:', error);
    sapPosting = {
      status: 'Failed',
      errorMessage: error?.message || 'Failed to post quotation to SAP',
    };
  }

  sendSuccess(res, { ...result, sapPosting }, 201);
};

/**
 * Delete a quotation (soft delete)
 * DELETE /api/quotations/:id
 */
export const deleteQuotation = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deletedBy = getAuditUser(req);

  // Resource ownership already verified by middleware
  const result = await quotationService.deleteQuotation(id, deletedBy);
  sendSuccess(res, result);
};

/**
 * Request discount approval from manager
 * POST /api/quotations/:id/request-approval
 */
export const requestDiscountApproval = async (req: Request, res: Response) => {
  const quotationId = Number(req.params.id);
  const approvalData: RequestDiscountApprovalInput & {
    requestedBy: string;
    slpCode: string;
  } = {
    ...req.body,
    requestedBy: getAuditUser(req),
    slpCode: req.user?.SlpCode || '',
  };

  const result = await quotationService.requestDiscountApproval(quotationId, approvalData);
  sendSuccess(res, result, 201);
};

/**
 * Approve or reject a discount request
 * POST /api/quotations/approvals/:approvalId
 */
export const approveDiscount = async (req: Request, res: Response) => {
  const approvalId = Number(req.params.approvalId);
  const approvalData: ApproveDiscountInput & {
    approvedBy: string;
    slpCode: string;
  } = {
    ...req.body,
    approvedBy: getAuditUser(req),
    slpCode: req.user?.SlpCode || '',
  };

  const result = await quotationService.approveDiscount(approvalId, approvalData);
  sendSuccess(res, result);
};

/**
 * Get all discount approval requests
 * GET /api/quotations/discount-approvals
 */
export const getAllDiscountApprovals = async (req: Request, res: Response) => {
  const filters: DiscountApprovalFilters = {
    status: req.query.status as any,
    assignedTo: req.query.assignedTo as string,
    requestedBySlpCode: req.query.requestedBySlpCode as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
  };

  const approvals = await quotationService.getAllDiscountApprovals(filters);
  sendSuccess(res, approvals);
};

/**
 * Get pending discount approvals assigned to the current user
 * GET /api/quotations/discount-approvals/pending
 */
export const getPendingDiscountApprovals = async (req: Request, res: Response) => {
  const assignedTo = req.user?.name || req.user?.SlpCode || '';
  const approvals = await quotationService.getPendingDiscountApprovals(assignedTo);
  sendSuccess(res, approvals);
};

/**
 * Pass quotation to cashier for deposit collection
 * POST /api/quotations/:id/pass-to-cashier
 */
export const passToCashier = async (req: Request, res: Response) => {
  const quotationId = Number(req.params.id);
  const cashierData: PassToCashierInput & { passedBy: string } = {
    ...req.body,
    passedBy: getAuditUser(req),
  };

  const result = await quotationService.passToCashier(quotationId, cashierData);
  sendSuccess(res, result);
};

/**
 * Get open deposits (passed to cashier but not yet allocated)
 * GET /api/quotations/open-deposits
 */
export const getOpenDeposits = async (_req: Request, res: Response) => {
  const deposits = await quotationService.getOpenDeposits();
  sendSuccess(res, deposits);
};

/**
 * Allocate deposit to enquiry/quotation
 * POST /api/quotations/:id/allocate-deposit
 */
export const allocateDeposit = async (req: Request, res: Response) => {
  const quotationId = Number(req.params.id);
  const allocationData: AllocateDepositInput & { allocatedBy: string } = {
    ...req.body,
    allocatedBy: getAuditUser(req),
  };

  const result = await quotationService.allocateDeposit(quotationId, allocationData);
  sendSuccess(res, result);
};

/**
 * Reserve vehicle directly from quotation
 * POST /api/quotations/:id/reserve-vehicle
 */
export const reserveVehicle = async (req: Request, res: Response) => {
  const quotationId = Number(req.params.id);
  const reserveData: ReserveVehicleInput & { reservedBy: string } = {
    ...req.body,
    reservedBy: getAuditUser(req),
  };

  const result = await quotationService.reserveVehicle(quotationId, reserveData);
  sendSuccess(res, result);
};

/**
 * Cancel quotation
 * POST /api/quotations/:id/cancel
 */
export const cancelQuotation = async (req: Request, res: Response) => {
  const quotationId = Number(req.params.id);
  const cancellationData: CancelQuotationInput & { cancelledBy: string } = {
    ...req.body,
    cancelledBy: getAuditUser(req),
  };

  const result = await quotationService.cancelQuotation(quotationId, cancellationData);
  sendSuccess(res, result);
};

/**
 * Log activity for a quotation
 * POST /api/quotations/:id/activity
 */
export const logActivity = async (req: Request, res: Response) => {
  const quotationSlno = Number(req.params.id);
  const activityData: CreateActivityInput & { createdBy: string } = {
    ...req.body,
    quotationSlno,
    createdBy: getAuditUser(req),
  };

  await quotationService.logActivity(activityData);
  sendSuccess(res, { success: true, message: 'Activity logged successfully' }, 201);
};

/**
 * Get all activities for a quotation
 * GET /api/quotations/:id/activities
 */
export const getQuotationActivities = async (req: Request, res: Response) => {
  const quotationSlno = Number(req.params.id);
  const activities = await quotationService.getQuotationActivities(quotationSlno);
  sendSuccess(res, activities);
};

/**
 * Post quotation to staging/queue and return report URL
 * POST /api/quotations/:id/post-to-sap-report
 */
export const postQuotationToSapReport = async (req: Request, res: Response) => {
  const quotationId = Number(req.params.id);
  const result = await sapOrderIntegrationService.ensureQuotationPosted(quotationId, {
    userId: req.user?.userId,
    email: req.user?.email,
    name: req.user?.name,
    SlpCode: req.user?.SlpCode,
  });

  sendSuccess(res, result);
};

/**
 * POST /api/quotations/:id/confirm-to-sales-order
 * Convert a quotation to sales order via SAP Convert Sales Documents API
 */
export const confirmQuotationToSalesOrder = async (req: Request, res: Response) => {
  const quotationId = Number(req.params.id);
  const result = await quotationService.confirmToSalesOrder(quotationId, getAuditUser(req));
  sendSuccess(res, result);
};
