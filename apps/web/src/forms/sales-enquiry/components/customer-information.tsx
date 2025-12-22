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
import { cn } from "@/lib/utils";
import type { SalesEnquiryFormData } from "../schema";

export function CustomerInformation() {
  const form = useFormContext<SalesEnquiryFormData>();

  return (
    <div className="flex flex-col gap-4">
      {/* Customer Details - Compact Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Basic Info */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Address</FormLabel>
                <FormControl>
                  <textarea
                    rows={2}
                    className={cn(
                      "text-sm h-16 resize-none",
                      "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-2.5 py-1.5 shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2",
                      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Postcode</FormLabel>
                <FormControl>
                  <Input className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Middle Column - Contact Information */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="homePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Home Phone
                </FormLabel>
                <FormControl>
                  <Input type="tel" className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Work Phone
                </FormLabel>
                <FormControl>
                  <Input type="tel" className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Mobile <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="tel" className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="homeEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Email
                </FormLabel>
                <FormControl>
                  <Input type="email" className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
