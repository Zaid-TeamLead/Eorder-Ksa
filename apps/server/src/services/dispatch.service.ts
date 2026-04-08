import { createRequire } from 'node:module';
import { db } from './database.service.js';
import { AppError, NotFoundError } from '../types/errors.js';
import { logger } from '../utils/logger.js';

const require = createRequire(import.meta.url);
const hanaStream = require('../../../../node_modules/.bun/node_modules/@sap/hana-client/extension/Stream.js');

const DISPATCH_DB_SCHEMA = (() => {
  const raw = process.env.DISPATCH_DB_SCHEMA || 'BI_NEGT_KSAISUZU';
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid DISPATCH_DB_SCHEMA identifier: ${raw}`);
  }
  return normalized;
})();

const DISPATCH_QUERY_SP = process.env.DISPATCH_QUERY_SP || 'BI_VEHDISPATCH_10001';
const DISPATCH_CREATE_HEADER_SP = process.env.DISPATCH_CREATE_HEADER_SP || 'BI_VEHDISPATCH_20001';
const DISPATCH_CREATE_LINE_SP = process.env.DISPATCH_CREATE_LINE_SP || 'BI_VEHDISPATCH_20002';
const DISPATCH_SAVE_POD_SP = process.env.DISPATCH_SAVE_POD_SP || 'BI_VEHDISPATCH_20003';
const DISPATCH_POD_TABLE = `"${DISPATCH_DB_SCHEMA}"."DMS_VEHPOD"`;

function normalizeProcedureName(name: string): string {
  const normalized = name.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid procedure name: ${name}`);
  }
  return normalized;
}

function getSpCallSql(procedureName: string, parameterCount: number): string {
  const normalizedProcedureName = normalizeProcedureName(procedureName);
  return `CALL "${DISPATCH_DB_SCHEMA}"."${normalizedProcedureName}"(${Array(parameterCount)
    .fill('?')
    .join(', ')})`;
}

function isTooManyParameterError(error: unknown): boolean {
  const message = String((error as any)?.message || error || '').toLowerCase();
  return message.includes('too many parameters') || message.includes('wrong number or types of parameters');
}

type Row = Record<string, any>;

function pickValue(row: Row, candidates: string[]): any {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }

  const normalizedCandidates = candidates.map((candidate) =>
    candidate.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  );

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (normalizedCandidates.includes(normalizedKey) && value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return null;
}

function toText(value: any): string {
  if (value === undefined || value === null) return '';
  const text = String(value).trim();
  if (text === '?' || text === 'null') return '';
  return text;
}

function toNullableText(value: any): string | null {
  const text = toText(value);
  return text || null;
}

