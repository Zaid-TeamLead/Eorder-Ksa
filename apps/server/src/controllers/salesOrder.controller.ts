import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import { getAuditUser } from '../utils/user-context.js';
import { salesOrderService } from '../services/salesOrder.service.js';
import { sapOrderIntegrationService } from '../services/sapOrderIntegration.service.js';
import type {
  CancelSalesOrderInput,
  CreateHandoverBookingInput,
  PassToVehicleAdminInput,
  ReserveVehicleInput,
  RecordLostSaleInput,
  SalesOrderFilters,
  UpdateSalesOrderInput,
} from '../schemas/salesOrder.schema.js';

type SalesOrderSapPosting = {
  status: 'Posted' | 'Queued' | 'Failed';
  integrationLogId?: number;
  reportUrl?: string;
  referenceNumber?: string;
  referenceSource?: 'docEntry' | 'stagingSlno';
  errorMessage?: string;
};

function buildSapPostingSummary(postingResult: {
  integrationLogId?: number;
  reportUrl?: string;
  referenceNumber: string;
  referenceSource: 'docEntry' | 'stagingSlno';
}): SalesOrderSapPosting {
  return {
    status: postingResult.referenceSource === 'docEntry' ? 'Posted' : 'Queued',
    integrationLogId: postingResult.integrationLogId,
    reportUrl: postingResult.reportUrl,
    referenceNumber: postingResult.referenceNumber,
    referenceSource: postingResult.referenceSource,
  };
}

/**
 * Create sales order from quotation
 * POST /api/sales-orders/from-quotation
 */
export const createSalesOrderFromQuotation = async (
  req: Request,
  res: Response
) => {
  const result = await salesOrderService.createFromQuotation({
    ...req.body,
    createdBy: getAuditUser(req),
  });

  let sapPosting: SalesOrderSapPosting | undefined;
  try {
    const postingResult = await sapOrderIntegrationService.postSalesOrderToSap(result.id, {
      userId: req.user?.userId,
      email: req.user?.email,
      name: req.user?.name,
      SlpCode: req.user?.SlpCode,
    });

    sapPosting = buildSapPostingSummary(postingResult);
  } catch (error: any) {
    sapPosting = {
      status: 'Failed',
      errorMessage: error?.message || 'Failed to push sales order to DMS queue',
    };
  }

  sendSuccess(res, { ...result, sapPosting }, 201);
};

/**
 * Get all sales orders with optional filters
 * GET /api/sales-orders
 */
export const getAllSalesOrders = async (req: Request, res: Response) => {
  const filters: SalesOrderFilters = {
    status: req.query.status as any,
    slpCode: req.query.slpCode as string,
    quotationSlno: req.query.quotationSlno
      ? Number(req.query.quotationSlno as string)
      : undefined,
    enquirySlno: req.query.enquirySlno
      ? Number(req.query.enquirySlno as string)
      : undefined,
    orderNumber: req.query.orderNumber as string,
  };

  const orders = await salesOrderService.getAllSalesOrders(filters);
  sendSuccess(res, orders);
};

/**
 * Get sales order by ID
 * GET /api/sales-orders/:id
 */
export const getSalesOrderById = async (req: Request, res: Response) => {
  const order = req.resource;
  sendSuccess(res, order);
};

/**
 * Update sales order data (currently notes)
 * PATCH /api/sales-orders/:id
 */
export const updateSalesOrder = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updateData: UpdateSalesOrderInput & { updatedBy: string } = {
    ...req.body,
    updatedBy: getAuditUser(req),
  };
  const result = await salesOrderService.updateSalesOrder(id, updateData);
  sendSuccess(res, result);
};

/**
 * Mark sales order as printed
 * POST /api/sales-orders/:id/print
 */
export const markSalesOrderPrinted = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await salesOrderService.markAsPrinted(id, getAuditUser(req));
  sendSuccess(res, result);
};

/**
 * Confirm sales order in SAP by converting its source quotation
 * POST /api/sales-orders/:id/confirm-to-sales-order
 */
export const confirmSalesOrderToSalesOrder = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await salesOrderService.confirmToSalesOrder(id, getAuditUser(req));

  let sapPosting: SalesOrderSapPosting | undefined;

  try {
    const postingResult = await sapOrderIntegrationService.postSalesOrderToSap(id, {
      userId: req.user?.userId,
      email: req.user?.email,
      name: req.user?.name,
      SlpCode: req.user?.SlpCode,
    });

    sapPosting = buildSapPostingSummary(postingResult);
  } catch (error: any) {
    sapPosting = {
      status: 'Failed',
      errorMessage: error?.message || 'Failed to push sales order to DMS queue',
    };
  }

  sendSuccess(res, { ...result, sapPosting });
};

/**
 * Pass sales order to vehicle admin
 * POST /api/sales-orders/:id/pass-to-vehicle-admin
 */
export const passSalesOrderToVehicleAdmin = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);
  const passData: PassToVehicleAdminInput & { passedBy: string } = {
    ...req.body,
    passedBy: getAuditUser(req),
  };
  const result = await salesOrderService.passToVehicleAdmin(id, passData);
  sendSuccess(res, result);
};

/**
 * Reserve selected vehicle for sales order
 * POST /api/sales-orders/:id/reserve-vehicle
 */
export const reserveSalesOrderVehicle = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const reserveData: ReserveVehicleInput & { reservedBy: string } = {
    ...req.body,
    reservedBy: getAuditUser(req),
  };
  const result = await salesOrderService.reserveVehicle(id, reserveData);
  sendSuccess(res, result);
};

/**
 * Create handover booking for sales order
 * POST /api/sales-orders/:id/create-handover-booking
 */
export const createSalesOrderHandoverBooking = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);
  const handoverData: CreateHandoverBookingInput & { bookedBy: string } = {
    ...req.body,
    bookedBy: getAuditUser(req),
  };
  const result = await salesOrderService.createHandoverBooking(id, handoverData);
  sendSuccess(res, result);
};

/**
 * Record sales order as lost sale
 * POST /api/sales-orders/:id/record-lost-sale
 */
export const recordSalesOrderLostSale = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);
  const lostData: RecordLostSaleInput & { recordedBy: string } = {
    ...req.body,
    recordedBy: getAuditUser(req),
  };
  const result = await salesOrderService.recordLostSale(id, lostData);
  sendSuccess(res, result);
};

/**
 * Cancel sales order
 * POST /api/sales-orders/:id/cancel
 */
export const cancelSalesOrder = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const cancelData: CancelSalesOrderInput & { cancelledBy: string } = {
    ...req.body,
    cancelledBy: getAuditUser(req),
  };
  const result = await salesOrderService.cancelSalesOrder(id, cancelData);
  sendSuccess(res, result);
};
