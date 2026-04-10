import { useEnquiryMutations } from '../entities/useEnquiryMutations';
import type { SalesEnquiryFormSubmission } from '@/forms/sales-enquiry';
import type { CreateEnquiryData, SalesEnquiry } from '@/types/enquiry';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface UseEnquiryFormSubmitParams {
  isEditMode: boolean;
  selectedEntity: SalesEnquiry | null;
  onSuccess?: () => void;
}

export interface UseEnquiryFormSubmitReturn {
  handleSubmit: (data: SalesEnquiryFormSubmission) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Transform form data to API payload format
 */
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

function toOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized || undefined;
}

function toNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
}

function toPositiveNumber(value: unknown): number | undefined {
  const normalized = toNumber(value);
  if (normalized === undefined) return undefined;
  return normalized > 0 ? normalized : undefined;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeEmail(value: unknown): string | undefined {
  const normalized = toOptionalString(value);
  if (!normalized) return undefined;
  return isValidEmail(normalized) ? normalized : undefined;
}

function normalizeEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[]
): T | undefined {
  const normalized = toOptionalString(value)?.toLowerCase();
  if (!normalized) return undefined;
  return allowedValues.includes(normalized as T) ? (normalized as T) : undefined;
}

function sanitizeVinDetails(input: unknown): Record<string, unknown> | undefined {
  if (!input || typeof input !== 'object') return undefined;

  const source = input as Record<string, unknown>;
  const pick = (keys: string[]) => {
    for (const key of keys) {
      if (key in source) return source[key];
    }
    return undefined;
  };

  const sanitized = {
    ...source,
    Location: toOptionalString(pick(['Location', 'LOCATION'])),
    VIN: toOptionalString(
      pick(['VIN', 'VINNUMBER', 'vin', 'vinNumber', 'U_Veh_StockID', 'U_VEH_STOCKID'])
    ),
    WhsCode: toOptionalString(pick(['WhsCode', 'WHSCODE'])),
    WhsName: toOptionalString(pick(['WhsName', 'WHSNAME'])),
    ItemCode: toOptionalString(pick(['ItemCode', 'ITEMCODE', 'ProductCode', 'PRODUCTCODE'])),
    InDate: toOptionalString(pick(['InDate', 'INDATE'])),
    U_Veh_StockID: toNullableString(pick(['U_Veh_StockID', 'U_VEH_STOCKID'])),
    U_Veh_Brand: toNullableString(
      pick(['U_Veh_Brand', 'U_VEH_BRAND', 'Brand', 'BRAND', 'MAKENAME', 'MAKE', 'Make', 'ItmsGrpNam'])
    ),
    U_Veh_Model: toNullableString(
      pick(['U_Veh_Model', 'U_VEH_MODEL', 'MODEL', 'Model', 'U_Veh_ModelFull', 'U_Veh_ModelDescr'])
    ),
    U_Veh_Color: toNullableString(pick(['U_Veh_Color', 'U_VEH_COLOR', 'Color', 'COLOR'])),
    U_Veh_Transmutation: toNullableString(
      pick(['U_Veh_Transmutation', 'U_VEH_TRANSMUTATION'])
    ),
    U_Veh_ModelDescr: toNullableString(
      pick(['U_Veh_ModelDescr', 'U_VEH_MODELDESCR', 'Model Description', 'DESCRIPTION', 'Description'])
    ),
    U_Veh_ModelFull: toNullableString(pick(['U_Veh_ModelFull', 'U_VEH_MODELFULL'])),
    U_Veh_EngineNo: toNullableString(pick(['U_Veh_EngineNo', 'U_VEH_ENGINENO'])),
    U_Veh_MY: toNullableString(pick(['U_Veh_MY', 'U_VEH_MY', 'Model Year', 'MODELYEAR', 'YEAR', 'Year'])),
    U_Vehicle_MC: toNullableString(pick(['U_Vehicle_MC', 'U_VEHICLE_MC', 'Model Code'])),
    U_Veh_OrderNo: toNullableString(pick(['U_Veh_OrderNo', 'U_VEH_ORDERNO'])),
    U_Veh_DispDate: toNullableString(pick(['U_Veh_DispDate', 'U_VEH_DISPDATE', 'Display Date'])),
    U_Veh_IC: toNullableString(pick(['U_Veh_IC', 'U_VEH_IC'])),
    AgeinDays: toNumber(pick(['AgeinDays', 'AGEINDAYS', 'Age (Days)'])),
    Price: toOptionalString(pick(['Price', 'PRICE', 'Amount', 'AMOUNT', 'UnitPrice'])),
    Discount: toNullableString(pick(['Discount', 'DISCOUNT', 'DiscPrcnt', 'DISCPRCNT'])),
    Discprice: toNullableString(
      pick(['Discprice', 'DISCPRICE', 'DiscountPrice', 'DISCOUNTPRICE', 'NetPrice'])
    ),
    Currency: toOptionalString(pick(['Currency', 'CURRENCY', 'Curr', 'CURR'])),
  };

  const hasValues = Object.values(sanitized).some((value) => value !== undefined);
  return hasValues ? sanitized : undefined;
}