function toNumber(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDigitsText(value: any): string {
  const text = toText(value);
  if (!text) return '';
  return text.replace(/\D/g, '');
}

function toDateText(value: any): string {
  const text = toText(value);
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return text;
}

function toFlag(value: boolean): string {
  return value ? 'Y' : 'N';
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function quoteSqlString(value: any): string {
  if (value === undefined || value === null) return "''";
  return `'${escapeSqlString(String(value))}'`;
}

function mapPodRow(row: Row | null | undefined) {
  if (!row) return undefined;

  return {
    invoice: toText(pickValue(row, ['INVOICE'])) === 'Y',
    insurance: toText(pickValue(row, ['INSURANCE'])) === 'Y',
    warranty: toText(pickValue(row, ['WARRANTY'])) === 'Y',
    deliveryCheckList: toText(pickValue(row, ['DELIVERYCHECKLIST'])) === 'Y',
    registrationPapers: toText(pickValue(row, ['REGISTRATIONPAPERS'])) === 'Y',
    vehicleKeys: toText(pickValue(row, ['VEHICLEKEYS'])) === 'Y',
    vehicleManuals: toText(pickValue(row, ['VEHICLEMANUALS'])) === 'Y',
    receivedByName: toText(pickValue(row, ['RECEIVEDBYNAME'])),
    receivedByMobile: toText(pickValue(row, ['RECEIVEDBYMOBILE'])),
    deliveredBy: toText(pickValue(row, ['DELIVEREDBY'])),
    signature: toText(pickValue(row, ['SIGNATURE'])),
    submittedAt: toText(pickValue(row, ['PODDATE'])),
  };
}

function mapVehicle(row: Row, fallbackId: string) {
  return {
    id: toText(pickValue(row, ['LINEID', 'ID'])) || fallbackId,
    serialNo: toNumber(pickValue(row, ['SNO', 'SLNO', 'SERIALNO'])),
    deliveryNo: toText(pickValue(row, ['DELNUM', 'DEL_NUM', 'DELIVERYNO', 'DNOTENO'])),
    soNo: toText(pickValue(row, ['SONO', 'SO_NO', 'SOREF'])),
    invoiceNo: toText(pickValue(row, ['INVNO', 'INV_NO', 'INVOICENO'])),
    vinNo: toText(pickValue(row, ['VINNO', 'VIN_NO', 'VINNUMBER'])),
    model: toText(pickValue(row, ['MODEL', 'MODELDESC', 'MODELDESCR'])),
    qty: toNumber(pickValue(row, ['QTY', 'QUANTITY'])),
  };
}

function mapDispatchRow(row: Row, index: number) {
  const hdSlno = toNumber(pickValue(row, ['HDSLNO', 'SLNO']));
  const dispatchNo =
    toText(pickValue(row, ['DISPATCHNO', 'DISPATCHREFNO', 'DISPATCH_NO'])) ||
    (hdSlno ? String(hdSlno) : '');
  const status = toText(pickValue(row, ['HDSTATUS', 'STATUS'])) || 'Confirmed';
  const receivedByName = toNullableText(pickValue(row, ['RECEIVEDBYNAME', 'RECEIVED_BY_NAME']));
  const submittedAt = toNullableText(pickValue(row, ['SUBMITTEDDATE', 'SUBMITTED_AT', 'PODDATE']));

  return {
    id: toText(pickValue(row, ['HDSLNO', 'SLNO'])) || dispatchNo || `dispatch-${index}`,
    hdSlno,
    dispatchNo,
    dispatchDate: toDateText(
      pickValue(row, ['DISPATCHDATE', 'DISPATCH_DATE', 'CREATEDDATE', 'LOGDATE'])
    ),
    sourceDNoteId: toText(pickValue(row, ['DNOTENO', 'DNOTE_NO'])) || dispatchNo,
    dNoteNo: toText(pickValue(row, ['DNOTENO', 'DNOTE_NO'])),
    dNoteDate: toDateText(pickValue(row, ['DNOTEDATE', 'DNDATE', 'DNOTE_DATE'])),
    customerCode: toText(pickValue(row, ['CARDCODE', 'CUSTOMERCODE', 'CUSTOMER_CODE'])),
    customerName: toText(pickValue(row, ['CARDNAME', 'CUSTOMERNAME', 'CUSTOMER_NAME'])),
    address: toText(pickValue(row, ['CUSTADDRESS', 'ADDRESS'])),
    soRef: toText(pickValue(row, ['SOREF', 'SONO', 'SO_NO'])),
    remarks: toText(pickValue(row, ['REMARKS'])),
    totalQty: toNumber(pickValue(row, ['QTY', 'TOTALQTY', 'TOTAL_QTY'])),
    status,
    createdAt: toText(pickValue(row, ['CREATEDDATE', 'LOGDATE', 'DISPATCHDATE'])) || new Date().toISOString(),
    updatedAt: toText(pickValue(row, ['UPDATEDDATE', 'LOGDATE', 'DISPATCHDATE'])) || new Date().toISOString(),
    vehicles: [],
    pod: receivedByName || submittedAt
      ? {
          invoice: false,
          insurance: false,
          warranty: false,
          deliveryCheckList: false,
          registrationPapers: false,
          vehicleKeys: false,
          vehicleManuals: false,
          receivedByName: receivedByName || '',
          receivedByMobile: '',
          deliveredBy: '',
          signature: '',
          submittedAt: submittedAt || '',
        }
      : undefined,
  };
}

function groupDNoteRows(rows: Row[]) {
  const grouped = new Map<string, any>();

  rows.forEach((row, index) => {
    const dNoteNo = toText(
      pickValue(row, ['DNOTENO', 'DNOTE_NO', 'DOCNUM', 'DELNUM', 'DEL_NUM'])
    );
    if (!dNoteNo) return;

    if (!grouped.has(dNoteNo)) {
      grouped.set(dNoteNo, {
        id: dNoteNo,
        hdSlno: toNumber(pickValue(row, ['HDSLNO', 'SLNO'])),
        dNoteNo,
        dNoteDate: toDateText(
          pickValue(row, ['DNOTEDATE', 'DNDATE', 'DNOTE_DATE', 'DOCUMENTDATE'])
        ),
        dndocEntry: toText(pickValue(row, ['DNDOCENTRY', 'DOCENTRY', 'DOCENTRY'])),
        customerCode: toText(pickValue(row, ['CARDCODE', 'CUSTOMERCODE', 'CUSTOMER_CODE'])),
        customerName: toText(pickValue(row, ['CARDNAME', 'CUSTOMERNAME', 'CUSTOMER_NAME'])),
        address: toText(pickValue(row, ['CUSTADDRESS', 'ADDRESS'])),
        salespersonName: toText(pickValue(row, ['SLPNAME', 'SALESPERSON'])),
        salespersonEmail: toText(pickValue(row, ['SLPEMAIL', 'SALESPERSONEMAIL'])),
        soRef: toText(pickValue(row, ['SOREF', 'SONO', 'SO_NO', 'NUMATCARD'])),
        remarks: toText(pickValue(row, ['REMARKS'])),
        totalQty: toNumber(pickValue(row, ['QTY', 'TOTALQTY', 'TOTAL_QTY'])),
        vehicles: [],
      });
    }

    const current = grouped.get(dNoteNo);
    const vin = toText(pickValue(row, ['VINNO', 'VIN_NO', 'VINNUMBER']));
    const model = toText(pickValue(row, ['MODEL', 'MODELDESC', 'MODELDESCR']));
    const invoiceNo = toText(pickValue(row, ['INVNO', 'INV_NO', 'INVOICENO']));
    const soNo = toText(pickValue(row, ['SONO', 'SO_NO']));
    const deliveryNo = toText(pickValue(row, ['DELNUM', 'DEL_NUM', 'DELIVERYNO', 'DNOTENO']));
    if (vin || model || invoiceNo || soNo || deliveryNo) {
      current.vehicles.push(mapVehicle(row, `${dNoteNo}-${index}`));
    }
  });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    totalQty: item.totalQty || item.vehicles.reduce((sum: number, vehicle: any) => sum + (vehicle.qty || 0), 0),
  }));
}

