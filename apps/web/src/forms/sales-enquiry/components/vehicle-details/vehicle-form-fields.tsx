"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import type { SalesEnquiryFormData } from "../../schema";

interface VehicleFormFieldsProps {
  form: UseFormReturn<SalesEnquiryFormData>;
  selectedVehicle: any;
  onAddToCart: () => void;
}

/**
 * Vehicle form fields and add to cart
 *
 * Displays all vehicle-related form fields:
 * - Make, Model, Variant
 * - Year, Color, Supp Cat Num
 * - Model Code, Quantity
 *
 * Includes Add to Cart button when vehicle is selected
 */
export function VehicleFormFields({
  form,
  selectedVehicle,
  onAddToCart,
}: VehicleFormFieldsProps) {
  return (
    <>
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
            onClick={onAddToCart}
            className="h-8 text-sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      )}
    </>
  );
}