function sanitizeSelectedVehicleLines(
  lines: SalesEnquiryFormSubmission["selectedVehicleLines"]
): Array<{
  selectionKey: string;
  vinValue: string;
  quantity: number;
  vin: Record<string, unknown>;
}> {
  return (lines || [])
    .map((line, index) => {
      const sanitizedVin = sanitizeVinDetails(line?.vin);
      const vinValue = toOptionalString(line?.vinValue || extractVinFromUnknown(line?.vin)) || "";
      const quantity = toPositiveNumber(line?.quantity) || 1;
      const selectionKey =
        toOptionalString(line?.selectionKey) ||
        `${vinValue || "NO-VIN"}-${index + 1}`;

      if (!sanitizedVin || !vinValue) {
        return null;
      }

      return {
        selectionKey,
        vinValue,
        quantity,
        vin: sanitizedVin,
      };
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));
}

function buildAggregatedVinDetails(
  data: SalesEnquiryFormSubmission
): Record<string, unknown> | undefined {
  const primaryVinDetails = sanitizeVinDetails(data.vinDetails);
  const selectedLines = sanitizeSelectedVehicleLines(data.selectedVehicleLines);

  if (selectedLines.length === 0) {
    return primaryVinDetails;
  }

  const firstVehicle = selectedLines[0]?.vin;
  return {
    ...(primaryVinDetails || firstVehicle || {}),
    SELECTED_VEHICLE_LINES: selectedLines,
  };
}