async function queryDispatchSp(queryType: string, arg1: string, arg2: string, arg3: string, arg4: string) {
  return db.query<Row>(getSpCallSql(DISPATCH_QUERY_SP, 5), [queryType, arg1, arg2, arg3, arg4]);
}

async function queryProcedureRows<T = Row>(sql: string, params: any[]): Promise<T[]> {
  const connection = (db as any).connection;
  const isConnected = (db as any).isConnected;

  if (!isConnected || !connection) {
    throw new Error('Not connected to database. Call connect() first.');
  }

  return new Promise((resolve, reject) => {
    hanaStream.createProcStatement(connection, sql, (prepareErr: Error | null, stmt: any) => {
      if (prepareErr) {
        reject(prepareErr);
        return;
      }

      stmt.exec(params, (execErr: Error | null, _scalarParams: any, ...tableParams: any[]) => {
        if (execErr) {
          stmt.drop(() => reject(execErr));
          return;
        }

        stmt.drop((dropErr: Error | null) => {
          if (dropErr) {
            reject(dropErr);
            return;
          }

          const firstTable = tableParams.find((table) => Array.isArray(table)) || [];
          resolve(firstTable as T[]);
        });
      });
    });
  });
}

async function getLatestPodByDispatchNo(dispatchNo: string) {
  try {
    const row = await db.queryOne<Row>(
      `SELECT * FROM ${DISPATCH_POD_TABLE}
       WHERE "DISPATCHNO" = ?
       ORDER BY "PODDATE" DESC, "SLNO" DESC
       LIMIT 1`,
      [dispatchNo]
    );

    return mapPodRow(row);
  } catch (error) {
    logger.warn({ error, dispatchNo }, 'Failed to fetch POD row for dispatch');
    return undefined;
  }
}

