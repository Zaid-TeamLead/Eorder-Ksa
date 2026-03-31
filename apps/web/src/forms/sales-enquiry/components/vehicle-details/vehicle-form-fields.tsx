"use client";

import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import type { SalesEnquiryFormData } from "../../schema";

interface VehicleFormFieldsProps {
  form: UseFormReturn<SalesEnquiryFormData>;
  selectedVehicle: any;
  showQuantityField?: boolean;
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
  showQuantityField = true,
}: VehicleFormFieldsProps) {
  const vinDetails = form.watch("vinDetails") as Record<string, unknown> | undefined;

  const normalizeKey = (key: string) =>
    key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  const getValueFromSources = (keys: string[]): string => {
    const normalizedKeys = new Set(keys.map(normalizeKey));
    const sources: Array<Record<string, unknown> | undefined> = [vinDetails, selectedVehicle];

    for (const source of sources) {
      if (!source || typeof source !== "object") continue;

      for (const [rawKey, rawValue] of Object.entries(source)) {
        if (rawValue === null || rawValue === undefined) continue;
        const value = String(rawValue).trim();
        if (!value) continue;

        if (normalizedKeys.has(normalizeKey(rawKey))) {
          return value;
        }
      }
    }

    return "";
  };

  const parseNumber = (value: string): number | null => {
    if (!value) return null;
    const normalized = value
      .replace(/,/g, "")
      .replace(/[^0-9.-]/g, "")
      .trim();
    if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const currency = getValueFromSources(["Currency", "CURRENCY", "Curr", "CURR"]) || "SAR";
  const priceRaw = getValueFromSources([
    "Price",
    "PRICE",
    "UnitPrice",
    "UNITPRICE",
    "ListPrice",
    "LISTPRICE",
    "Amount",
    "AMOUNT",
    "AmountWithoutTax",
    "AMOUNTWITHOUTTAX",
  ]);
  const discountedRaw = getValueFromSources([
    "Discprice",
    "DISCPRICE",
    "DiscountPrice",
    "DISCOUNTPRICE",
    "NetPrice",
    "NETPRICE",
    "AmountAfterDiscount",
    "AMOUNTAFTERDISCOUNT",
  ]);
  const discountRaw = getValueFromSources([
    "Discount",
    "DISCOUNT",
    "DiscPrcnt",
    "DISCPRCNT",
    "DiscPercent",
    "DISCPERCENT",
    "DiscountPercent",
    "DISCOUNTPERCENT",
    "DiscAmt",
    "DISCAMT",
    "DiscountAmount",
    "DISCOUNTAMOUNT",
  ]);

  const formatMoney = (raw: string) => {
    const parsed = parseNumber(raw);
    if (parsed === null) return "N/A";
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parsed)}`;
  };

  const priceDisplay = formatMoney(priceRaw);
  const discountDisplay = (() => {
    if (discountRaw) {
      if (discountRaw.includes("%")) return discountRaw;
      const parsedDiscount = parseNumber(discountRaw);
      return parsedDiscount !== null ? formatMoney(discountRaw) : "N/A";
    }

    const basePrice = parseNumber(priceRaw);
    const discountedPrice = parseNumber(discountedRaw);
    if (
      basePrice !== null &&
      discountedPrice !== null &&
      basePrice > 0 &&
      discountedPrice <= basePrice
    ) {
      const discountAmount = basePrice - discountedPrice;
      const discountPercent = (discountAmount / basePrice) * 100;
      return `${discountPercent.toFixed(2)}%`;
    }

    return discountedRaw ? formatMoney(discountedRaw) : "N/A";
  })();
  const discPriceDisplay = discountedRaw ? formatMoney(discountedRaw) : "N/A";

  const getAvailableQuantity = (vehicle: any): number | null => {
    if (!vehicle || typeof vehicle !== "object") return null;

    const candidates = [
      vehicle.Available,
      vehicle.available,
      vehicle["Available"],
      vehicle["AVAILABLE"],
      vehicle["Total Stock"],
      vehicle.TotalStock,
      vehicle.TOTALSTOCK,
    ];

    for (const value of candidates) {
      if (value === undefined || value === null || value === "") continue;
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
    }

    return null;
  };

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
        <FormItem>
          <FormLabel className="text-xs font-medium">Price</FormLabel>
          <FormControl>
            <Input
              readOnly
              value={priceDisplay}
              className="h-8 text-sm bg-muted/40"
            />
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel className="text-xs font-medium">Discount</FormLabel>
          <FormControl>
            <Input
              readOnly
              value={discountDisplay}
              className="h-8 text-sm bg-muted/40"
            />
          </FormControl>
        </FormItem>
        {selectedVehicle && showQuantityField && (
          <>
            <FormItem>
              <FormLabel className="text-xs font-medium">Discprice</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  value={discPriceDisplay}
                  className="h-8 text-sm bg-muted/40"
                />
              </FormControl>
            </FormItem>
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => {
                const available = getAvailableQuantity(selectedVehicle);
                const quantity = field.value || 0;
                const exceedsAvailable =
                  available !== null && quantity > available;

                return (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">
                      Quantity{" "}
                      <span className="text-muted-foreground text-xs font-normal">
                        (Available: {available ?? "N/A"})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={available ?? undefined}
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
                          if (available !== null && value && value > available) {
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
          </>
        )}
      </div>
    </>
  );
}
