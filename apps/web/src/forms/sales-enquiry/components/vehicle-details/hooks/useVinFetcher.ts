import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/vehicles/get-vin-number`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      // Handle API response format: { success: true, data: [...] }
      let vinList: any[] = [];
      if (response.data?.success && response.data?.data) {
        vinList = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        vinList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        vinList = response.data.data;
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