export async function getDispatchList(filters?: {
  dateFrom?: string;
  dateTo?: string;
  dispatchNo?: string;
  dNoteNo?: string;
}) {
  try {
    const rows = await queryDispatchSp(
      'MainGrid',
      filters?.dateFrom || '0',
      filters?.dateTo || '0',
      filters?.dispatchNo || '0',
      filters?.dNoteNo || '0'
    );

    const dispatches = rows.map((row, index) => mapDispatchRow(row, index));

    const enriched = await Promise.all(
      dispatches.map(async (dispatch) => {
        if (!dispatch.dispatchNo) return dispatch;

        try {
          const lineRows = await queryDispatchSp('DispatchDNotes', dispatch.dispatchNo, '0', '0', '0');
          const vehicles = lineRows.map((row, index) => ({
            ...mapVehicle(row, `${dispatch.dispatchNo}-${index}`),
            lineId: `${dispatch.dispatchNo}-${index}`,
            sourceVehicleId:
              toText(pickValue(row, ['VINNO', 'VIN_NO', 'VINNUMBER'])) ||
              `${dispatch.dispatchNo}-${index}`,
          }));

          const pod = await getLatestPodByDispatchNo(dispatch.dispatchNo);

          return {
            ...dispatch,
            vehicles,
            totalQty: dispatch.totalQty || vehicles.reduce((sum, vehicle) => sum + (vehicle.qty || 0), 0),
            pod,
            status: pod ? 'Dispatched' : dispatch.status,
          };
        } catch (lineError) {
          logger.warn({ lineError, dispatchNo: dispatch.dispatchNo }, 'Failed to fetch dispatch line rows for list item');
          return dispatch;
        }
      })
    );

    return enriched;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch dispatch list');
    throw new Error(`Failed to fetch dispatch list: ${String((error as any)?.message || error)}`);
  }
}

export async function getAvailableDNotes(filters?: {
  dateFrom?: string;
  dateTo?: string;
  dNoteNo?: string;
  search?: string;
}) {
  try {
    const rows = await queryDispatchSp(
      'DNotes',
      filters?.dateFrom || '0',
      filters?.dateTo || '0',
      filters?.dNoteNo || '0',
      '0'
    );

    let items = groupDNoteRows(rows);
    const search = toText(filters?.search).toLowerCase();
    if (search) {
      items = items.filter((item) =>
        item.dNoteNo.toLowerCase().includes(search) ||
        item.customerCode.toLowerCase().includes(search) ||
        item.customerName.toLowerCase().includes(search)
      );
    }

    return items;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch available dnotes');
    throw new Error(`Failed to fetch available dnotes: ${String((error as any)?.message || error)}`);
  }
}

export async function getDNoteByNo(dNoteNo: string) {
  const items = await getAvailableDNotes({ dNoteNo });
  const detail = items.find((item) => item.dNoteNo === dNoteNo) || items[0] || null;
  if (!detail) {
    throw new NotFoundError('Delivery note not found');
  }

  return detail;
}

