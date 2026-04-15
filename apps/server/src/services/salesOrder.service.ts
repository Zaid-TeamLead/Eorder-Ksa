import { db } from './database.service.js';
import { logger } from '../utils/logger.js';
import { AppError, ConflictError } from '../types/errors.js';
import type {
  CancelSalesOrderInput,
  CreateSalesOrderFromQuotationInput,
  CreateHandoverBookingInput,
  PassToVehicleAdminInput,
  ReserveVehicleInput,
  RecordLostSaleInput,
  SalesOrderFilters,
  UpdateSalesOrderInput,
} from '../schemas/salesOrder.schema.js';
import {
  buildVehicleReservationConflictMessage,
  extractReservationDateFromNotes,
  findActiveVehicleReservation,
  isVehicleReservationActive,
} from '../utils/vehicle-reservation.js';

const SALES_ORDER_DB_SCHEMA = (() => {
  const raw = process.env.SALES_ORDER_DB_SCHEMA || 'BI_NEGT_KSAISUZU';
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid SALES_ORDER_DB_SCHEMA identifier: ${raw}`);
  }
  return normalized;
})();

const QUOTATION_DB_SCHEMA = (() => {
  const raw = process.env.QUOTATION_DB_SCHEMA || SALES_ORDER_DB_SCHEMA;
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid QUOTATION_DB_SCHEMA identifier: ${raw}`);
  }
  return normalized;
})();

export interface SalesOrder {
  SLNO: number;
  SALES_ORDER_NUMBER: string;
  QUOTATION_SLNO: number;
  ENQUIRY_SLNO: number;
  VERSION: number;
  PARENT_ORDER_SLNO?: number | null;
  IS_LATEST_VERSION: 'Y' | 'N';
  CUSTOMER_NAME?: string | null;
  CUSTOMER_MOBILE?: string | null;
  CUSTOMER_EMAIL?: string | null;
  VEHICLE_MAKE?: string | null;
  VEHICLE_MODEL?: string | null;
  VEHICLE_VARIANT?: string | null;
  VIN_NUMBER?: string | null;
  GRAND_TOTAL: number;
  STATUS: string;
  NOTES?: string | null;
  VEHICLE_RESERVED?: 'Y' | 'N' | null;
  VEHICLE_RESERVED_DATE?: string | null;
  VEHICLE_RESERVED_BY?: string | null;
  VEHICLE_RESERVATION_NOTES?: string | null;
  HANDOVER_BOOKED?: 'Y' | 'N' | null;
  HANDOVER_DATE?: string | null;
  HANDOVER_TIME?: string | null;
  HANDOVER_LOCATION?: string | null;
  HANDOVER_NOTES?: string | null;
  HANDOVER_BOOKED_BY?: string | null;
  HANDOVER_BOOKED_DATE?: string | null;
  PRINTED_BY?: string | null;
  PRINTED_DATE?: string | null;
  PASSED_TO_VEHICLE_ADMIN?: 'Y' | 'N' | null;
  PASSED_TO_VA_DATE?: string | null;
  PASSED_TO_VA_BY?: string | null;
  VEHICLE_ADMIN_ASSIGNED_TO?: string | null;
  VEHICLE_ADMIN_NOTES?: string | null;
  IS_LOST_SALE?: 'Y' | 'N' | null;
  LOST_SALE_DATE?: string | null;
  LOST_REASON?: string | null;
  LOST_NOTES?: string | null;
  CANCELLATION_REASON?: string | null;
  CANCELLED_DATE?: string | null;
  CANCELLED_BY?: string | null;
  SLPCODE: string;
  CREATED_BY: string;
  CREATED_DATE: string;
  UPDATED_BY?: string | null;
  UPDATED_DATE?: string | null;
  IS_DELETED: 'Y' | 'N';
}

export interface SalesOrderQuotation {
  [key: string]: any;
}

export interface SalesOrderQuotationLineItem {
  [key: string]: any;
}

