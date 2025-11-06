"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { SalesEnquiryFormData } from "../schema";

export function TradeIn() {
  const form = useFormContext<SalesEnquiryFormData>();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <FormField
          control={form.control}
          name="tradeInMake"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Make</FormLabel>
              <FormControl>
                <Input className="h-8 text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tradeInModel"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Model</FormLabel>
              <FormControl>
                <Input className="h-8 text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tradeInYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Year</FormLabel>
              <FormControl>
                <Input type="number" className="h-8 text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tradeInKms"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Kilometers</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="KMs driven"
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
          name="tradeInExpectedPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Expected Price (SAR)
              </FormLabel>
              <FormControl>
                <Input type="number" className="h-8 text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
