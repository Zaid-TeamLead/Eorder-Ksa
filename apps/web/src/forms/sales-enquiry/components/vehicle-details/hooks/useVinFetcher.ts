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
interface UseVinFetcherOptions {
  autoFetch?: boolean;
}

export function useVinFetcher(
  customerId: string,
  variant: string,
  options: UseVinFetcherOptions = {}
) {
  const [vinNumbers, setVinNumbers] = useState<any[]>([]);
  const [loadingVinNumbers, setLoadingVinNumbers] = useState(false);
  const autoFetch = options.autoFetch ?? true;

  const getVinNumber = useCallback(async (
    customerId: string,
    ProductCode: string,
    config?: { silent?: boolean }
  ) => {
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
      if (!config?.silent) {
        toast.error("Failed to fetch VIN numbers");
      }
      return [];
    } finally {
      setLoadingVinNumbers(false);
    }
  }, []);

  // Auto-fetch VIN numbers when customerId and variant are available
  useEffect(() => {
    if (!autoFetch) {
      setVinNumbers([]);
      return;
    }

    if (customerId && variant) {
      getVinNumber(customerId, variant, { silent: true });
    } else {
      setVinNumbers([]);
    }
  }, [autoFetch, customerId, variant, getVinNumber]);

  return {
    vinNumbers,
    setVinNumbers,
    loadingVinNumbers,
    getVinNumber,
  };
}