export interface SalesOrderEnquiry {
  [key: string]: any;
  VINDETAILS?: unknown;
  CHARGEDETAILS?: unknown;
}

export interface SalesOrderFinancingScheme {
  [key: string]: any;
}

export interface SalesOrderDetails extends SalesOrder {
  quotation?: SalesOrderQuotation | null;
  lineItems?: SalesOrderQuotationLineItem[];
  enquiry?: SalesOrderEnquiry | null;
  financingSchemes?: SalesOrderFinancingScheme[];
}

class SalesOrderService {
  private getCurrentDateTime(): string {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  private parseJsonField<T>(value: unknown): T | null {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'object') return value as T;
    try {
      return JSON.parse(String(value)) as T;
    } catch {
      return null;
    }
  }

  private async getEnquiryCharge(enquiryId: number): Promise<Record<string, any> | null> {
    try {
      return await db.queryOne<Record<string, any>>(
        `
        SELECT "CHARGECODE", "CHARGENAME", "CHARGEPRICE", "CHARGEDETAILS"
        FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_SALESENQUIRY_CHARGES"
        WHERE "ENQUIRY_SLNO" = ? AND COALESCE("IS_DELETED", 'N') = 'N'
        ORDER BY "SLNO" DESC
        LIMIT 1
      `,
        [enquiryId]
      );
    } catch (error) {
      logger.warn(
        { enquiryId, error },
        'Unable to load sales enquiry charge details for sales order'
      );
      return null;
    }
  }

  private async generateSalesOrderNumber(): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const prefix = `SO-${year}-`;

      const query = `
        SELECT "SALES_ORDER_NUMBER"
        FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
        WHERE "SALES_ORDER_NUMBER" LIKE ?
        ORDER BY "SALES_ORDER_NUMBER" DESC
        LIMIT 1
      `;

      const result = await db.query<{ SALES_ORDER_NUMBER: string }>(query, [
        `${prefix}%`,
      ]);

      if (!result.length) {
        return `${prefix}00001`;
      }

      const latestOrder = result[0];
      if (!latestOrder?.SALES_ORDER_NUMBER) {
        return `${prefix}00001`;
      }