export async function getDispatchByNo(dispatchNo: string) {
  try {
    const mainRows = await queryDispatchSp('MainGrid', '0', '0', dispatchNo, '0');
    if (!mainRows.length) {
      throw new NotFoundError('Dispatch not found');
    }

    const mainHeader = mapDispatchRow(mainRows[0]!, 0);
    const hdSlno = mainHeader.hdSlno || toNumber(pickValue(mainRows[0]!, ['HDSLNO', 'SLNO']));

    let headerRow = mainRows[0]!;
    if (hdSlno) {
      const detailRows = await queryDispatchSp('DispatchDetails', String(hdSlno), '0', '0', '0');
      if (detailRows.length) {
        headerRow = detailRows[0]!;
      }
    }

    const header = {
      ...mainHeader,
      ...mapDispatchRow(headerRow, 0),
      id: mainHeader.id,
      hdSlno: hdSlno || mainHeader.hdSlno,
      dispatchNo: mainHeader.dispatchNo,
      vehicles: [],
    };

    const lineRows = await queryDispatchSp('DispatchDNotes', dispatchNo, '0', '0', '0');
    const vehicles = lineRows.map((row, index) => ({
      ...mapVehicle(row, `${dispatchNo}-${index}`),
      lineId: `${dispatchNo}-${index}`,
      sourceVehicleId: toText(pickValue(row, ['VINNO', 'VIN_NO', 'VINNUMBER'])) || `${dispatchNo}-${index}`,
    }));

    const pod = await getLatestPodByDispatchNo(dispatchNo);

    return {
      ...header,
      vehicles,
      totalQty: header.totalQty || vehicles.reduce((sum, vehicle) => sum + (vehicle.qty || 0), 0),
      pod,
      status: pod ? 'Dispatched' : header.status,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ error, dispatchNo }, 'Failed to fetch dispatch detail');
    throw new Error(`Failed to fetch dispatch detail: ${String((error as any)?.message || error)}`);
  }
}

