/**
 * Utility for Finance Scheme Dialog default values
 */

interface FinanceSchemeData {
  LENDER_CODE?: string;
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
  vehiclePrice: string;
  term: string;
  downpayment: string;
  tradeInValue: string;
  interestRate: string;
  fda: string;
  gpvBalloon: string;
  saleCode: string;
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
    vehiclePrice: data?.VEHICLE_PRICE?.toString() ?? '',
    term: data?.TERM_MONTHS?.toString() ?? '',
    downpayment: data?.DOWNPAYMENT?.toString() ?? '',
    tradeInValue: data?.TRADE_IN_VALUE?.toString() ?? '',
    interestRate: data?.INTEREST_RATE?.toString() ?? '',
    fda: data?.FDA?.toString() ?? '',
    gpvBalloon: data?.GPV_BALLOON?.toString() ?? '',
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
    vehiclePrice: formData.vehiclePrice ? parseFloat(formData.vehiclePrice) : undefined,
    termMonths: parseInt(formData.term, 10),
    downpayment: formData.downpayment ? parseFloat(formData.downpayment) : undefined,
    tradeInValue: formData.tradeInValue ? parseFloat(formData.tradeInValue) : undefined,
    interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
    fda: formData.fda ? parseFloat(formData.fda) : undefined,
    gpvBalloon: formData.gpvBalloon ? parseFloat(formData.gpvBalloon) : undefined,
    saleCode: formData.saleCode,
  };
}