      const last = latestOrder.SALES_ORDER_NUMBER;
      const lastSeq = Number(last.split('-')[2] || 0);
      const newSeq = (lastSeq + 1).toString().padStart(5, '0');
      return `${prefix}${newSeq}`;
    } catch (error: any) {
      logger.error('Error generating sales order number:', error);
      throw new Error(
        'Failed to generate sales order number: ' + error.message
      );
    }
  }

  private async getSalesOrderOrThrow(id: number): Promise<SalesOrder> {
    const order = await this.getSalesOrderById(id);
    if (!order) {
      throw new Error('Sales order not found');
    }
    return order;
  }

  private ensureActionAllowed(order: SalesOrder): void {
    if (order.STATUS === 'Cancelled') {
      throw new Error('Sales order is cancelled and cannot be changed');
    }
    if (order.STATUS === 'Lost') {
      throw new Error('Sales order is marked as lost and cannot be changed');
    }
  }

  async createFromQuotation(
    data: CreateSalesOrderFromQuotationInput & { createdBy: string }
  ): Promise<{ success: boolean; id: number; salesOrderNumber: string }> {
    try {
      const quotationQuery = `
        SELECT *
        FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_QUOTATION"
        WHERE "SLNO" = ? AND "IS_DELETED" = 'N'
      `;
      const quotation = await db.queryOne<any>(quotationQuery, [
        data.quotationSlno,
      ]);

      if (!quotation) {
        throw new Error('Quotation not found');
      }

      if (quotation.STATUS === 'Cancelled') {
        throw new Error('Cannot create sales order from a cancelled quotation');
      }

      if (quotation.STATUS === 'Superseded') {
        throw new Error('Cannot create sales order from a superseded quotation');
      }

      let vinNumber: string | null = quotation.VIN_NUMBER || null;
      if (!vinNumber && quotation.ENQUIRY_SLNO) {
        const enquiryVin = await db.queryOne<{ VINNUMBER: string | null }>(
          `
          SELECT "VINNUMBER"
          FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_SALESENQUIRY"
          WHERE "SLNO" = ?
        `,
          [quotation.ENQUIRY_SLNO]
        );
        vinNumber = enquiryVin?.VINNUMBER || null;
      }

      const currentDateTime = this.getCurrentDateTime();
      const salesOrderNumber = await this.generateSalesOrderNumber();
      const slnoResult = await db.queryOne<{ NEXT_SLNO: number }>(
        `
        SELECT COALESCE(MAX("SLNO"), 0) + 1 AS "NEXT_SLNO"
        FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
      `
      );
      const nextSlno = slnoResult?.NEXT_SLNO ?? 1;

      const insertQuery = `
        INSERT INTO "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER" (
          "SLNO",
          "SALES_ORDER_NUMBER", "QUOTATION_SLNO", "ENQUIRY_SLNO",
          "VERSION", "IS_LATEST_VERSION",
          "CUSTOMER_NAME", "CUSTOMER_MOBILE", "CUSTOMER_EMAIL",
          "VEHICLE_MAKE", "VEHICLE_MODEL", "VEHICLE_VARIANT", "VIN_NUMBER",
          "GRAND_TOTAL", "STATUS", "NOTES", "SLPCODE",
          "CREATED_BY", "CREATED_DATE", "IS_DELETED"
        ) VALUES (?, ?, ?, ?, 1, 'Y', ?, ?, ?, ?, ?, ?, ?, ?, 'Provisional', ?, ?, ?, ?, 'N')
      `;

      await db.execute(insertQuery, [
        nextSlno,
        salesOrderNumber,
        quotation.SLNO,
        quotation.ENQUIRY_SLNO,
        quotation.CUSTOMER_NAME || null,
        quotation.CUSTOMER_MOBILE || null,
        quotation.CUSTOMER_EMAIL || null,
        quotation.VEHICLE_MAKE || null,
        quotation.VEHICLE_MODEL || null,
        quotation.VEHICLE_VARIANT || null,
        vinNumber,
        quotation.GRAND_TOTAL || 0,
        data.notes || null,
        quotation.SLPCODE || '',
        data.createdBy,
        currentDateTime,
      ]);

      const idResult = await db.query<{ SLNO: number }>(
        `
        SELECT "SLNO"
        FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
        WHERE "SALES_ORDER_NUMBER" = ?
      `,
        [salesOrderNumber]
      );

      const createdOrder = idResult[0];
      if (!createdOrder) {
        throw new Error('Sales order created but ID could not be retrieved');
      }

      const id = createdOrder.SLNO;
      logger.info({ id, salesOrderNumber }, 'Sales order created');

      return { success: true, id, salesOrderNumber };
    } catch (error: any) {
      logger.error('Error creating sales order from quotation:', error);
      throw new Error(
        'Failed to create sales order from quotation: ' + error.message
      );
    }
  }

  async getAllSalesOrders(filters?: SalesOrderFilters): Promise<SalesOrder[]> {
    try {
      let query = `
        SELECT *
        FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
        WHERE "IS_DELETED" = 'N'
      `;
      const params: any[] = [];

      if (filters?.status) {
        query += ` AND "STATUS" = ?`;
        params.push(filters.status);
      }

      if (filters?.slpCode) {
        query += ` AND "SLPCODE" = ?`;
        params.push(filters.slpCode);
      }

      if (filters?.quotationSlno) {
        query += ` AND "QUOTATION_SLNO" = ?`;
        params.push(filters.quotationSlno);
      }

      if (filters?.enquirySlno) {
        query += ` AND "ENQUIRY_SLNO" = ?`;
        params.push(filters.enquirySlno);
      }

      if (filters?.orderNumber) {
        query += ` AND "SALES_ORDER_NUMBER" = ?`;
        params.push(filters.orderNumber);
      }

      query += ` ORDER BY "CREATED_DATE" DESC`;
      return await db.query<SalesOrder>(query, params);
    } catch (error: any) {
      logger.error('Error fetching sales orders:', error);
      throw new Error('Failed to fetch sales orders: ' + error.message);
    }
  }

  async getSalesOrderById(id: number): Promise<SalesOrderDetails | null> {
    try {
      const query = `
        SELECT *
        FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
        WHERE "SLNO" = ? AND "IS_DELETED" = 'N'
      `;
      const order = await db.queryOne<SalesOrder>(query, [id]);
      if (!order) return null;

      const [quotation, lineItems, enquiry, financingSchemes] = await Promise.all([
        order.QUOTATION_SLNO
          ? db.queryOne<SalesOrderQuotation>(
              `
              SELECT *
              FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_QUOTATION"
              WHERE "SLNO" = ? AND "IS_DELETED" = 'N'
            `,
              [order.QUOTATION_SLNO]
            )
          : Promise.resolve(null),
        order.QUOTATION_SLNO
          ? db.query<SalesOrderQuotationLineItem>(
              `
              SELECT *
              FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
              WHERE "QUOTATION_SLNO" = ? AND "IS_DELETED" = 'N'
              ORDER BY "LINE_NUMBER"
            `,
              [order.QUOTATION_SLNO]
            )
          : Promise.resolve([]),
        order.ENQUIRY_SLNO
          ? db.queryOne<SalesOrderEnquiry>(
              `
              SELECT *
              FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_SALESENQUIRY"
              WHERE "SLNO" = ?
            `,
              [order.ENQUIRY_SLNO]
            )
          : Promise.resolve(null),
        order.ENQUIRY_SLNO
          ? db.query<SalesOrderFinancingScheme>(
              `
              SELECT *
              FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_ENQUIRY_FINANCING"
              WHERE "ENQUIRY_SLNO" = ? AND COALESCE("IS_DELETED", 'N') = 'N'
              ORDER BY "CREATED_DATE" DESC, "SLNO" DESC
            `,
              [order.ENQUIRY_SLNO]
            )
          : Promise.resolve([]),
      ]);

      let hydratedEnquiry = enquiry;
      if (hydratedEnquiry) {
        hydratedEnquiry = {
          ...hydratedEnquiry,
          VINDETAILS: this.parseJsonField(hydratedEnquiry.VINDETAILS),
        };

        const charge = order.ENQUIRY_SLNO
          ? await this.getEnquiryCharge(order.ENQUIRY_SLNO)
          : null;

        if (charge) {
          hydratedEnquiry.CHARGECODE = charge.CHARGECODE ?? null;
          hydratedEnquiry.CHARGENAME = charge.CHARGENAME ?? null;
          hydratedEnquiry.CHARGEPRICE = charge.CHARGEPRICE ?? null;
          hydratedEnquiry.CHARGEDETAILS = this.parseJsonField(charge.CHARGEDETAILS);
        }
      }

      return {
        ...order,
        quotation,
        lineItems,
        enquiry: hydratedEnquiry,
        financingSchemes,
      };
    } catch (error: any) {
      logger.error('Error fetching sales order by ID:', error);
      throw new Error('Failed to fetch sales order: ' + error.message);
    }
  }

  async updateSalesOrder(
    id: number,
    data: UpdateSalesOrderInput & { updatedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const existingOrder = await this.getSalesOrderOrThrow(id);
      const currentDateTime = this.getCurrentDateTime();

      const updates: string[] = [];
      const params: Array<string | number | null> = [];

      if (data.notes !== undefined) {
        updates.push(`"NOTES" = ?`);
        params.push(data.notes || null);
      }

      if (data.vinNumber !== undefined) {
        if (existingOrder.VEHICLE_RESERVED === 'Y') {
          throw new Error('Cannot change VIN after vehicle has been reserved');
        }
        updates.push(`"VIN_NUMBER" = ?`);
        params.push(data.vinNumber);
      }

      updates.push(`"UPDATED_BY" = ?`);
      params.push(data.updatedBy);
      updates.push(`"UPDATED_DATE" = ?`);
      params.push(currentDateTime);

      const query = `
        UPDATE "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
        SET ${updates.join(', ')}
        WHERE "SLNO" = ?
      `;

      params.push(id);
      await db.execute(query, params);

      logger.info({ id }, 'Sales order updated');
      return { success: true };
    } catch (error: any) {
      logger.error('Error updating sales order:', error);
      throw new Error('Failed to update sales order: ' + error.message);
    }
  }

  async markAsPrinted(
    id: number,
    printedBy: string
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      const currentDateTime = this.getCurrentDateTime();
      const query = `
        UPDATE "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
        SET "STATUS" = 'Printed',
            "PRINTED_BY" = ?,
            "PRINTED_DATE" = ?,
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [
        printedBy,
        currentDateTime,
        printedBy,
        currentDateTime,
        id,
      ]);

      logger.info({ id }, 'Sales order marked as printed');
      return { success: true };
    } catch (error: any) {
      logger.error('Error marking sales order as printed:', error);
      throw new Error('Failed to mark sales order as printed: ' + error.message);
    }
  }

  async passToVehicleAdmin(
    id: number,
    data: PassToVehicleAdminInput & { passedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      if (order.STATUS !== 'Printed' && order.STATUS !== 'PassedToVehicleAdmin') {
        throw new Error(
          'Sales order must be printed before passing to vehicle admin'
        );
      }

      const currentDateTime = this.getCurrentDateTime();
      const query = `
        UPDATE "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
        SET "STATUS" = 'PassedToVehicleAdmin',
            "PASSED_TO_VEHICLE_ADMIN" = 'Y',
            "PASSED_TO_VA_DATE" = ?,
            "PASSED_TO_VA_BY" = ?,
            "VEHICLE_ADMIN_ASSIGNED_TO" = ?,
            "VEHICLE_ADMIN_NOTES" = ?,
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [
        currentDateTime,
        data.passedBy,
        data.assignedTo,
        data.notes || null,
        data.passedBy,
        currentDateTime,
        id,
      ]);

      logger.info({ id, assignedTo: data.assignedTo }, 'Sales order passed to vehicle admin');
      return { success: true };
    } catch (error: any) {
      logger.error('Error passing sales order to vehicle admin:', error);
      throw new Error('Failed to pass sales order to vehicle admin: ' + error.message);
    }
  }

  async reserveVehicle(
    id: number,
    data: ReserveVehicleInput & { reservedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      if (!order.VIN_NUMBER) {
        throw new Error('Sales order must have a VIN before reserving vehicle');
      }

      const existingReservationForCurrentOrder = isVehicleReservationActive(
        order.VEHICLE_RESERVED,
        extractReservationDateFromNotes(order.VEHICLE_RESERVATION_NOTES, 'Reservation To')
      );

      if (existingReservationForCurrentOrder) {
        throw new ConflictError('Vehicle is already reserved for this sales order');
      }

      const conflictingReservation = await findActiveVehicleReservation({
        vinNumber: order.VIN_NUMBER,
        quotationSchema: QUOTATION_DB_SCHEMA,
        salesOrderSchema: SALES_ORDER_DB_SCHEMA,
        excludeSalesOrderId: id,
      });

      if (conflictingReservation) {
        throw new ConflictError(
          buildVehicleReservationConflictMessage(order.VIN_NUMBER, conflictingReservation)
        );
      }

      const currentDateTime = this.getCurrentDateTime();
      const query = `
        UPDATE "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
        SET "VEHICLE_RESERVED" = 'Y',
            "VEHICLE_RESERVED_DATE" = ?,
            "VEHICLE_RESERVED_BY" = ?,
            "VEHICLE_RESERVATION_NOTES" = ?,
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [
        currentDateTime,
        data.reservedBy,
        data.reservationNotes || null,
        data.reservedBy,
        currentDateTime,
        id,
      ]);

      logger.info({ id, vin: order.VIN_NUMBER }, 'Vehicle reserved for sales order');
      return { success: true };
    } catch (error: any) {
      logger.error('Error reserving vehicle for sales order:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new Error('Failed to reserve vehicle: ' + error.message);
    }
  }

  async createHandoverBooking(
    id: number,
    data: CreateHandoverBookingInput & { bookedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      if (
        order.STATUS !== 'PassedToVehicleAdmin' &&
        order.STATUS !== 'HandoverBooked'
      ) {
        throw new Error(
          'Sales order must be passed to vehicle admin before creating handover booking'
        );
      }

      if (order.PASSED_TO_VEHICLE_ADMIN !== 'Y') {
        throw new Error(
          'Sales order must be passed to vehicle admin before creating handover booking'
        );
      }

      const currentDateTime = this.getCurrentDateTime();
      const query = `
        UPDATE "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
        SET "STATUS" = 'HandoverBooked',
            "HANDOVER_BOOKED" = 'Y',
            "HANDOVER_DATE" = ?,
            "HANDOVER_TIME" = ?,
            "HANDOVER_LOCATION" = ?,
            "HANDOVER_NOTES" = ?,
            "HANDOVER_BOOKED_BY" = ?,
            "HANDOVER_BOOKED_DATE" = ?,
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [
        data.handoverDate,
        data.handoverTime || null,
        data.handoverLocation || null,
        data.notes || null,
        data.bookedBy,
        currentDateTime,
        data.bookedBy,
        currentDateTime,
        id,
      ]);

      logger.info({ id, handoverDate: data.handoverDate }, 'Handover booking created');
      return { success: true };
    } catch (error: any) {
      logger.error('Error creating handover booking:', error);
      throw new Error('Failed to create handover booking: ' + error.message);
    }
  }

  async recordLostSale(
    id: number,
    data: RecordLostSaleInput & { recordedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      const currentDateTime = this.getCurrentDateTime();
      const query = `
        UPDATE "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
        SET "STATUS" = 'Lost',
            "IS_LOST_SALE" = 'Y',
            "VEHICLE_RESERVED" = 'N',
            "HANDOVER_BOOKED" = 'N',
            "LOST_SALE_DATE" = ?,
            "LOST_REASON" = ?,
            "LOST_NOTES" = ?,
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [
        currentDateTime,
        data.lostReason,
        data.notes || null,
        data.recordedBy,
        currentDateTime,
        id,
      ]);

      logger.info({ id }, 'Sales order marked as lost sale');
      return { success: true };
    } catch (error: any) {
      logger.error('Error recording lost sale:', error);
      throw new Error('Failed to record lost sale: ' + error.message);
    }
  }

  async cancelSalesOrder(
    id: number,
    data: CancelSalesOrderInput & { cancelledBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      const currentDateTime = this.getCurrentDateTime();
      const query = `
        UPDATE "${SALES_ORDER_DB_SCHEMA}"."DMS_SALES_ORDER"
        SET "STATUS" = 'Cancelled',
            "VEHICLE_RESERVED" = 'N',
            "HANDOVER_BOOKED" = 'N',
            "CANCELLATION_REASON" = ?,
            "CANCELLED_DATE" = ?,
            "CANCELLED_BY" = ?,
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [
        data.cancellationReason,
        currentDateTime,
        data.cancelledBy,
        data.cancelledBy,
        currentDateTime,
        id,
      ]);

      logger.info({ id }, 'Sales order cancelled');
      return { success: true };
    } catch (error: any) {
      logger.error('Error cancelling sales order:', error);
      throw new Error('Failed to cancel sales order: ' + error.message);
    }
  }
}

export const salesOrderService = new SalesOrderService();