export async function createDispatch(data: {
  dispatchDate: string;
  dNoteNo: string;
  dndocEntry?: string;
  dNoteDate?: string;
  customerCode: string;
  customerName: string;
  address?: string;
  salespersonName?: string;
  salespersonEmail?: string;
  soRef?: string;
  qty: number;
  remarks?: string;
  vehicles: Array<{
    deliveryNo?: string;
    soNo?: string;
    invoiceNo?: string;
    vinNo: string;
    model?: string;
  }>;
  logUserId: string;
  logUserName: string;
}) {
  try {
    const headerParams = [
      0,
      data.dNoteNo,
      data.dndocEntry || '0',
      data.dNoteDate || data.dispatchDate,
      data.customerCode,
      data.customerName,
      data.address || '',
      data.salespersonName || data.logUserName || '',
      data.salespersonEmail || '',
      data.soRef || '',
      data.qty,
      data.remarks || '',
      'Confirmed',
      data.logUserId,
      data.logUserName,
      0,
    ];
    const headerInputParams = headerParams.slice(0, 15);

    let headerRows: Row[] = [];
    try {
      headerRows = await db.query<Row>(getSpCallSql(DISPATCH_CREATE_HEADER_SP, 16), headerParams);
    } catch (error) {
      const message = String((error as any)?.message || error || '').toLowerCase();
      if (
        !isTooManyParameterError(error) &&
        !message.includes('output_reqno is not bound')
      ) {
        throw error;
      }

      headerRows = await queryProcedureRows<Row>(
        getSpCallSql(DISPATCH_CREATE_HEADER_SP, 16),
        headerInputParams
      );
    }

    let headerSlno = toNumber(pickValue(headerRows[0] || {}, ['HDSLNO', 'SLNO']));
    let dispatchNo =
      toText(pickValue(headerRows[0] || {}, ['DISPATCHNO', 'DISPATCHREFNO', 'DISPATCH_NO'])) ||
      (headerSlno ? String(headerSlno) : '');

    if (!headerSlno || !dispatchNo) {
      const mainRows = await queryDispatchSp('MainGrid', data.dispatchDate, data.dispatchDate, '0', data.dNoteNo);
      if (mainRows.length) {
        const latest = mainRows
          .map((row, index) => ({ row, mapped: mapDispatchRow(row, index) }))
          .sort((a, b) => (b.mapped.hdSlno || 0) - (a.mapped.hdSlno || 0))[0];
        headerSlno = headerSlno || latest?.mapped.hdSlno || 0;
        dispatchNo = dispatchNo || latest?.mapped.dispatchNo || (headerSlno ? String(headerSlno) : '');
      }
    }

    if (!headerSlno) {
      throw new Error('Header dispatch SLNO was not returned from BI_VEHDISPATCH_20001');
    }

    for (const vehicle of data.vehicles) {
      await db.query(getSpCallSql(DISPATCH_CREATE_LINE_SP, 8), [
        headerSlno,
        data.dNoteNo,
        toDigitsText(vehicle.soNo),
        toDigitsText(vehicle.invoiceNo),
        vehicle.vinNo,
        vehicle.model || '',
        data.logUserId,
        data.logUserName,
      ]);
    }

    if (!dispatchNo) {
      const mainRows = await queryDispatchSp('MainGrid', data.dispatchDate, data.dispatchDate, '0', data.dNoteNo);
      const latest = mainRows
        .map((row, index) => ({ row, mapped: mapDispatchRow(row, index) }))
        .sort((a, b) => (b.mapped.hdSlno || 0) - (a.mapped.hdSlno || 0))[0];
      dispatchNo = latest?.mapped.dispatchNo || (headerSlno ? String(headerSlno) : '');
    }

    if (!dispatchNo) {
      throw new Error('Dispatch number was not returned after dispatch creation');
    }

    return getDispatchByNo(dispatchNo);
  } catch (error) {
    logger.error({ error, data }, 'Failed to create dispatch');
    throw new Error(`Failed to create dispatch: ${String((error as any)?.message || error)}`);
  }
}

export async function submitPODByDispatchNo(
  dispatchNo: string,
  pod: {
    invoice: boolean;
    insurance: boolean;
    warranty: boolean;
    deliveryCheckList: boolean;
    registrationPapers: boolean;
    vehicleKeys: boolean;
    vehicleManuals: boolean;
    receivedByName: string;
    receivedByMobile: string;
    deliveredBy: string;
    signature: string;
  },
  logUserId: string,
  logUserName: string
) {
  try {
    const normalizedProcedureName = normalizeProcedureName(DISPATCH_SAVE_POD_SP);
    const sql = `CALL "${DISPATCH_DB_SCHEMA}"."${normalizedProcedureName}"(
      ${quoteSqlString(dispatchNo)},
      ${quoteSqlString(toFlag(pod.invoice))},
      ${quoteSqlString(toFlag(pod.insurance))},
      ${quoteSqlString(toFlag(pod.warranty))},
      ${quoteSqlString(toFlag(pod.deliveryCheckList))},
      ${quoteSqlString(toFlag(pod.registrationPapers))},
      ${quoteSqlString(toFlag(pod.vehicleKeys))},
      ${quoteSqlString(toFlag(pod.vehicleManuals))},
      ${quoteSqlString(pod.receivedByName)},
      ${quoteSqlString(pod.receivedByMobile)},
      ${quoteSqlString(pod.deliveredBy)},
      ${quoteSqlString(pod.signature)},
      ${quoteSqlString(logUserId)},
      ${quoteSqlString(logUserName)}
    )`;

    await db.query(sql);
    return getDispatchByNo(dispatchNo);
  } catch (error) {
    logger.error({ error, dispatchNo, pod }, 'Failed to submit POD');
    throw new Error(`Failed to submit POD: ${String((error as any)?.message || error)}`);
  }
}
