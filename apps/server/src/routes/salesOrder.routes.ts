import { Router, type Router as ExpressRouter, type Request } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '../middleware/validator.js';
import {
  checkResourceOwnership,
  enforceOwnershipFilter,
} from '../middleware/resource-ownership.js';
import {
  cancelSalesOrder,
  confirmSalesOrderToSalesOrder,
  createSalesOrderHandoverBooking,
  createSalesOrderFromQuotation,
  getAllSalesOrders,
  getSalesOrderById,
  markSalesOrderPrinted,
  passSalesOrderToVehicleAdmin,
  reserveSalesOrderVehicle,
  recordSalesOrderLostSale,
  updateSalesOrder,
} from '../controllers/salesOrder.controller.js';
import {
  cancelSalesOrderSchema,
  createHandoverBookingSchema,
  createSalesOrderFromQuotationSchema,
  getSalesOrderByIdSchema,
  passToVehicleAdminSchema,
  reserveVehicleSchema,
  recordLostSaleSchema,
  updateSalesOrderSchema,
} from '../schemas/salesOrder.schema.js';
import { salesOrderService } from '../services/salesOrder.service.js';

const router: ExpressRouter = Router();

function getSalesOrderOwnershipCandidates(req: Request): string[] {
  const emailUserId = req.user?.email?.split('@')[0]?.trim();
  const normalizedNameId = req.user?.name?.replace(/^User\s+/i, '').trim();

  return Array.from(
    new Set(
      [req.user?.SlpCode, emailUserId, normalizedNameId]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );
}

/**
 * POST /api/sales-orders/from-quotation
 * Create sales order from an existing quotation
 */
router.post(
  '/from-quotation',
  validate(createSalesOrderFromQuotationSchema),
  asyncHandler(createSalesOrderFromQuotation)
);

/**
 * GET /api/sales-orders
 * Get all sales orders (filtered by ownership for non-admin users)
 */
router.get(
  '/',
  enforceOwnershipFilter((req) => req.user?.SlpCode, 'slpCode'),
  asyncHandler(getAllSalesOrders)
);

/**
 * GET /api/sales-orders/:id
 * Get single sales order by ID (with ownership check)
 */
router.get(
  '/:id',
  validate(getSalesOrderByIdSchema, 'params'),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => salesOrderService.getSalesOrderById(Number(id)),
      getOwnerId: (order) => order.SLPCODE,
      getUserId: (req) => getSalesOrderOwnershipCandidates(req),
      resourceName: 'Sales Order',
      allowUnassigned: false,
    })
  ),
  asyncHandler(getSalesOrderById)
);

/**
 * PATCH /api/sales-orders/:id
 * Update sales order details
 */
router.patch(
  '/:id',
  validate(getSalesOrderByIdSchema, 'params'),
  validate(updateSalesOrderSchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => salesOrderService.getSalesOrderById(Number(id)),
      getOwnerId: (order) => order.SLPCODE,
      getUserId: (req) => getSalesOrderOwnershipCandidates(req),
      resourceName: 'Sales Order',
      allowUnassigned: false,
    })
  ),
  asyncHandler(updateSalesOrder)
);

/**
 * POST /api/sales-orders/:id/print
 * Mark sales order as printed
 */
router.post(
  '/:id/print',
  validate(getSalesOrderByIdSchema, 'params'),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => salesOrderService.getSalesOrderById(Number(id)),
      getOwnerId: (order) => order.SLPCODE,
      getUserId: (req) => getSalesOrderOwnershipCandidates(req),
      resourceName: 'Sales Order',
      allowUnassigned: false,
    })
  ),
  asyncHandler(markSalesOrderPrinted)
);

/**
 * POST /api/sales-orders/:id/confirm-to-sales-order
 * Convert the source quotation into a SAP sales order and sync the SAP refs
 */
router.post(
  '/:id/confirm-to-sales-order',
  validate(getSalesOrderByIdSchema, 'params'),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => salesOrderService.getSalesOrderById(Number(id)),
      getOwnerId: (order) => order.SLPCODE,
      getUserId: (req) => getSalesOrderOwnershipCandidates(req),
      resourceName: 'Sales Order',
      allowUnassigned: false,
    })
  ),
  asyncHandler(confirmSalesOrderToSalesOrder)
);

/**
 * POST /api/sales-orders/:id/pass-to-vehicle-admin
 * Pass sales order to vehicle admin
 */
router.post(
  '/:id/pass-to-vehicle-admin',
  validate(getSalesOrderByIdSchema, 'params'),
  validate(passToVehicleAdminSchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => salesOrderService.getSalesOrderById(Number(id)),
      getOwnerId: (order) => order.SLPCODE,
      getUserId: (req) => getSalesOrderOwnershipCandidates(req),
      resourceName: 'Sales Order',
      allowUnassigned: false,
    })
  ),
  asyncHandler(passSalesOrderToVehicleAdmin)
);

/**
 * POST /api/sales-orders/:id/reserve-vehicle
 * Reserve VIN for this sales order
 */
router.post(
  '/:id/reserve-vehicle',
  validate(getSalesOrderByIdSchema, 'params'),
  validate(reserveVehicleSchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => salesOrderService.getSalesOrderById(Number(id)),
      getOwnerId: (order) => order.SLPCODE,
      getUserId: (req) => getSalesOrderOwnershipCandidates(req),
      resourceName: 'Sales Order',
      allowUnassigned: false,
    })
  ),
  asyncHandler(reserveSalesOrderVehicle)
);

/**
 * POST /api/sales-orders/:id/create-handover-booking
 * Create handover booking for this sales order
 */
router.post(
  '/:id/create-handover-booking',
  validate(getSalesOrderByIdSchema, 'params'),
  validate(createHandoverBookingSchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => salesOrderService.getSalesOrderById(Number(id)),
      getOwnerId: (order) => order.SLPCODE,
      getUserId: (req) => getSalesOrderOwnershipCandidates(req),
      resourceName: 'Sales Order',
      allowUnassigned: false,
    })
  ),
  asyncHandler(createSalesOrderHandoverBooking)
);

/**
 * POST /api/sales-orders/:id/record-lost-sale
 * Record a sales order as lost sale
 */
router.post(
  '/:id/record-lost-sale',
  validate(getSalesOrderByIdSchema, 'params'),
  validate(recordLostSaleSchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => salesOrderService.getSalesOrderById(Number(id)),
      getOwnerId: (order) => order.SLPCODE,
      getUserId: (req) => getSalesOrderOwnershipCandidates(req),
      resourceName: 'Sales Order',
      allowUnassigned: false,
    })
  ),
  asyncHandler(recordSalesOrderLostSale)
);

/**
 * POST /api/sales-orders/:id/cancel
 * Cancel a sales order
 */
router.post(
  '/:id/cancel',
  validate(getSalesOrderByIdSchema, 'params'),
  validate(cancelSalesOrderSchema),
  asyncHandler(
    checkResourceOwnership({
      getResourceById: (id) => salesOrderService.getSalesOrderById(Number(id)),
      getOwnerId: (order) => order.SLPCODE,
      getUserId: (req) => req.user?.SlpCode,
      resourceName: 'Sales Order',
      allowUnassigned: false,
    })
  ),
  asyncHandler(cancelSalesOrder)
);

export default router;
