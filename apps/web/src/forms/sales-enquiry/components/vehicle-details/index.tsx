"use client";

import { useFormContext } from "react-hook-form";
import type { SalesEnquiryFormData } from "../../schema";
import { VinSelectionDialog } from "../vin-selection-dialog";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import type { VehicleInventory } from "@/services/vehicles";
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

  // Local state
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vinDialogOpen, setVinDialogOpen] = useState(false);
  const [selectedVins, setSelectedVins] = useState<Set<string>>(new Set());
  const [selectedVinsWithQuantity, setSelectedVinsWithQuantity] = useState<
    Map<string, { vin: any; quantity: number; vinValue: string }>
  >(new Map());

  // Watch form fields
  const customerId = form.watch("customerId") || "";
  const variant = form.watch("variant") || "";

  // Custom hook for VIN fetching
  const { vinNumbers, setVinNumbers, loadingVinNumbers, getVinNumber } =
    useVinFetcher(customerId, variant);

  // Vehicle selection hook for cross-component communication
  const { listenForSelection, listenForMultipleSelection } = useVehicleSelection();

  const getVehicleVin = useCallback((vehicle: any): string => {
    if (!vehicle || typeof vehicle !== "object") return "";
    const direct =
      vehicle.VIN ||
      vehicle.VINNUMBER ||
      vehicle.vin ||
      vehicle.vinNumber ||
      vehicle.U_Veh_StockID ||
      vehicle.U_VEH_STOCKID ||
      vehicle.u_veh_stockid;
    if (direct) return String(direct).trim();

    const entry = Object.entries(vehicle).find(([key, value]) => {
      if (!value) return false;
      const lower = key.toLowerCase();
      return lower.includes("vin") || lower.includes("stockid");
    });
    return entry ? String(entry[1]).trim() : "";
  }, []);

  const pickFirstValue = useCallback((vehicle: any, keys: string[]): string => {
    if (!vehicle || typeof vehicle !== "object") return "";
    for (const key of keys) {
      const value = vehicle[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
    return "";
  }, []);

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

  const populateVehicleFieldsFromSelection = useCallback(
    (vehicle: any) => {
      const resolvedVin = getVehicleVin(vehicle);
      const resolvedModel =
        pickFirstValue(vehicle, [
          "U_Veh_ModelDescr",
          "U_Veh_ModelFull",
          "U_Veh_Model",
          "U_VEH_MODEL",
          "Model Description",
          "MODEL",
          "Model",
        ]) || String(form.getValues("model") || "");
      const resolvedVariant =
        pickFirstValue(vehicle, ["ItemCode", "ITEMCODE", "ProductCode", "PRODUCTCODE"]) ||
        String(form.getValues("variant") || "");
      const resolvedYear = pickFirstValue(vehicle, [
        "U_Veh_MY",
        "U_VEH_MY",
        "Model Year",
        "MODELYEAR",
        "YEAR",
        "Year",
      ]);
      const resolvedColor = pickFirstValue(vehicle, [
        "U_Veh_Color",
        "U_VEH_COLOR",
        "COLOR",
        "Color",
      ]);
      const resolvedModelCode = pickFirstValue(vehicle, [
        "U_Vehicle_MC",
        "U_VEHICLE_MC",
        "Model Code",
        "MODELCODE",
      ]);
      const resolvedSuppCatNum = pickFirstValue(vehicle, ["SuppCatNum", "SUPPCATNUM"]);

      const options = { shouldDirty: false };
      const make = resolveMake(vehicle) || String(form.getValues("make") || "");
      form.setValue("make", make, options);
      form.setValue("model", resolvedModel, options);
      form.setValue("variant", resolvedVariant, options);
      form.setValue("year", resolvedYear, options);
      form.setValue("color", resolvedColor, options);
      form.setValue("modelCode", resolvedModelCode, options);
      form.setValue("suppCatNum", resolvedSuppCatNum || resolvedModelCode, options);
      form.setValue("vinNumber", resolvedVin, options);
      form.setValue("vinDetails", vehicle as any, options);
      form.setValue("quantity", 1, options);
      setSelectedVehicle(vehicle as any);

      return resolvedVin;
    },
    [form, getVehicleVin, pickFirstValue, resolveMake]
  );

  // Keep VIN dialog manual (open from button only) to avoid unexpected popup in edit mode.

  // Clear VIN selections when variant is cleared.
  // Do NOT clear on empty customerId because browse-inventory flow can work without it.
  useEffect(() => {
    if (!variant) {
      setSelectedVins(new Set());
      setSelectedVinsWithQuantity(new Map());

      // Only clear values if they were previously set
      const currentVinNumber = form.getValues("vinNumber");
      const currentVinDetails = form.getValues("vinDetails");
      const currentVehicleLines = form.getValues("selectedVehicleLines");
      if (currentVinNumber) {
        form.setValue("vinNumber", "", { shouldDirty: false });
      }
      if (currentVinDetails) {
        form.setValue("vinDetails", undefined, { shouldDirty: false });
      }
      if (currentVehicleLines?.length) {
        form.setValue("selectedVehicleLines", [], { shouldDirty: false });
      }
    }
  }, [variant, form]);

  useEffect(() => {
    const lines = Array.from(selectedVinsWithQuantity.entries()).map(
      ([selectionKey, { vin, quantity, vinValue }]) => ({
        selectionKey,
        vinValue,
        quantity,
        vin,
      })
    );
    form.setValue("selectedVehicleLines", lines, { shouldDirty: false });
  }, [form, selectedVinsWithQuantity]);

  // Listen for vehicle selection from inventory modal
  useEffect(() => {
    return listenForSelection((vehicle: VehicleInventory) => {
      const resolvedVin = populateVehicleFieldsFromSelection(vehicle);

      if (resolvedVin) {
        setSelectedVins(new Set([resolvedVin]));
        setSelectedVinsWithQuantity(
          new Map([[resolvedVin, { vin: vehicle, quantity: 1, vinValue: resolvedVin }]])
        );
      } else {
        setSelectedVins(new Set());
        setSelectedVinsWithQuantity(new Map());
      }

      toast.success("Vehicle selected from inventory");
    });
  }, [listenForSelection, populateVehicleFieldsFromSelection]);

  useEffect(() => {
    return listenForMultipleSelection((vehicles: VehicleInventory[]) => {
      if (!Array.isArray(vehicles) || vehicles.length === 0) return;

      const firstVehicle = vehicles[0];
      if (!firstVehicle) return;
      populateVehicleFieldsFromSelection(firstVehicle);

      const nextVins = new Set<string>();
      const nextMap = new Map<string, { vin: any; quantity: number; vinValue: string }>();

      vehicles.forEach((vehicle, index) => {
        const resolvedVin =
          getVehicleVin(vehicle) ||
          `NO-VIN-${index + 1}-${String((vehicle as any).ItemCode || "UNKNOWN")}`;
        const selectionKey = [
          resolvedVin,
          String((vehicle as any).ItemCode || "NO-ITEM"),
          String((vehicle as any).WhsCode || (vehicle as any).WhsName || "NO-WHS"),
        ].join("-");
        nextVins.add(resolvedVin);
        nextMap.set(selectionKey, { vin: vehicle, quantity: 1, vinValue: resolvedVin });
      });

      setSelectedVins(nextVins);
      setSelectedVinsWithQuantity(nextMap);
      form.setValue("quantity", vehicles.length, { shouldDirty: false });
      toast.success(`${vehicles.length} vehicles selected from inventory`);
    });
  }, [form, listenForMultipleSelection, populateVehicleFieldsFromSelection, getVehicleVin]);

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
    const customerCode = String(form.getValues("customerId") || "").trim();
    if (!customerCode) {
      toast.error("Select customer first to load customer pricing");
      return;
    }

    // Trigger event to open the vehicle selection modal with current customer code
    window.dispatchEvent(
      new CustomEvent("openVehicleInventoryModal", {
        detail: { customerCode },
      })
    );
  }, [form]);

  // VIN removal handler
  const handleRemoveVin = useCallback(
    (selectionKey: string) => {
      const newMap = new Map(selectedVinsWithQuantity);
      const removedEntry = newMap.get(selectionKey);
      newMap.delete(selectionKey);
      setSelectedVinsWithQuantity(newMap);
      if (newMap.size > 0) {
        const totalQty = Array.from(newMap.values()).reduce(
          (sum, item) => sum + (Number(item.quantity) || 0),
          0
        );
        form.setValue("quantity", totalQty || 1, { shouldDirty: false });
      } else {
        form.setValue("quantity", undefined, { shouldDirty: false });
      }
      const newSelected = new Set(selectedVins);
      if (removedEntry?.vinValue) {
        const vinStillExists = Array.from(newMap.values()).some(
          (item) => item.vinValue === removedEntry.vinValue
        );
        if (!vinStillExists) {
          newSelected.delete(removedEntry.vinValue);
        }
      }
      setSelectedVins(newSelected);
    },
    [form, selectedVins, selectedVinsWithQuantity]
  );

  const handleVinQuantityChange = useCallback(
    (selectionKey: string, quantity: number) => {
      const normalizedQuantity = Number.isFinite(Number(quantity)) && Number(quantity) > 0
        ? Number(quantity)
        : 1;

      setSelectedVinsWithQuantity((current) => {
        const next = new Map(current);
        const entry = next.get(selectionKey);
        if (!entry) return current;

        next.set(selectionKey, {
          ...entry,
          quantity: normalizedQuantity,
        });

        const totalQty = Array.from(next.values()).reduce(
          (sum, item) => sum + (Number(item.quantity) || 0),
          0
        );
        form.setValue("quantity", totalQty || 1, { shouldDirty: false });
        return next;
      });
    },
    [form]
  );

  // VIN selection confirmation handler
  const handleVinConfirm = useCallback(
    (vins: Set<string>) => {
      if (vins.size > 0) {
        // Store selected VINs with default quantity of 1
        const newMap = new Map<string, { vin: any; quantity: number; vinValue: string }>();
        vins.forEach((vinValue) => {
          const vin = vinNumbers.find((v: any) => {
            const vValue = getVehicleVin(v);
            return vValue === vinValue;
          });
          if (vin) {
            newMap.set(vinValue, { vin, quantity: 1, vinValue });
          }
        });
        setSelectedVinsWithQuantity(newMap);
        form.setValue("quantity", newMap.size || 1, { shouldDirty: false });

        // Get the first selected VIN for form field (for backward compatibility)
        const firstSelectedVin = vinNumbers.find((vin: any) => {
          const vinValue = getVehicleVin(vin);
          return vins.has(vinValue);
        });

        if (firstSelectedVin) {
          const vinValue = getVehicleVin(firstSelectedVin);
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
    [form, vinNumbers, resolveMake, getVehicleVin]
  );

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
        onQuantityChange={handleVinQuantityChange}
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
      {selectedVinsWithQuantity.size === 0 ? (
        <VehicleFormFields
          form={form}
          selectedVehicle={selectedVehicle}
          showQuantityField={true}
        />
      ) : (
        <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          Vehicle details are managed in the selected VIN card{selectedVinsWithQuantity.size > 1 ? "s" : ""} above.
        </div>
      )}
    </div>
  );
}
