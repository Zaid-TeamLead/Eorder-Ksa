import { db } from '../services/database.service.js';

export interface VehicleReservationConflict {
  sourceType: 'Quotation' | 'SalesOrder';
  sourceId: number;
  sourceNumber: string;
  reservedBy: string | null;
  reservedOn: string | null;
  reservedFrom: string | null;
  reservedTo: string | null;
  notes: string | null;
}

interface ReservationLookupParams {
  vinNumber: string;
  quotationSchema: string;
  salesOrderSchema: string;
  excludeQuotationId?: number;
  excludeSalesOrderId?: number;
}

interface ReservationRow {
  SOURCE_TYPE: 'Quotation' | 'SalesOrder';
  SOURCE_ID: number;
  SOURCE_NUMBER: string;
  VEHICLE_RESERVED?: string | null;
  VEHICLE_RESERVED_BY?: string | null;
  VEHICLE_RESERVED_DATE?: string | null;
  VEHICLE_RESERVATION_FROM_DATE?: string | null;
  VEHICLE_RESERVATION_TO_DATE?: string | null;
  VEHICLE_RESERVATION_NOTES?: string | null;
}

export function extractReservationDateFromNotes(
  notes: string | null | undefined,
  label: 'Reservation From' | 'Reservation To'
): string | null {
  if (!notes) return null;
  const match = notes.match(new RegExp(`${label}:\\s*([^\\n\\r]+)`, 'i'));
  return match?.[1]?.trim() || null;
}

export function normalizeReservationDate(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return trimmed;
}

export function isVehicleReservationActive(
  reservedFlag: string | null | undefined,
  reservationToDate: string | null | undefined
): boolean {
  if (reservedFlag !== 'Y') {
    return false;
  }

  const normalizedToDate = normalizeReservationDate(reservationToDate);
  if (!normalizedToDate) {
    return true;
  }

  const today = new Date().toISOString().slice(0, 10);
  return normalizedToDate >= today;
}

function mapReservationConflict(row: ReservationRow): VehicleReservationConflict | null {
  const notes = row.VEHICLE_RESERVATION_NOTES || null;
  const reservedFrom =
    normalizeReservationDate(row.VEHICLE_RESERVATION_FROM_DATE) ||
    extractReservationDateFromNotes(notes, 'Reservation From');
  const reservedTo =
    normalizeReservationDate(row.VEHICLE_RESERVATION_TO_DATE) ||
    extractReservationDateFromNotes(notes, 'Reservation To');

  if (!isVehicleReservationActive(row.VEHICLE_RESERVED, reservedTo)) {
    return null;
  }

  return {
    sourceType: row.SOURCE_TYPE,
    sourceId: Number(row.SOURCE_ID),
    sourceNumber: row.SOURCE_NUMBER,
    reservedBy: row.VEHICLE_RESERVED_BY || null,
    reservedOn: row.VEHICLE_RESERVED_DATE || null,
    reservedFrom,
    reservedTo,
    notes,
  };
}

