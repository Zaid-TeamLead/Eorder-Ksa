"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { SalesEnquiryFormData } from "../schema";
import { VehicleSearch } from "./vehicle-search";
import { VinSelectionDialog } from "./vin-selection-dialog";
import { VinDetailsCard } from "./vin-details-card";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useCart } from "@/lib/cart-context";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function VehicleDetails() {
  const form = useFormContext<SalesEnquiryFormData>();
  const { addItem } = useCart();
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vinNumbers, setVinNumbers] = useState<any[]>([]);
  const [loadingVinNumbers, setLoadingVinNumbers] = useState(false);
  const [vinDialogOpen, setVinDialogOpen] = useState(false);
  const [selectedVins, setSelectedVins] = useState<Set<string>>(new Set());
  const [selectedVinsWithQuantity, setSelectedVinsWithQuantity] = useState<Map<string, { vin: any; quantity: number }>>(new Map());

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
      console.error("Error getting vin number:", error);
      setVinNumbers([]);
      toast.error("Failed to fetch VIN numbers");
      return [];
    } finally {
      setLoadingVinNumbers(false);
    }
  }, []);

  // Watch for changes in customerId and variant to fetch VIN numbers
  const customerId = form.watch("customerId");
  const variant = form.watch("variant");
  const vinDetails = form.watch("vinDetails");

  useEffect(() => {
    if (customerId && variant) {
      getVinNumber(customerId, variant).then((vins) => {
        // Auto-open dialog when VINs are loaded
        if (vins && vins.length > 0) {
          setVinDialogOpen(true);
        }
      });
    } else {
      setVinNumbers([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, variant, getVinNumber]);

  const handleSearchVehicles = async (query: string) => {
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
      console.error("Error searching vehicles:", error);
      throw error;
    }
  };

  const handleVehicleSelect = (vehicle: any) => {
    // Store selected vehicle for quantity validation
    setSelectedVehicle(vehicle);

    // Extract make from ItmsGrpNam (e.g., "ISUZU PICKUP" -> "ISUZU")
    const make = vehicle.ItmsGrpNam?.split(" ")[0] || "";

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
  };

  const handleAddToCart = () => {
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
        toast.error(`Quantity cannot exceed available stock (${available}) for VIN ${vinValue}`);
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
        itemName: selectedVehicle?.ItemName || `${formData.make} ${formData.model}`,
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
      toast.success(`${addedCount} item${addedCount > 1 ? "s" : ""} added to cart`);

      // Get current customer information to preserve it
      const currentData = form.getValues();

      // Reset only vehicle-related fields, keep customer and other information
      form.reset({
        // Preserve customer information
        customerId: currentData.customerId,
        customerName: currentData.customerName,
        address: currentData.address,
        postcode: currentData.postcode,
        homePhone: currentData.homePhone,
        workPhone: currentData.workPhone,
        mobile: currentData.mobile,
        homeEmail: currentData.homeEmail,
        // Reset vehicle details
        make: "",
        model: "",
        variant: "",
        year: "",
        color: "",
        suppCatNum: "",
        modelCode: "",
        quantity: undefined,
        vinNumber: "",
        vinDetails: undefined,
        // Preserve enquiry details
        budget: currentData.budget,
        financing: currentData.financing,
        preferredContact: currentData.preferredContact,
        preferredTime: currentData.preferredTime,
        preferredDelivery: currentData.preferredDelivery,
        source: currentData.source,
        // Preserve trade-in vehicle
        tradeInMake: currentData.tradeInMake,
        tradeInModel: currentData.tradeInModel,
        tradeInYear: currentData.tradeInYear,
        tradeInKms: currentData.tradeInKms,
        tradeInExpectedPrice: currentData.tradeInExpectedPrice,
        // Preserve additional information
        salesperson: currentData.salesperson,
        notes: currentData.notes,
      });

      // Reset vehicle-related state
      setVehicleSearch("");
      setSelectedVehicle(null);
      setSelectedVins(new Set());
      setSelectedVinsWithQuantity(new Map());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <VehicleSearch
            value={vehicleSearch}
            onChange={setVehicleSearch}
            onSearch={handleSearchVehicles}
            onVehicleSelect={handleVehicleSelect}
          />

        </div>

        <div className="w-[280px]">
          <FormField
            control={form.control}
            name="vinNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  VIN Number
                  {loadingVinNumbers && (
                    <span className="text-muted-foreground text-xs font-normal ml-2">
                      (Loading...)
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 text-sm w-full justify-start"
                    onClick={() => setVinDialogOpen(true)}
                    disabled={loadingVinNumbers || vinNumbers.length === 0 || !customerId || !variant}
                  >
                    {selectedVinsWithQuantity.size > 0
                      ? `${selectedVinsWithQuantity.size} VIN${selectedVinsWithQuantity.size > 1 ? "s" : ""} selected`
                      : selectedVins.size > 0
                        ? `${selectedVins.size} VIN${selectedVins.size > 1 ? "s" : ""} selected`
                        : !customerId || !variant
                          ? "Select customer & vehicle first"
                          : loadingVinNumbers
                            ? "Loading VIN numbers..."
                            : vinNumbers.length === 0
                              ? "No VIN numbers available"
                              : "Select VIN numbers"}
                  </Button>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

      </div>
      {selectedVinsWithQuantity.size > 0 && (
        <div className="space-y-2">
          {Array.from(selectedVinsWithQuantity.entries()).map(([vinValue, { vin, quantity }]) => (
            <VinDetailsCard
              key={vinValue}
              vin={vin}
              vinValue={vinValue}
              onRemove={(v) => {
                const newMap = new Map(selectedVinsWithQuantity);
                newMap.delete(v);
                setSelectedVinsWithQuantity(newMap);
                const newSelected = new Set(selectedVins);
                newSelected.delete(v);
                setSelectedVins(newSelected);
              }}
            />
          ))}
        </div>
      )}

      {/* VIN Selection Dialog */}
      <VinSelectionDialog
        open={vinDialogOpen}
        onOpenChange={setVinDialogOpen}
        vinNumbers={vinNumbers}
        loading={loadingVinNumbers}
        selectedVins={selectedVins}
        onSelectedVinsChange={setSelectedVins}
        onConfirm={(vins) => {
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
              const vinValue = firstSelectedVin.VIN || firstSelectedVin.vin || firstSelectedVin.vinNumber;
              form.setValue("vinNumber", vinValue, { shouldDirty: false });
              form.setValue("vinDetails", firstSelectedVin, { shouldDirty: false });

              // Update vehicle details from first selected VIN
              if (firstSelectedVin.U_Veh_Color) {
                form.setValue("color", firstSelectedVin.U_Veh_Color, { shouldDirty: false });
              }
              if (firstSelectedVin.U_Veh_MY) {
                form.setValue("year", firstSelectedVin.U_Veh_MY, { shouldDirty: false });
              }
              if (firstSelectedVin.U_Veh_ModelDescr) {
                form.setValue("model", firstSelectedVin.U_Veh_ModelDescr, { shouldDirty: false });
              }
              if (firstSelectedVin.U_Vehicle_MC) {
                form.setValue("modelCode", firstSelectedVin.U_Vehicle_MC, { shouldDirty: false });
              }
            }
          }
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <FormField
          control={form.control}
          name="make"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Make <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., ISUZU, Toyota"
                  className="h-8 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Model <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., D-Max (RT)"
                  className="h-8 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="variant"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Variant</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., VDI, ZDI, ZXI"
                  className="h-8 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Model Year</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 2025"
                  className="h-8 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Color</FormLabel>
              <FormControl>
                <Input
                  placeholder="Preferred color"
                  className="h-8 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="suppCatNum"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Supp Cat Num</FormLabel>
              <FormControl>
                <Input
                  placeholder="Supplier catalog number"
                  className="h-8 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="modelCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Model Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="Model code"
                  className="h-8 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {selectedVehicle && (
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => {
              const available = selectedVehicle.Available || 0;
              const quantity = field.value || 0;
              const exceedsAvailable = quantity > available;

              return (
                <FormItem>
                  <FormLabel className="text-xs font-medium">
                    Quantity{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                      (Available: {available})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={available}
                      placeholder="Enter quantity"
                      className={cn(
                        "h-8 text-sm",
                        exceedsAvailable && "border-destructive"
                      )}
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined;
                        field.onChange(value);
                        // Trigger validation
                        if (value && value > available) {
                          form.setError("quantity", {
                            type: "manual",
                            message: `Quantity cannot exceed available stock (${available})`,
                          });
                        } else {
                          form.clearErrors("quantity");
                        }
                      }}
                    />
                  </FormControl>
                  {exceedsAvailable && (
                    <p className="text-xs text-destructive">
                      Quantity cannot exceed available stock ({available})
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        )}
      </div>

      {selectedVehicle && (
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={handleAddToCart}
            className="h-8 text-sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      )}
    </div>
  );
}
