"use client";

import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSalesEmployees } from "@/hooks/entities/useSalesEmployees";
import { cn } from "@/lib/utils";
import type { SalesEnquiryFormData } from "../schema";

const ALL_SALESPERSONS_VALUE = "__all_salespersons__";

const normalizeText = (value: unknown): string =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const getSalesEmployeeBranchValues = (employee: Record<string, unknown>): string[] => {
  const values = new Set<string>();

  Object.entries(employee).forEach(([key, rawValue]) => {
    if (rawValue === undefined || rawValue === null) return;

    const normalizedKey = key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (!normalizedKey.includes("branch")) return;

    const value = String(rawValue).trim();
    if (!value) return;

    values.add(value);
  });

  return Array.from(values);
};

export function AdditionalInfoClean() {
  const form = useFormContext<SalesEnquiryFormData>();
  const { salesEmployees, isLoading } = useSalesEmployees();
  const branch = String(form.watch("branch") || "").trim();
  const salesperson = String(form.watch("salesperson") || "").trim();
  const slpCode = String(form.watch("slpCode") || "").trim();

  const normalizedBranch = useMemo(() => normalizeText(branch), [branch]);

  const employeesWithBranchMetadata = useMemo(
    () =>
      salesEmployees.filter((employee) => {
        const branchValues = getSalesEmployeeBranchValues(employee as Record<string, unknown>);
        return branchValues.length > 0;
      }),
    [salesEmployees]
  );

  const filteredSalesEmployees = useMemo(() => {
    if (!normalizedBranch) {
      return salesEmployees;
    }

    const matched = salesEmployees.filter((employee) => {
      const branchValues = getSalesEmployeeBranchValues(employee as Record<string, unknown>);
      if (branchValues.length === 0) return false;

      return branchValues.some((value) => {
        const normalizedValue = normalizeText(value);
        return (
          normalizedValue === normalizedBranch ||
          normalizedValue.includes(normalizedBranch) ||
          normalizedBranch.includes(normalizedValue)
        );
      });
    });

    return matched.length > 0 ? matched : salesEmployees;
  }, [normalizedBranch, salesEmployees]);

  const selectedSalesEmployee = useMemo(
    () =>
      salesEmployees.find((employee) => {
        const employeeCode = String(employee.SALES_EMPLOYEE_CODE || "").trim();
        const employeeName = String(employee.SALES_EMPLOYEE_NAME || "").trim();

        if (slpCode && employeeCode === slpCode) return true;
        if (salesperson && employeeName === salesperson) return true;
        return false;
      }) || null,
    [salesEmployees, slpCode, salesperson]
  );

  useEffect(() => {
    if (!selectedSalesEmployee) return;
    if (!normalizedBranch) return;
    if (employeesWithBranchMetadata.length === 0) return;

    const stillMatchesBranch = filteredSalesEmployees.some((employee) => {
      const employeeCode = String(employee.SALES_EMPLOYEE_CODE || "").trim();
      return employeeCode === String(selectedSalesEmployee.SALES_EMPLOYEE_CODE || "").trim();
    });

    if (!stillMatchesBranch) {
      form.setValue("salesperson", "", { shouldDirty: true });
      form.setValue("slpCode", "", { shouldDirty: true });
    }
  }, [
    employeesWithBranchMetadata.length,
    filteredSalesEmployees,
    form,
    normalizedBranch,
    selectedSalesEmployee,
  ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField
          control={form.control}
          name="salesperson"
          render={() => (
            <FormItem>
              <FormLabel className="text-xs font-medium">Assigned Salesperson</FormLabel>
              <FormControl>
                <Select
                  value={selectedSalesEmployee?.SALES_EMPLOYEE_CODE || undefined}
                  onValueChange={(value) => {
                    const employee = filteredSalesEmployees.find(
                      (item) => String(item.SALES_EMPLOYEE_CODE || "").trim() === value
                    );

                    form.setValue("salesperson", employee?.SALES_EMPLOYEE_NAME || "", {
                      shouldDirty: true,
                    });
                    form.setValue("slpCode", employee?.SALES_EMPLOYEE_CODE || "", {
                      shouldDirty: true,
                    });
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue
                      placeholder={
                        isLoading
                          ? "Loading salespersons..."
                          : branch
                            ? "Select salesperson"
                            : "Select branch first or choose salesperson"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSalesEmployees.length > 0 ? (
                      filteredSalesEmployees.map((employee) => (
                        <SelectItem
                          key={`${employee.SALES_EMPLOYEE_CODE}-${employee.SALES_EMPLOYEE_NAME}`}
                          value={employee.SALES_EMPLOYEE_CODE}
                          className="text-xs"
                        >
                          {employee.SALES_EMPLOYEE_NAME}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value={ALL_SALESPERSONS_VALUE} disabled className="text-xs">
                        No salespersons found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
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
