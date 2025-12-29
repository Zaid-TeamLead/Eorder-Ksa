import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getEnquiryById } from '@/services/enquiry';
import { getQuotationById } from '@/services/quotation';
import type { SalesEnquiry } from '@/types/enquiry';
import type { QuotationWithLineItems } from '@/types/quotation';
import type { QuotationFormData } from '@/forms/quotation/schema';

interface UseQuotationFormDataParams {
  enquiryId?: string | null;
  supersedeId?: string | null;
  onDataLoaded?: (data: QuotationFormData) => void;
}

/**
 * Custom hook for loading and preparing quotation form data
 * Handles both create-from-enquiry and supersede flows
 */
export function useQuotationFormData({
  enquiryId,
  supersedeId,
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
  }, [enquiryId, supersedeId, isSuperseding]);

  const loadEnquiryData = async (id: number) => {
    try {
      setIsLoadingEnquiry(true);
      setError(null);
      const enquiryData = await getEnquiryById(id);
      setEnquiry(enquiryData);

      // Prepare form data from enquiry
      const formData: QuotationFormData = {
        enquirySlno: id,
        customerName: enquiryData.CUSTOMERNAME || '',
        customerMobile: enquiryData.MOBILE || '',
        customerEmail: enquiryData.HOMEEMAIL || '',
        customerAddress: enquiryData.ADDRESS || '',
        vehicleMake: enquiryData.MAKE || '',
        vehicleModel: enquiryData.MODEL || '',
        vehicleVariant: enquiryData.VARIANT || '',
        vehicleYear: enquiryData.YEAR || '',
        vehicleColor: enquiryData.COLOR || '',
        vinNumber: enquiryData.VINNUMBER || '',
        vehicleBasePrice: 0,
        vehicleDiscount: 0,
        vehicleNetPrice: 0,
        accessoriesTotal: 0,
        accessoriesDiscount: 0,
        accessoriesNetTotal: 0,
        warrantyTotal: 0,
        insuranceTotal: 0,
        subtotal: 0,
        taxRate: 15,
        taxAmount: 0,
        grandTotal: 0,
        tradeInValue: 0,
        downpayment: 0,
        netAmountDue: 0,
        totalDiscountAmount: 0,
        discountPercentage: 0,
        validUntil: '',
        notes: '',
        termsAndConditions: '',
        internalNotes: '',
        lineItems: [
          {
            lineNumber: 1,
            itemType: 'Vehicle',
            itemDescription: `${enquiryData.MAKE} ${enquiryData.MODEL} ${enquiryData.VARIANT || ''}`.trim(),
            quantity: enquiryData.QUANTITY || 1,
            unitPrice: 0,
            discountAmount: 0,
            discountPercentage: 0,
            netPrice: 0,
          },
        ],
      };

      onDataLoaded?.(formData);
    } catch (err) {
      console.error('Error loading enquiry:', err);
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
        console.error('Missing ENQUIRY_SLNO in quotation data:', quotationData);
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
      console.error('Error loading parent quotation:', err);
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
