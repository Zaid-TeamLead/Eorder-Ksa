import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getEnquiryById } from '@/services/enquiry';
import { getQuotationById } from '@/services/quotation';
import type { SalesEnquiry } from '@/types/enquiry';
import type { QuotationWithLineItems } from '@/types/quotation';
import type { QuotationFormData } from '@/forms/quotation/schema';
import { logger } from '@/lib/logger';

interface UseQuotationFormDataParams {
  enquiryId?: string | null;
  supersedeId?: string | null;
  enquiryPrefillKey?: string | null;
  enquiryPrefillData?: string | null;
  onDataLoaded?: (data: QuotationFormData) => void;
}

function extractVinFromUnknown(input: unknown): string {
  if (!input || typeof input !== 'object') return '';

  const record = input as Record<string, unknown>;
  const directKeys = [
    'VINNUMBER',
    'VIN',
    'vinNumber',
    'vin',
    'U_Veh_StockID',
    'u_veh_stockid',
  ];

  for (const key of directKeys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  const dynamicMatch = Object.entries(record).find(([key, value]) => {
    if (value === undefined || value === null) return false;
    if (String(value).trim() === '') return false;
    return key.toLowerCase().includes('vin');
  });

  return dynamicMatch ? String(dynamicMatch[1]).trim() : '';
}

function toOptionalString(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function sanitizeEmail(value: unknown): string {
  const email = toOptionalString(value);
  if (!email) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function parseNumberLoose(value: unknown): number {
  if (value === undefined || value === null) return 0;
  const normalized = String(value)
    .replace(/,/g, '')
    .replace(/[^0-9.-]/g, '')
    .trim();
  if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickField(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) return record[key];
  }
  return undefined;
}

function normalizeVinDetails(input: unknown): Record<string, unknown> {
  if (!input) return {};
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  if (typeof input === 'object') {
    return input as Record<string, unknown>;
  }
  return {};
}

function extractPricingFromVinDetails(vinDetailsInput: unknown) {
  const vinDetails = normalizeVinDetails(vinDetailsInput);

  const basePrice = parseNumberLoose(
    pickField(vinDetails, ['Price', 'PRICE', 'Amount', 'AMOUNT', 'UnitPrice', 'UNITPRICE'])
  );
  const discountedPrice = parseNumberLoose(
    pickField(vinDetails, [
      'Discprice',
      'DISCPRICE',
      'DiscountPrice',
      'DISCOUNTPRICE',
      'NetPrice',
      'NETPRICE',
      'AmountAfterDiscount',
      'AMOUNTAFTERDISCOUNT',
    ])
  );
  const discountRaw = toOptionalString(
    pickField(vinDetails, ['Discount', 'DISCOUNT', 'DiscPrcnt', 'DISCPRCNT', 'DiscPercent'])
  );

  let vehicleDiscount = 0; // kept negative for quotation calculations

  if (basePrice > 0 && discountedPrice > 0) {
    const delta = discountedPrice - basePrice;
    vehicleDiscount = delta <= 0 ? delta : 0;
  } else if (basePrice > 0 && discountRaw) {
    if (discountRaw.includes('%')) {
      const pct = parseNumberLoose(discountRaw);
      if (pct > 0) {
        vehicleDiscount = -((basePrice * pct) / 100);
      }
    } else {
      const discountNumeric = parseNumberLoose(discountRaw);
      if (discountNumeric !== 0) {
        vehicleDiscount = discountNumeric > 0 ? -discountNumeric : discountNumeric;
      }
    }
  }

  const vehicleNetPrice =
    basePrice > 0
      ? Math.max(0, basePrice + vehicleDiscount)
      : discountedPrice > 0
        ? discountedPrice
        : 0;

  const discountPercentage =
    basePrice > 0 && vehicleDiscount < 0
      ? parseFloat(((Math.abs(vehicleDiscount) / basePrice) * 100).toFixed(2))
      : 0;

  return {
    basePrice,
    vehicleDiscount,
    vehicleNetPrice,
    discountPercentage,
  };
}

function getVehicleField(vehicleInput: unknown, keys: string[]): string {
  const vehicle = normalizeVinDetails(vehicleInput);
  for (const key of keys) {
    const value = vehicle[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function getSelectedVehicleLines(vinDetailsInput: unknown) {
  const vinDetails = normalizeVinDetails(vinDetailsInput);
  const lines = vinDetails.SELECTED_VEHICLE_LINES;

  if (!Array.isArray(lines)) {
    return [];
  }

  return lines
    .map((line) => {
      if (!line || typeof line !== 'object') return null;
      const record = line as Record<string, unknown>;
      const vin =
        record.vin && typeof record.vin === 'object'
          ? (record.vin as Record<string, unknown>)
          : null;
      if (!vin) return null;

      const quantity = Number(record.quantity);
      return {
        vin,
        vinValue: toOptionalString(record.vinValue) || extractVinFromUnknown(vin),
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      };
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));
}

function buildQuotationVehicleLineItems(enquiryData: SalesEnquiry) {
  const enquiryVinDetails = enquiryData.VINDETAILS as string | Record<string, unknown> | undefined;
  const selectedLines = getSelectedVehicleLines(enquiryVinDetails);

  if (selectedLines.length === 0) {
    const quantity = Number(enquiryData.QUANTITY) > 0 ? Number(enquiryData.QUANTITY) : 1;
    const pricing = extractPricingFromVinDetails(enquiryVinDetails);

    return {
      primaryVehicle: {
        make: enquiryData.MAKE || '',
        model: enquiryData.MODEL || '',
        variant: enquiryData.VARIANT || '',
        year: enquiryData.YEAR || '',
        color: enquiryData.COLOR || '',
        vinNumber: enquiryData.VINNUMBER || extractVinFromUnknown(enquiryVinDetails) || '',
      },
      pricing,
      lineItems: [
        {
          lineNumber: 1,
          itemType: 'Vehicle' as const,
          itemCode: enquiryData.VARIANT || '',
          itemDescription: `${enquiryData.MAKE || ''} ${enquiryData.MODEL || ''} ${enquiryData.VARIANT || ''}`.trim(),
          quantity,
          unitPrice: pricing.basePrice,
          discountAmount: pricing.vehicleDiscount,
          discountPercentage: pricing.discountPercentage,
          netPrice: parseFloat((quantity * pricing.vehicleNetPrice).toFixed(2)),
          manufacturer: enquiryData.MAKE || '',
          notes: enquiryData.VINNUMBER || '',
        },
      ],
      totals: {
        basePrice: pricing.basePrice,
        discount: pricing.vehicleDiscount,
        netPrice: parseFloat((quantity * pricing.vehicleNetPrice).toFixed(2)),
      },
    };
  }

  const lineItems = selectedLines.map((line, index) => {
    const pricing = extractPricingFromVinDetails(line.vin);
    const make =
      getVehicleField(line.vin, ['U_Veh_Brand', 'U_VEH_BRAND', 'Brand', 'BRAND', 'MAKENAME', 'MAKE', 'Make', 'ItmsGrpNam']) ||
      enquiryData.MAKE ||
      '';
    const model =
      getVehicleField(line.vin, ['U_Veh_ModelDescr', 'U_Veh_ModelFull', 'U_Veh_Model', 'U_VEH_MODEL', 'Model Description', 'MODEL', 'Model']) ||
      enquiryData.MODEL ||
      '';
    const variant =
      getVehicleField(line.vin, ['ItemCode', 'ITEMCODE', 'ProductCode', 'PRODUCTCODE']) ||
      enquiryData.VARIANT ||
      '';

    return {
      lineNumber: index + 1,
      itemType: 'Vehicle' as const,
      itemCode: variant,
      itemDescription: `${make} ${model} ${variant}`.trim(),
      quantity: line.quantity,
      unitPrice: pricing.basePrice,
      discountAmount: pricing.vehicleDiscount,
      discountPercentage: pricing.discountPercentage,
      netPrice: parseFloat((line.quantity * pricing.vehicleNetPrice).toFixed(2)),
      manufacturer: make,
      notes: line.vinValue,
    };
  });

  const firstVehicle = selectedLines[0];
  const primaryPricing = extractPricingFromVinDetails(firstVehicle.vin);
  const totals = lineItems.reduce(
    (acc, item) => {
      acc.basePrice += Number(item.unitPrice) * Number(item.quantity);
      acc.discount += Number(item.discountAmount) * Number(item.quantity);
      acc.netPrice += Number(item.netPrice);
      return acc;
    },
    { basePrice: 0, discount: 0, netPrice: 0 }
  );

  return {
    primaryVehicle: {
      make:
        getVehicleField(firstVehicle.vin, ['U_Veh_Brand', 'U_VEH_BRAND', 'Brand', 'BRAND', 'MAKENAME', 'MAKE', 'Make', 'ItmsGrpNam']) ||
        enquiryData.MAKE ||
        '',
      model:
        getVehicleField(firstVehicle.vin, ['U_Veh_ModelDescr', 'U_Veh_ModelFull', 'U_Veh_Model', 'U_VEH_MODEL', 'Model Description', 'MODEL', 'Model']) ||
        enquiryData.MODEL ||
        '',
      variant:
        getVehicleField(firstVehicle.vin, ['ItemCode', 'ITEMCODE', 'ProductCode', 'PRODUCTCODE']) ||
        enquiryData.VARIANT ||
        '',
      year:
        getVehicleField(firstVehicle.vin, ['U_Veh_MY', 'U_VEH_MY', 'Model Year', 'MODELYEAR', 'YEAR', 'Year']) ||
        enquiryData.YEAR ||
        '',
      color:
        getVehicleField(firstVehicle.vin, ['U_Veh_Color', 'U_VEH_COLOR', 'COLOR', 'Color']) ||
        enquiryData.COLOR ||
        '',
      vinNumber: firstVehicle.vinValue || extractVinFromUnknown(firstVehicle.vin),
    },
    pricing: primaryPricing,
    lineItems,
    totals: {
      basePrice: parseFloat(totals.basePrice.toFixed(2)),
      discount: parseFloat(totals.discount.toFixed(2)),
      netPrice: parseFloat(totals.netPrice.toFixed(2)),
    },
  };
}

/**
 * Custom hook for loading and preparing quotation form data
 * Handles both create-from-enquiry and supersede flows
 */
export function useQuotationFormData({
  enquiryId,
  supersedeId,
  enquiryPrefillKey,
  enquiryPrefillData,
  onDataLoaded,
}: UseQuotationFormDataParams) {
  const isSuperseding = !!supersedeId;
  const [enquiry, setEnquiry] = useState<SalesEnquiry | null>(null);
  const [parentQuotation, setParentQuotation] = useState<QuotationWithLineItems | null>(null);
  const [isLoadingEnquiry, setIsLoadingEnquiry] = useState(!isSuperseding);
  const [isLoadingParent, setIsLoadingParent] = useState(isSuperseding);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isSuperseding && supersedeId) {
      loadParentQuotation(parseInt(supersedeId));
    } else if (enquiryId) {
      loadEnquiryData(parseInt(enquiryId));
    } else {
      setIsLoadingEnquiry(false);
      setIsLoadingParent(false);
      setError(new Error('No enquiry ID or quotation ID provided'));
      toast.error('No enquiry ID or quotation ID provided');
    }
  }, [enquiryId, supersedeId, isSuperseding, enquiryPrefillKey, enquiryPrefillData]);

  const populateFormFromEnquiry = (enquiryData: SalesEnquiry, id: number) => {
    setEnquiry(enquiryData);
    const enquiryVinDetails = enquiryData.VINDETAILS as string | Record<string, unknown> | undefined;
    let vinFromDetails = '';
    if (typeof enquiryVinDetails === 'string') {
      try {
        vinFromDetails = extractVinFromUnknown(JSON.parse(enquiryVinDetails));
      } catch {
        vinFromDetails = '';
      }
    } else {
      vinFromDetails = extractVinFromUnknown(enquiryVinDetails);
    }
    const enquiryRecord = enquiryData as unknown as Record<string, unknown>;
    const rawVinNumber = enquiryRecord.vinNumber;
    const vinFromRecord =
      rawVinNumber !== undefined && rawVinNumber !== null && String(rawVinNumber).trim() !== ''
        ? String(rawVinNumber).trim()
        : '';
    const vehicleData = buildQuotationVehicleLineItems(enquiryData);
    const taxRate = 15;
    const subtotal = vehicleData.totals.netPrice;
    const taxAmount = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
    const grandTotal = parseFloat((subtotal + taxAmount).toFixed(2));

    const formData: QuotationFormData = {
      enquirySlno: id,
      customerName: enquiryData.CUSTOMERNAME || '',
      customerMobile: enquiryData.MOBILE || '',
      customerEmail: sanitizeEmail(enquiryData.HOMEEMAIL),
      customerAddress: enquiryData.ADDRESS || '',
      vehicleMake: vehicleData.primaryVehicle.make,
      vehicleModel: vehicleData.primaryVehicle.model,
      vehicleVariant: vehicleData.primaryVehicle.variant,
      vehicleYear: vehicleData.primaryVehicle.year,
      vehicleColor: vehicleData.primaryVehicle.color,
      vinNumber:
        vehicleData.primaryVehicle.vinNumber ||
        enquiryData.VINNUMBER ||
        vinFromRecord ||
        vinFromDetails ||
        '',
      vehicleBasePrice: vehicleData.totals.basePrice,
      vehicleDiscount: vehicleData.totals.discount,
      vehicleNetPrice: vehicleData.totals.netPrice,
      accessoriesTotal: 0,
      accessoriesDiscount: 0,
      accessoriesNetTotal: 0,
      warrantyTotal: 0,
      insuranceTotal: 0,
      subtotal,
      taxRate,
      taxAmount,
      grandTotal,
      tradeInValue: 0,
      downpayment: 0,
      netAmountDue: grandTotal,
      totalDiscountAmount: vehicleData.totals.discount,
      discountPercentage:
        vehicleData.totals.basePrice > 0 && vehicleData.totals.discount < 0
          ? parseFloat(
              ((Math.abs(vehicleData.totals.discount) / vehicleData.totals.basePrice) * 100).toFixed(2)
            )
          : 0,
      validUntil: '',
      notes: '',
      termsAndConditions: '',
      internalNotes: '',
      lineItems: vehicleData.lineItems,
    };

    onDataLoaded?.(formData);
  };

  const loadEnquiryData = async (id: number) => {
    try {
      setIsLoadingEnquiry(true);
      setError(null);
      if (enquiryPrefillKey && typeof window !== 'undefined') {
        const storedPrefill = window.sessionStorage.getItem(enquiryPrefillKey);
        if (storedPrefill) {
          try {
            const parsed = JSON.parse(storedPrefill) as SalesEnquiry;
            populateFormFromEnquiry(parsed, id);
            window.sessionStorage.removeItem(enquiryPrefillKey);
            return;
          } catch {
            window.sessionStorage.removeItem(enquiryPrefillKey);
          }
        }
      }

      if (enquiryPrefillData) {
        try {
          const parsed = JSON.parse(decodeURIComponent(enquiryPrefillData)) as SalesEnquiry;
          populateFormFromEnquiry(parsed, id);
          return;
        } catch {
          // Ignore invalid query prefill and continue with API fallback.
        }
      }

      const enquiryData = await getEnquiryById(id);
      populateFormFromEnquiry(enquiryData, id);
    } catch (err) {
      logger.error('Error loading enquiry:', err);
      setError(err as Error);
      toast.error('Failed to load enquiry data');
    } finally {
      setIsLoadingEnquiry(false);
    }
  };

  const loadParentQuotation = async (id: number) => {
    try {
      setIsLoadingParent(true);
      setError(null);
      const quotationData = await getQuotationById(id);


      setParentQuotation(quotationData);

      // Validate required field
      if (!quotationData?.ENQUIRY_SLNO) {
        logger.error('Missing ENQUIRY_SLNO in quotation data:', quotationData);
        throw new Error('Parent quotation is missing ENQUIRY_SLNO field. Cannot create new version.');
      }

      // Prepare form data from parent quotation
      const formData: QuotationFormData = {
        enquirySlno: Number(quotationData.ENQUIRY_SLNO),
        customerName: quotationData.CUSTOMER_NAME || '',
        customerMobile: quotationData.CUSTOMER_MOBILE || '',
        customerEmail: quotationData.CUSTOMER_EMAIL || '',
        customerAddress: quotationData.CUSTOMER_ADDRESS || '',
        vehicleMake: quotationData.VEHICLE_MAKE || '',
        vehicleModel: quotationData.VEHICLE_MODEL || '',
        vehicleVariant: quotationData.VEHICLE_VARIANT || '',
        vehicleYear: quotationData.VEHICLE_YEAR || '',
        vehicleColor: quotationData.VEHICLE_COLOR || '',
        vinNumber: quotationData.VIN_NUMBER || '',
        vehicleBasePrice: Number(quotationData.VEHICLE_BASE_PRICE) || 0,
        vehicleDiscount: Number(quotationData.VEHICLE_DISCOUNT) || 0,
        vehicleNetPrice: Number(quotationData.VEHICLE_NET_PRICE) || 0,
        accessoriesTotal: Number(quotationData.ACCESSORIES_TOTAL) || 0,
        accessoriesDiscount: Number(quotationData.ACCESSORIES_DISCOUNT) || 0,
        accessoriesNetTotal: Number(quotationData.ACCESSORIES_NET_TOTAL) || 0,
        warrantyTotal: Number(quotationData.WARRANTY_TOTAL) || 0,
        insuranceTotal: Number(quotationData.INSURANCE_TOTAL) || 0,
        subtotal: Number(quotationData.SUBTOTAL) || 0,
        taxRate: Number(quotationData.TAX_RATE) || 15,
        taxAmount: Number(quotationData.TAX_AMOUNT) || 0,
        grandTotal: Number(quotationData.GRAND_TOTAL) || 0,
        tradeInValue: Number(quotationData.TRADE_IN_VALUE) || 0,
        downpayment: Number(quotationData.DOWNPAYMENT) || 0,
        netAmountDue: Number(quotationData.NET_AMOUNT_DUE) || 0,
        totalDiscountAmount: Number(quotationData.TOTAL_DISCOUNT_AMOUNT) || 0,
        discountPercentage: Number(quotationData.DISCOUNT_PERCENTAGE) || 0,
        validUntil: quotationData.VALID_UNTIL || '',
        notes: quotationData.NOTES || '',
        termsAndConditions: quotationData.TERMS_AND_CONDITIONS || '',
        internalNotes: quotationData.INTERNAL_NOTES || '',
        lineItems:
          quotationData.lineItems?.map((item, index) => ({
            lineNumber: index + 1,
            itemType: 'Vehicle' as const,
            itemCode: item.ITEM_CODE || '',
            itemDescription: item.ITEM_DESCRIPTION || '',
            itemCategory: item.ITEM_CATEGORY || '',
            quantity: Number(item.QUANTITY) || 1,
            unitPrice: Number(item.UNIT_PRICE) || 0,
            discountAmount: Number(item.DISCOUNT_AMOUNT) || 0,
            discountPercentage: Number(item.DISCOUNT_PERCENTAGE) || 0,
            netPrice: Number(item.NET_PRICE) || 0,
            taxIncluded: item.TAX_INCLUDED || 'N',
            manufacturer: item.MANUFACTURER || '',
            partNumber: item.PART_NUMBER || '',
            warrantyPeriod: item.WARRANTY_PERIOD || '',
            notes: item.NOTES || '',
          })) || [],
      };

      onDataLoaded?.(formData);
    } catch (err) {
      logger.error('Error loading parent quotation:', err);
      setError(err as Error);
      toast.error('Failed to load quotation data');
    } finally {
      setIsLoadingParent(false);
    }
  };

  return {
    isLoading: isLoadingEnquiry || isLoadingParent,
    isLoadingEnquiry,
    isLoadingParent,
    enquiry,
    parentQuotation,
    error,
    isSuperseding,
  };
}