function transformEnquiryFormData(
  data: SalesEnquiryFormSubmission
): CreateEnquiryData {
  const primaryCartItem = data.cartItems?.[0];
  const selectedLines = sanitizeSelectedVehicleLines(data.selectedVehicleLines);
  const aggregatedVinDetails = buildAggregatedVinDetails(data);
  const totalQuantity =
    selectedLines.length > 0
      ? selectedLines.reduce((sum, line) => sum + (line.quantity || 0), 0)
      : undefined;
  const primarySelectedLine = selectedLines[0];
  const primarySelectedVehicle = primarySelectedLine?.vin;
  const resolvedVinNumber =
    primarySelectedLine?.vinValue ||
    data.vinNumber ||
    extractVinFromUnknown(data.vinDetails) ||
    primaryCartItem?.vinNumber ||
    '';

  return {
    customerId: toOptionalString(data.customerId),
    customerName: toOptionalString(data.customerName) || '',
    address: toOptionalString(data.address),
    postcode: toOptionalString(data.postcode),
    homePhone: toOptionalString(data.homePhone),
    workPhone: toOptionalString(data.workPhone),
    mobile: toOptionalString(data.mobile) || '',
    homeEmail: sanitizeEmail(data.homeEmail),
    make:
      toOptionalString(
        data.make ||
          pickFromVehicle(primarySelectedVehicle, [
            'U_Veh_Brand',
            'U_VEH_BRAND',
            'Brand',
            'BRAND',
            'ItmsGrpNam',
            'MAKE',
            'Make',
          ]) ||
          primaryCartItem?.make
      ) || '',
    model:
      toOptionalString(
        data.model ||
          pickFromVehicle(primarySelectedVehicle, [
            'U_Veh_ModelDescr',
            'U_Veh_ModelFull',
            'U_Veh_Model',
            'U_VEH_MODEL',
            'Model Description',
            'MODEL',
            'Model',
          ]) ||
          primaryCartItem?.model
      ) || '',
    variant: toOptionalString(
      data.variant ||
        pickFromVehicle(primarySelectedVehicle, ['ItemCode', 'ITEMCODE', 'ProductCode', 'PRODUCTCODE']) ||
        primaryCartItem?.variant ||
        primaryCartItem?.itemCode
    ),
    year: toOptionalString(
      data.year ||
        pickFromVehicle(primarySelectedVehicle, ['U_Veh_MY', 'U_VEH_MY', 'Model Year', 'MODELYEAR', 'YEAR', 'Year']) ||
        primaryCartItem?.year
    ),
    color: toOptionalString(
      data.color ||
        pickFromVehicle(primarySelectedVehicle, ['U_Veh_Color', 'U_VEH_COLOR', 'COLOR', 'Color']) ||
        primaryCartItem?.color
    ),
    suppCatNum: toOptionalString(
      data.suppCatNum ||
        pickFromVehicle(primarySelectedVehicle, ['SuppCatNum', 'SUPPCATNUM'])
    ),
    modelCode: toOptionalString(
      data.modelCode ||
        pickFromVehicle(primarySelectedVehicle, ['U_Vehicle_MC', 'U_VEHICLE_MC', 'Model Code', 'MODELCODE'])
    ),
    quantity: totalQuantity || toPositiveNumber(data.quantity || primaryCartItem?.quantity),
    vinNumber: toOptionalString(resolvedVinNumber),
    vinDetails: aggregatedVinDetails,
    branch: toOptionalString(data.branch),
    budget: toOptionalString(data.budget),
    financing: normalizeEnum(data.financing, ['yes', 'no', 'maybe']),
    chargeCode: toOptionalString(data.chargeCode),
    chargeName: toOptionalString(data.chargeName),
    chargePrice: toOptionalString(data.chargePrice),
    chargeDetails:
      data.chargeDetails && typeof data.chargeDetails === 'object'
        ? (data.chargeDetails as Record<string, unknown>)
        : undefined,
    preferredContact: normalizeEnum(data.preferredContact, ['phone', 'email', 'whatsapp', 'sms']),
    preferredTime: normalizeEnum(data.preferredTime, ['morning', 'afternoon', 'evening', 'anytime']),
    preferredDelivery: toOptionalString(data.preferredDelivery),
    source: toOptionalString(data.source),
    salesType: toOptionalString(data.sales_type),
    tradeInMake: toOptionalString(data.tradeInMake),
    tradeInModel: toOptionalString(data.tradeInModel),
    tradeInYear: toOptionalString(data.tradeInYear),
    tradeInKms: toOptionalString(data.tradeInKms),
    tradeInExpectedPrice: toOptionalString(data.tradeInExpectedPrice),
    salesperson: toOptionalString(data.salesperson),
    slpCode: toOptionalString(data.slpCode),
    notes: toOptionalString(data.notes),
  };
}

function pickFromVehicle(vehicle: unknown, keys: string[]): string {
  if (!vehicle || typeof vehicle !== 'object') return '';
  const record = vehicle as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return '';
}

