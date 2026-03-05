"use client";

import { useFormContext } from "react-hook-form";
import type { SalesEnquiryFormData } from "../../schema";
import { VinSelectionDialog } from "../vin-selection-dialog";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import type { VehicleInventory } from "@/services/vehicles";
import { getVehicleFormResetValues } from "../utils/getVehicleFormResetValues";
import { logger } from "@/lib/logger";
import { useVehicleSelection } from "@/hooks/forms/useVehicleSelection";
import { useVinFetcher } from "./hooks/useVinFetcher";
import { VehicleSearchSection } from "./vehicle-search-section";
import { SelectedVinsDisplay } from "./selected-vins-display";
import { VehicleFormFields } from "./vehicle-form-fields";

/**
 * VehicleDetails Component - Main Orchestrator
 *
 * Coordinates vehicle selection, VIN management, and cart operations.
 * Refactored from monolithic 597-line component into focused sub-components.
 *
 * Architecture:
 * - useVinFetcher hook: Manages VIN fetching logic
 * - VehicleSearchSection: Handles vehicle search and inventory browsing
 * - SelectedVinsDisplay: Shows selected VINs with removal capability
 * - VehicleFormFields: Form inputs and add to cart
 * - VinSelectionDialog: VIN selection modal (external)
 */
export function VehicleDetails() {
  const form = useFormContext<SalesEnquiryFormData>();
  const { addItem } = useCart();

  // Local state
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vinDialogOpen, setVinDialogOpen] = useState(false);
  const [selectedVins, setSelectedVins] = useState<Set<string>>(new Set());
  const [selectedVinsWithQuantity, setSelectedVinsWithQuantity] = useState<
    Map<string, { vin: any; quantity: number }>
  >(new Map());

  // Watch form fields
  const customerId = form.watch("customerId") || "";
  const variant = form.watch("variant") || "";

  // Custom hook for VIN fetching
  const { vinNumbers, setVinNumbers, loadingVinNumbers, getVinNumber } =
    useVinFetcher(customerId, variant);

  // Vehicle selection hook for cross-component communication
  const { listenForSelection } = useVehicleSelection();

  // Resolve "make" from multiple possible API payload shapes.
  const resolveMake = useCallback((vehicle: any): string => {
    if (!vehicle || typeof vehicle !== "object") return "";

    // Direct known keys first
    const direct =
      vehicle.U_Veh_Brand ||
      vehicle.U_VEH_BRAND ||
      vehicle.MAKENAME ||
      vehicle.MAKE ||
      vehicle.Make;

    if (direct) return String(direct).trim();

    // Common fallback from grouped item name
    if (vehicle.ItmsGrpNam) {
      return String(vehicle.ItmsGrpNam).trim().split(" ")[0] || "";
    }

    // Last fallback: first token from full model text
    const fullModel = vehicle.U_Veh_ModelFull || vehicle.U_Veh_ModelDescr || vehicle.U_VEH_MODELFULL;
    if (fullModel) {
      return String(fullModel).trim().split(" ")[0] || "";
    }

    const modelLike =
      vehicle.U_Veh_Model ||
      vehicle.U_VEH_MODEL ||
      vehicle["Model Description"] ||
      vehicle.ItemCode;
    if (modelLike) {
      return String(modelLike).trim().split(" ")[0] || "";
    }

    return "";
  }, []);

  // Auto-open dialog when VINs are loaded
  useEffect(() => {
    if (!loadingVinNumbers && vinNumbers.length > 0) {
      setVinDialogOpen(true);
    }
  }, [vinNumbers, loadingVinNumbers]);

  // Clear VIN selections when customerId or variant changes
  useEffect(() => {
    if (!customerId || !variant) {
      setSelectedVins(new Set());
      setSelectedVinsWithQuantity(new Map());

      // Only clear values if they were previously set
      const currentVinNumber = form.getValues("vinNumber");
      const currentVinDetails = form.getValues("vinDetails");
      if (currentVinNumber) {
        form.setValue("vinNumber", "", { shouldDirty: false });
      }
      if (currentVinDetails) {
        form.setValue("vinDetails", undefined, { shouldDirty: false });
      }
    }
  }, [customerId, variant, form]);

  // Listen for vehicle selection from inventory modal
  useEffect(() => {
    return listenForSelection((vehicle: VehicleInventory) => {
      // Populate form fields with inventory vehicle data
      const options = { shouldDirty: false };
      const make = resolveMake(vehicle) || String(form.getValues("make") || "");
      form.setValue("make", make, options);
      form.setValue("model", vehicle.U_Veh_Model || "", options);
      form.setValue("variant", vehicle.ItemCode || "", options);
      form.setValue("year", vehicle.U_Veh_MY || "", options);
      form.setValue("color", vehicle.U_Veh_Color || "", options);
      form.setValue("modelCode", vehicle.U_Vehicle_MC || "", options);
      form.setValue("vinNumber", vehicle.VIN || "", options);
      form.setValue("quantity", 1, options);

      toast.success("Vehicle selected from inventory");
    });
  }, [form, listenForSelection, resolveMake]);

  // Search vehicles handler
  const handleSearchVehicles = useCallback(async (query: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/vehicles/search`,
        {
          params: { search: query },
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      return response.data as { success: boolean; data: any[] };
    } catch (error) {
      logger.error("Error searching vehicles:", error);
      throw error;
    }
  }, []);

  // Vehicle selection handler
  const handleVehicleSelect = useCallback(
    (vehicle: any) => {
      // Store selected vehicle for quantity validation
      setSelectedVehicle(vehicle);
      const make = resolveMake(vehicle);

      // Map API response to form fields with shouldDirty: false to prevent unnecessary re-renders
      const options = { shouldDirty: false };
      form.setValue("make", make || "", options);
      form.setValue("model", vehicle["Model Description"] || "", options);
      form.setValue("variant", vehicle.ItemCode || "", options);
      form.setValue("year", vehicle["Model Year"] || "", options);
      form.setValue("color", vehicle.U_Veh_Color || "", options);
      form.setValue("suppCatNum", vehicle.SuppCatNum || "", options);
      form.setValue("modelCode", vehicle["Model Code"] || "", options);
      form.setValue("quantity", 1, options); // Set default quantity to 1
      form.setValue("vinNumber", "", options); // Reset VIN number when vehicle changes
      form.setValue("vinDetails", undefined, options); // Reset VIN details when vehicle changes
    },
    [form, resolveMake]
  );

  // Browse inventory handler
  const handleSelectFromInventory = useCallback(() => {
    // Trigger event to open the vehicle selection modal
    window.dispatchEvent(new CustomEvent("openVehicleInventoryModal"));
  }, []);

  // VIN removal handler
  const handleRemoveVin = useCallback(
    (vinValue: string) => {
      const newMap = new Map(selectedVinsWithQuantity);
      newMap.delete(vinValue);
      setSelectedVinsWithQuantity(newMap);
      const newSelected = new Set(selectedVins);
      newSelected.delete(vinValue);
      setSelectedVins(newSelected);
    },
    [selectedVins, selectedVinsWithQuantity]
  );

  // VIN selection confirmation handler
  const handleVinConfirm = useCallback(
    (vins: Set<string>) => {
      if (vins.size > 0) {
        // Store selected VINs with default quantity of 1
        const newMap = new Map<string, { vin: any; quantity: number }>();
        vins.forEach((vinValue) => {
          const vin = vinNumbers.find((v: any) => {
            const vValue = v.VIN || v.vin || v.vinNumber;
            return vValue === vinValue;
          });
          if (vin) {
            newMap.set(vinValue, { vin, quantity: 1 });
          }
        });
        setSelectedVinsWithQuantity(newMap);

        // Get the first selected VIN for form field (for backward compatibility)
        const firstSelectedVin = vinNumbers.find((vin: any) => {
          const vinValue = vin.VIN || vin.vin || vin.vinNumber;
          return vins.has(vinValue);
        });

        if (firstSelectedVin) {
          const vinValue =
            firstSelectedVin.VIN ||
            firstSelectedVin.vin ||
            firstSelectedVin.vinNumber;
          form.setValue("vinNumber", vinValue, { shouldDirty: false });
          form.setValue("vinDetails", firstSelectedVin, { shouldDirty: false });

          // Keep make populated from VIN payload when available.
          const makeFromVin =
            resolveMake(firstSelectedVin) || String(form.getValues("make") || "");
          form.setValue("make", makeFromVin, { shouldDirty: false });

          // Update vehicle details from first selected VIN
          if (firstSelectedVin.U_Veh_Color) {
            form.setValue("color", firstSelectedVin.U_Veh_Color, {
              shouldDirty: false,
            });
          }
          if (firstSelectedVin.U_Veh_MY) {
            form.setValue("year", firstSelectedVin.U_Veh_MY, {
              shouldDirty: false,
            });
          }
          if (firstSelectedVin.U_Veh_ModelDescr) {
            form.setValue("model", firstSelectedVin.U_Veh_ModelDescr, {
              shouldDirty: false,
            });
          }
          if (firstSelectedVin.U_Vehicle_MC) {
            form.setValue("modelCode", firstSelectedVin.U_Vehicle_MC, {
              shouldDirty: false,
            });
          }
        }
      }
    },
    [form, vinNumbers, resolveMake]
  );

  // Add to cart handler
  const handleAddToCart = useCallback(() => {
    const formData = form.getValues();

    // Validate required fields
    if (!formData.make || !formData.model) {
      toast.error("Please fill in Make and Model");
      return;
    }

    // Check if we have selected VINs with quantities
    if (selectedVinsWithQuantity.size === 0) {
      toast.error("Please select at least one VIN number");
      return;
    }

    const available = selectedVehicle?.Available || 0;
    let addedCount = 0;

    // Add each selected VIN as a separate cart item
    selectedVinsWithQuantity.forEach(({ vin, quantity }, vinValue) => {
      // Validate quantity
      const qty = Number(quantity) || 1;
      if (qty < 1) {
        toast.error(`Quantity must be at least 1 for VIN ${vinValue}`);
        return;
      }

      if (qty > available) {
        toast.error(
          `Quantity cannot exceed available stock (${available}) for VIN ${vinValue}`
        );
        return;
      }

      // Get price and currency from VIN details
      const price = vin?.Price || undefined;
      const currency = vin?.Currency || "SAR";
      const discPrice = vin?.Discprice || undefined;

      // Create cart item for this VIN with the correct quantity
      const cartItem = {
        id: `${vinValue}-${Date.now()}-${Math.random()}`,
        itemCode: selectedVehicle?.ItemCode || formData.variant || "",
        itemName:
          selectedVehicle?.ItemName || `${formData.make} ${formData.model}`,
        make: formData.make,
        model: formData.model,
        variant: formData.variant,
        year: vin?.U_Veh_MY || formData.year,
        color: vin?.U_Veh_Color || formData.color,
        suppCatNum: formData.suppCatNum,
        modelCode: vin?.U_Vehicle_MC || formData.modelCode,
        quantity: qty,
        available,
        price: price,
        currency: currency,
        discPrice: discPrice,
        vinNumber: vinValue,
        customerName: formData.customerName,
        mobile: formData.mobile,
        email: formData.homeEmail,
      };

      addItem(cartItem);
      addedCount++;
    });

    if (addedCount > 0) {
      toast.success(
        `${addedCount} item${addedCount > 1 ? "s" : ""} added to cart`
      );

      // Reset only vehicle-related fields using utility function
      const currentData = form.getValues();
      const resetValues = getVehicleFormResetValues(currentData);
      form.reset(resetValues);

      // Reset vehicle-related state
      setVehicleSearch("");
      setSelectedVehicle(null);
      setSelectedVins(new Set());
      setSelectedVinsWithQuantity(new Map());
    }
  }, [form, selectedVehicle, selectedVinsWithQuantity, addItem]);

  return (
    <div className="space-y-4">
      {/* Vehicle Search Section */}
      <VehicleSearchSection
        form={form}
        vehicleSearch={vehicleSearch}
        onVehicleSearchChange={setVehicleSearch}
        onSearch={handleSearchVehicles}
        onVehicleSelect={handleVehicleSelect}
        onBrowseInventory={handleSelectFromInventory}
        loadingVinNumbers={loadingVinNumbers}
        vinNumbersCount={vinNumbers.length}
        selectedVinsCount={selectedVinsWithQuantity.size}
        onOpenVinDialog={() => setVinDialogOpen(true)}
        customerId={customerId || ""}
        variant={variant || ""}
      />

      {/* Selected VINs Display */}
      <SelectedVinsDisplay
        selectedVinsWithQuantity={selectedVinsWithQuantity}
        onRemove={handleRemoveVin}
      />

      {/* VIN Selection Dialog */}
      <VinSelectionDialog
        open={vinDialogOpen}
        onOpenChange={setVinDialogOpen}
        vinNumbers={vinNumbers}
        loading={loadingVinNumbers}
        selectedVins={selectedVins}
        onSelectedVinsChange={setSelectedVins}
        onConfirm={handleVinConfirm}
      />

      {/* Vehicle Form Fields */}
      <VehicleFormFields
        form={form}
        selectedVehicle={selectedVehicle}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
