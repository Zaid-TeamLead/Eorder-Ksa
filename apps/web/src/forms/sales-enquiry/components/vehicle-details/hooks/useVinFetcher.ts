import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { apiClient } from "@/lib/api-client";

/**
 * Custom hook for fetching VIN numbers for a vehicle
 *
 * Handles:
 * - VIN number fetching from API
 * - Loading state management
 * - Auto-fetching when customerId/variant changes
 * - Error handling
 */
export function useVinFetcher(customerId: string, variant: string) {
  const [vinNumbers, setVinNumbers] = useState<any[]>([]);
  const [loadingVinNumbers, setLoadingVinNumbers] = useState(false);

  const getVinNumber = useCallback(async (customerId: string, ProductCode: string) => {
    try {
      if (!customerId || !ProductCode) {
        setVinNumbers([]);
        return [];
      }
      setLoadingVinNumbers(true);
      const payload = {
        customerId: customerId,
        ProductCode: ProductCode,
      };
      const response = await apiClient.post<any[] | { data?: any[] }>(
        "/api/vehicles/get-vin-number",
        payload
      );

      // Handle both wrapped and unwrapped response formats.
      let vinList: any[] = [];
      if (Array.isArray(response)) {
        vinList = response;
      } else if (Array.isArray(response?.data)) {
        vinList = response.data;
      }

      // Keep the full VIN objects instead of extracting just the VIN string
      setVinNumbers(vinList);
      return vinList;
    } catch (error) {
      logger.error("Error getting vin number:", error);
      setVinNumbers([]);
      toast.error("Failed to fetch VIN numbers");
      return [];
    } finally {
      setLoadingVinNumbers(false);
    }
  }, []);

  // Auto-fetch VIN numbers when customerId and variant are available
  useEffect(() => {
    if (customerId && variant) {
      getVinNumber(customerId, variant);
    } else {
      setVinNumbers([]);
    }
  }, [customerId, variant, getVinNumber]);

  return {
    vinNumbers,
    setVinNumbers,
    loadingVinNumbers,
    getVinNumber,
  };
}
