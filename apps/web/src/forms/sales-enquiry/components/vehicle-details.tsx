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
import { useState } from "react";
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
  const [vinNumber, setVinNumber] = useState<string>("");

  const getVinNumber = async (ProductCode: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/vehicles/get-vin-number`,
        { ProductCode },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      console.log(response.data);
      // Store VIN number if needed
      // if (response.data) {
      //   setVinNumber(response.data);
      // }
    } catch (error) {
      console.error("Error getting vin number:", error);
      throw error;
    }
  };

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

    // Map API response to form fields
    form.setValue("make", make || "");
    form.setValue("model", vehicle["Model Description"] || "");
    form.setValue("variant", vehicle.ItemCode || "");
    form.setValue("year", vehicle["Model Year"] || "");
    form.setValue("color", vehicle.U_Veh_Color || "");
    form.setValue("suppCatNum", vehicle.SuppCatNum || "");
    form.setValue("modelCode", vehicle["Model Code"] || "");
    form.setValue("quantity", 1); // Set default quantity to 1

    // Get VIN number for selected vehicle
    if (vehicle.ItemCode) {
      getVinNumber(vehicle.ItemCode);
    }
  };

  const handleAddToCart = () => {
    const formData = form.getValues();
    const quantity = formData.quantity || 1;
    const available = selectedVehicle?.Available || 0;

    // Validate quantity
    if (!quantity || quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    if (quantity > available) {
      toast.error(`Quantity cannot exceed available stock (${available})`);
      return;
    }

    // Validate required fields
    if (!formData.make || !formData.model) {
      toast.error("Please fill in Make and Model");
      return;
    }

    // Create cart item
    const cartItem = {
      id: `${formData.variant || formData.modelCode}-${Date.now()}`,
      itemCode: selectedVehicle?.ItemCode || formData.variant || "",
      itemName: selectedVehicle?.ItemName || `${formData.make} ${formData.model}`,
      make: formData.make,
      model: formData.model,
      variant: formData.variant,
      year: formData.year,
      color: formData.color,
      suppCatNum: formData.suppCatNum,
      modelCode: formData.modelCode,
      quantity,
      available,
      customerName: formData.customerName,
      mobile: formData.mobile,
      email: formData.homeEmail,
    };

    addItem(cartItem);
    toast.success("Item added to cart");

    // Reset form
    form.reset({
      customerName: "",
      address: "",
      postcode: "",
      homePhone: "",
      workPhone: "",
      mobile: "",
      homeEmail: "",
      make: "",
      model: "",
      variant: "",
      year: "",
      color: "",
      suppCatNum: "",
      modelCode: "",
      quantity: undefined,
      budget: "",
      financing: undefined,
      preferredContact: undefined,
      preferredTime: undefined,
      preferredDelivery: "",
      source: "",
      tradeInMake: "",
      tradeInModel: "",
      tradeInYear: "",
      tradeInKms: "",
      tradeInExpectedPrice: "",
      salesperson: "",
      notes: "",
    });
    setVehicleSearch("");
    setSelectedVehicle(null);
  };

  return (
    <div className="space-y-4">
      <VehicleSearch
        value={vehicleSearch}
        onChange={setVehicleSearch}
        onSearch={handleSearchVehicles}
        onVehicleSelect={handleVehicleSelect}
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