function transformEnquiryFormDataForVehicleLine(
  data: SalesEnquiryFormSubmission,
  line: NonNullable<SalesEnquiryFormSubmission['selectedVehicleLines']>[number]
): CreateEnquiryData {
  const basePayload = transformEnquiryFormData(data);
  const vehicle = line?.vin;

  const make =
    pickFromVehicle(vehicle, ['U_Veh_Brand', 'U_VEH_BRAND', 'Brand', 'BRAND', 'ItmsGrpNam']) ||
    basePayload.make ||
    '';
  const model =
    pickFromVehicle(vehicle, [
      'U_Veh_ModelDescr',
      'U_Veh_ModelFull',
      'U_Veh_Model',
      'U_VEH_MODEL',
      'Model Description',
      'MODEL',
      'Model',
    ]) ||
    basePayload.model ||
    '';
  const variant =
    pickFromVehicle(vehicle, ['ItemCode', 'ITEMCODE', 'ProductCode', 'PRODUCTCODE']) ||
    basePayload.variant ||
    '';
  const year =
    pickFromVehicle(vehicle, ['U_Veh_MY', 'U_VEH_MY', 'Model Year', 'MODELYEAR', 'YEAR', 'Year']) ||
    basePayload.year ||
    '';
  const color =
    pickFromVehicle(vehicle, ['U_Veh_Color', 'U_VEH_COLOR', 'COLOR', 'Color']) ||
    basePayload.color ||
    '';
  const modelCode =
    pickFromVehicle(vehicle, ['U_Vehicle_MC', 'U_VEHICLE_MC', 'Model Code', 'MODELCODE']) ||
    basePayload.modelCode ||
    '';
  const suppCatNum =
    pickFromVehicle(vehicle, ['SuppCatNum', 'SUPPCATNUM']) ||
    modelCode ||
    basePayload.suppCatNum ||
    '';
  const vinNumber =
    line?.vinValue ||
    extractVinFromUnknown(vehicle) ||
    basePayload.vinNumber ||
    '';

  return {
    ...basePayload,
    make: toOptionalString(make) || basePayload.make || '',
    model: toOptionalString(model) || basePayload.model || '',
    variant: toOptionalString(variant),
    year: toOptionalString(year),
    color: toOptionalString(color),
    modelCode: toOptionalString(modelCode),
    suppCatNum: toOptionalString(suppCatNum),
    quantity: toPositiveNumber(line?.quantity) || basePayload.quantity || 1,
    vinNumber: toOptionalString(vinNumber),
    vinDetails: sanitizeVinDetails(vehicle) || basePayload.vinDetails,
  };
}

/**
 * Custom hook for handling enquiry form submission
 *
 * Handles both create and edit flows for sales enquiries.
 * Transforms form data to API payload format and manages success/error states.
 *
 * @example
 * ```tsx
 * const { handleSubmit, isSubmitting } = useEnquiryFormSubmit({
 *   isEditMode: modal.isEditMode,
 *   selectedEntity: modal.selectedEntity,
 *   onSuccess: () => {
 *     modal.close();
 *     setCurrentTab("customer-information");
 *   },
 * });
 * ```
 */
export function useEnquiryFormSubmit({
  isEditMode,
  selectedEntity,
  onSuccess,
}: UseEnquiryFormSubmitParams): UseEnquiryFormSubmitReturn {
  const { createEnquiry, updateEnquiry, isCreating, isUpdating } = useEnquiryMutations();
  const isSubmitting = isCreating || isUpdating;

  const handleSubmit = useCallback(
    async (data: SalesEnquiryFormSubmission) => {
      try {
        if (isEditMode && selectedEntity) {
          const payload = transformEnquiryFormData(data);
          logger.info(`Updating Enquiry ID ${selectedEntity.SLNO}:`, payload);
          await updateEnquiry(selectedEntity.SLNO, payload);
          toast.success('Enquiry updated successfully');
          onSuccess?.();
          return;
        }

        const selectedLines = (data.selectedVehicleLines || []).filter((line) => line?.vin);
        if (selectedLines.length > 0) {
          const payload = transformEnquiryFormData(data);
          logger.info('Creating Enquiry (multiple vehicles):', payload);
          await createEnquiry(payload);
          toast.success('Enquiry created successfully');
          onSuccess?.();
          return;
        }

        const payload = transformEnquiryFormData(data);
        logger.info('Creating Enquiry:', payload);
        await createEnquiry(payload);
        toast.success('Enquiry created successfully');
        onSuccess?.();
      } catch (error: any) {
        logger.error(`Error ${isEditMode ? 'updating' : 'creating'} enquiry:`, error);

        const validationDetail = Array.isArray(error?.response?.data?.error?.details)
          ? error.response.data.error.details[0]?.message
          : undefined;
        const errorMessage =
          error?.response?.data?.error?.message ||
          validationDetail ||
          error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEditMode ? 'update' : 'create'} enquiry`;

        toast.error(errorMessage);
      }
    },
    [createEnquiry, isEditMode, onSuccess, selectedEntity, updateEnquiry]
  );

  return {
    handleSubmit,
    isSubmitting,
  };
}
