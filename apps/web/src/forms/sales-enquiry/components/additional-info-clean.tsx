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
import { useSession } from "@/lib/auth-client";

export function AdditionalInfoClean() {
  const form = useFormContext<SalesEnquiryFormData>();
  const session = useSession();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField
          control={form.control}
          name="salesperson"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Assigned Salesperson</FormLabel>
              <FormControl>
                <Input
                  placeholder="Salesperson name"
                  className="h-7 text-xs"
                  {...field}
                  value={field.value || session?.data?.user.name || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={!!field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium">Notes / Comments</FormLabel>
            <FormControl>
              <textarea
                rows={4}
                placeholder="Any additional notes or comments..."
                className={cn(
                  "text-sm resize-none",
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
    </div>
  );
}
