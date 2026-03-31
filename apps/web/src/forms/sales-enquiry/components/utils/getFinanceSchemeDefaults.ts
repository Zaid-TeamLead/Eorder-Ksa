/**
 * Utility for Finance Scheme Dialog default values
 */

interface FinanceSchemeData {
  LENDER_CODE?: string;
  CURRENCY?: string;
  VEHICLE_PRICE?: number;
  TERM_MONTHS?: number;
  DOWNPAYMENT?: number;
  TRADE_IN_VALUE?: number;
  INTEREST_RATE?: number;
  FDA?: number;
  GPV_BALLOON?: number;
  SALE_CODE?: string;
}

export interface FinanceSchemeFormData {
  lenderCode: string;
  currency: string;
  vehiclePrice: string;
  term: string;
  downpayment: string;
  tradeInValue: string;
  interestRate: string;
  fda: string;
  gpvBalloon: string;
  salesEmployeeName: string;
  saleCode: string;
}

function toOptionalNumber(value: string): number | undefined {
  const normalized = String(value || "").trim();
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toRequiredInteger(value: string): number {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

/**
 * Transforms API data (UPPERCASE) to form data (camelCase)
 * Handles number to string conversion with proper defaults
 *
 * @param data - API finance scheme data or undefined
 * @returns Form-ready finance scheme data
 */
export function getFinanceSchemeDefaults(
  data?: FinanceSchemeData
): FinanceSchemeFormData {
  return {
    lenderCode: data?.LENDER_CODE ?? '',
    currency: data?.CURRENCY ?? '',
    vehiclePrice: data?.VEHICLE_PRICE?.toString() ?? '',
    term: data?.TERM_MONTHS?.toString() ?? '12',
    downpayment: data?.DOWNPAYMENT?.toString() ?? '',
    tradeInValue: data?.TRADE_IN_VALUE?.toString() ?? '',
    interestRate: data?.INTEREST_RATE?.toString() ?? '',
    fda: data?.FDA?.toString() ?? '',
    gpvBalloon: data?.GPV_BALLOON?.toString() ?? '',
    salesEmployeeName: '',
    saleCode: data?.SALE_CODE ?? '',
  };
}

/**
 * Transforms form data to API submission format
 * Handles string to number conversion with validation
 *
 * @param formData - Form data to transform
 * @param lenderName - Lender name from selected lender
 * @returns API-ready finance scheme data
 */
export function transformFinanceSchemeToApi(
  formData: FinanceSchemeFormData,
  lenderName: string
) {
  return {
    lenderCode: formData.lenderCode,
    lenderName,
    currency: formData.currency,
    vehiclePrice: toOptionalNumber(formData.vehiclePrice),
    termMonths: toRequiredInteger(formData.term),
    downpayment: toOptionalNumber(formData.downpayment),
    tradeInValue: toOptionalNumber(formData.tradeInValue),
    interestRate: toOptionalNumber(formData.interestRate),
    fda: toOptionalNumber(formData.fda),
    gpvBalloon: toOptionalNumber(formData.gpvBalloon),
    saleCode: formData.saleCode,
  };
}
