'use client';

type SalesReportType = 'SalesQuote' | 'SalesOrder';

const SALES_REPORT_BASE_URL = 'https://bi.neweast.cloud/reportsisuzu.aspx';
const SALES_REPORT_FROM_DATE = '2024-01-01';

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractReportReference(input: unknown): string {
  if (input === undefined || input === null) {
    return '';
  }

  if (typeof input === 'string' || typeof input === 'number') {
    return String(input).trim();
  }

  if (typeof input !== 'object') {
    return '';
  }

  const record = input as Record<string, unknown>;
  const value =
    record.DocEntry ??
    record.DOCENTRY ??
    record.docEntry ??
    record.SLNO ??
    record.id;

  return value === undefined || value === null ? '' : String(value).trim();
}

export function buildSalesReportUrl(params: {
  referenceNumber: string | number;
  type: SalesReportType;
  fromDate?: string;
  toDate?: string;
}): string {
  const query = new URLSearchParams({
    rEfNo: String(params.referenceNumber),
    frmDate: params.fromDate || SALES_REPORT_FROM_DATE,
    toDate: params.toDate || getTodayDateString(),
    Type: params.type,
  });

  return `${SALES_REPORT_BASE_URL}?${query.toString()}`;
}

export function openSalesReport(params: {
  item: unknown;
  type: SalesReportType;
  fromDate?: string;
  toDate?: string;
}): boolean {
  const referenceNumber = extractReportReference(params.item);
  if (!referenceNumber) {
    return false;
  }

  const url = buildSalesReportUrl({
    referenceNumber,
    type: params.type,
    fromDate: params.fromDate,
    toDate: params.toDate,
  });

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