async function queryQuotationReservations(
  schema: string,
  vinNumber: string,
  excludeQuotationId?: number
): Promise<VehicleReservationConflict[]> {
  const params: Array<string | number> = [vinNumber];
  const hasExcludeQuotationId =
    typeof excludeQuotationId === 'number' && excludeQuotationId > 0;
  const excludeClause = hasExcludeQuotationId ? ` AND "SLNO" <> ?` : '';
  if (hasExcludeQuotationId) {
    params.push(excludeQuotationId);
  }

  const queryWithDateRange = `
    SELECT
      'Quotation' AS "SOURCE_TYPE",
      "SLNO" AS "SOURCE_ID",
      "QUOTATION_NUMBER" AS "SOURCE_NUMBER",
      "VEHICLE_RESERVED",
      "VEHICLE_RESERVED_BY",
      "VEHICLE_RESERVED_DATE",
      "VEHICLE_RESERVATION_FROM_DATE",
      "VEHICLE_RESERVATION_TO_DATE",
      "VEHICLE_RESERVATION_NOTES"
    FROM "${schema}"."DMS_QUOTATION"
    WHERE "VIN_NUMBER" = ?
      AND "IS_DELETED" = 'N'
      AND "STATUS" NOT IN ('Cancelled', 'Superseded')
      ${excludeClause}
  `;

  try {
    const rows = await db.query<ReservationRow>(queryWithDateRange, params);
    return rows
      .map(mapReservationConflict)
      .filter((row): row is VehicleReservationConflict => Boolean(row));
  } catch (error: any) {
    const message = String(error?.message || '');
    const missingRangeColumns =
      message.includes('invalid column name: VEHICLE_RESERVATION_FROM_DATE') ||
      message.includes('invalid column name: VEHICLE_RESERVATION_TO_DATE');

    if (!missingRangeColumns) {
      throw error;
    }

    const fallbackQuery = `
      SELECT
        'Quotation' AS "SOURCE_TYPE",
        "SLNO" AS "SOURCE_ID",
        "QUOTATION_NUMBER" AS "SOURCE_NUMBER",
        "VEHICLE_RESERVED",
        "VEHICLE_RESERVED_BY",
        "VEHICLE_RESERVED_DATE",
        NULL AS "VEHICLE_RESERVATION_FROM_DATE",
        NULL AS "VEHICLE_RESERVATION_TO_DATE",
        "VEHICLE_RESERVATION_NOTES"
      FROM "${schema}"."DMS_QUOTATION"
      WHERE "VIN_NUMBER" = ?
        AND "IS_DELETED" = 'N'
        AND "STATUS" NOT IN ('Cancelled', 'Superseded')
        ${excludeClause}
    `;

    const rows = await db.query<ReservationRow>(fallbackQuery, params);
    return rows
      .map(mapReservationConflict)
      .filter((row): row is VehicleReservationConflict => Boolean(row));
  }
}

async function querySalesOrderReservations(
  schema: string,
  vinNumber: string,
  excludeSalesOrderId?: number
): Promise<VehicleReservationConflict[]> {
  const params: Array<string | number> = [vinNumber];
  const hasExcludeSalesOrderId =
    typeof excludeSalesOrderId === 'number' && excludeSalesOrderId > 0;
  const excludeClause = hasExcludeSalesOrderId ? ` AND "SLNO" <> ?` : '';
  if (hasExcludeSalesOrderId) {
    params.push(excludeSalesOrderId);
  }

  const query = `
    SELECT
      'SalesOrder' AS "SOURCE_TYPE",
      "SLNO" AS "SOURCE_ID",
      "SALES_ORDER_NUMBER" AS "SOURCE_NUMBER",
      "VEHICLE_RESERVED",
      "VEHICLE_RESERVED_BY",
      "VEHICLE_RESERVED_DATE",
      NULL AS "VEHICLE_RESERVATION_FROM_DATE",
      NULL AS "VEHICLE_RESERVATION_TO_DATE",
      "VEHICLE_RESERVATION_NOTES"
    FROM "${schema}"."DMS_SALES_ORDER"
    WHERE "VIN_NUMBER" = ?
      AND "IS_DELETED" = 'N'
      AND "STATUS" NOT IN ('Cancelled', 'Lost')
      ${excludeClause}
  `;

  const rows = await db.query<ReservationRow>(query, params);
  return rows
    .map(mapReservationConflict)
    .filter((row): row is VehicleReservationConflict => Boolean(row));
}

export async function findActiveVehicleReservation(
  params: ReservationLookupParams
): Promise<VehicleReservationConflict | null> {
  const [quotationReservations, salesOrderReservations] = await Promise.all([
    queryQuotationReservations(
      params.quotationSchema,
      params.vinNumber,
      params.excludeQuotationId
    ),
    querySalesOrderReservations(
      params.salesOrderSchema,
      params.vinNumber,
      params.excludeSalesOrderId
    ),
  ]);

  const allReservations = [...quotationReservations, ...salesOrderReservations];
  allReservations.sort((left, right) => {
    const leftTime = new Date(left.reservedOn || 0).getTime();
    const rightTime = new Date(right.reservedOn || 0).getTime();
    return rightTime - leftTime;
  });

  return allReservations[0] || null;
}

export function buildVehicleReservationConflictMessage(
  vinNumber: string,
  reservation: VehicleReservationConflict
): string {
  const reservedBy = reservation.reservedBy ? ` by ${reservation.reservedBy}` : '';
  const reservedUntil = reservation.reservedTo
    ? ` until ${reservation.reservedTo}`
    : ' with no end date';

  return `This vehicle (${vinNumber}) is already reserved on ${reservation.sourceType} ${reservation.sourceNumber}${reservedBy}${reservedUntil}.`;
}
