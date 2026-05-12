"use client";

import { useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { SalesEnquiryFormData } from "../schema";
import type { VehicleChargeItem } from "@/services/vehicles";
import { Button } from "@/components/ui/button";
import { useChargeSelection } from "@/hooks/forms/useChargeSelection";
import { IconListSearch } from "@tabler/icons-react";
import { toSafeText } from "@/lib/value-normalizers";
import { getVehicleChargePrice } from "@/lib/vehicle-charge";

export function EnquiryDetails() {
  const form = useFormContext<SalesEnquiryFormData>();
  const { listenForSelection } = useChargeSelection();

  const customerCode = String(form.watch("customerId") || "").trim();
  const selectedChargeCode = String(form.watch("chargeCode") || "").trim();
  const selectedChargeName = String(form.watch("chargeName") || "").trim();

  const applyChargeSelection = useCallback(
    (item: VehicleChargeItem) => {
      const chargeCode = toSafeText(item.ITEMCODE);
      const chargeName = toSafeText(item.FRGNANME || item.ITEMNAME);
      const chargePrice = getVehicleChargePrice(item);

      form.setValue("chargeCode", chargeCode, { shouldDirty: true });
      form.setValue("chargeName", chargeName, { shouldDirty: true });
      form.setValue("chargePrice", chargePrice, { shouldDirty: true });
      form.setValue("chargeDetails", item as Record<string, unknown>, { shouldDirty: true });
    },
    [form]
  );

  const clearChargeSelection = useCallback(() => {
    form.setValue("chargeCode", "", { shouldDirty: true });
    form.setValue("chargeName", "", { shouldDirty: true });
    form.setValue("chargePrice", "", { shouldDirty: true });
    form.setValue("chargeDetails", undefined, { shouldDirty: true });
  }, [form]);

  const handleBrowseCharges = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("openChargeSelectionModal", {
        detail: { customerCode },
      })
    );
  }, [customerCode]);

  useEffect(() => {
    return listenForSelection((charge) => {
      applyChargeSelection(charge);
    });
  }, [listenForSelection, applyChargeSelection]);

  useEffect(() => {
    const chargeDetails = form.getValues("chargeDetails");
    const hasChargeFields = Boolean(selectedChargeCode || selectedChargeName);
    if (hasChargeFields || !chargeDetails || typeof chargeDetails !== "object") return;
    applyChargeSelection(chargeDetails as VehicleChargeItem);
  }, [applyChargeSelection, form, selectedChargeCode, selectedChargeName]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wide">Sales Charge</h3>
          {selectedChargeCode && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={clearChargeSelection}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-sm"
            onClick={handleBrowseCharges}
          >
            <IconListSearch className="w-4 h-4 mr-2" />
            Browse Charges
          </Button>
          <Input
            readOnly
            className="h-8 text-sm bg-muted/40"
            value={
              selectedChargeCode
                ? `${selectedChargeCode}${selectedChargeName ? ` - ${selectedChargeName}` : ""}`
                : "No charge selected"
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="chargeCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Charge Code</FormLabel>
                <FormControl>
                  <Input className="h-7 text-sm w-full bg-muted/40" readOnly {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="chargeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Charge Name</FormLabel>
                <FormControl>
                  <Input className="h-7 text-sm w-full bg-muted/40" readOnly {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="chargePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Charge Price</FormLabel>
                <FormControl>
                  <Input className="h-7 text-sm w-full bg-muted/40" readOnly {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <FormField
          control={form.control}
          name="branch"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Branch
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-7 text-sm w-full">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Riyadh">Riyadh</SelectItem>
                  <SelectItem value="Jeddah">Jeddah</SelectItem>
                  <SelectItem value="Mecca">Mecca</SelectItem>
                  <SelectItem value="Medina">Medina</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Budget Range (SAR)
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-7 text-sm w-full">
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0-5">SAR 0 - SAR 5M</SelectItem>
                  <SelectItem value="5-10">SAR 5 - SAR 10M</SelectItem>
                  <SelectItem value="10-15">SAR 10 - SAR 15M</SelectItem>
                  <SelectItem value="15-20">SAR 15 - SAR 20M</SelectItem>
                  <SelectItem value="20-25">SAR 20 - SAR 25M</SelectItem>
                  <SelectItem value="25-30">SAR 25 - SAR 30M</SelectItem>
                  <SelectItem value="30-40">SAR 30 - SAR 40M</SelectItem>
                  <SelectItem value="40-50">SAR 40 - SAR 50M</SelectItem>
                  <SelectItem value="50+">SAR 50M+</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="financing"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Financing Required
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-7 text-sm w-full">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="maybe">Maybe</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sales_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Sales Type
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-7 text-sm w-full">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="fleet">Fleet</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preferredContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Preferred Contact Method
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-7 text-sm w-full">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preferredTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Preferred Contact Time
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-7 text-sm w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="morning">
                    Morning (9 AM - 12 PM)
                  </SelectItem>
                  <SelectItem value="afternoon">
                    Afternoon (12 PM - 5 PM)
                  </SelectItem>
                  <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
                  <SelectItem value="anytime">Anytime</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preferredDelivery"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Preferred Delivery Date
              </FormLabel>
              <FormControl>
                <Input type="date" className="h-7 text-sm w-full" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Source of Enquiry
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-7 text-sm w-full">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="social-media">Social Media</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="advertisement">Advertisement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
