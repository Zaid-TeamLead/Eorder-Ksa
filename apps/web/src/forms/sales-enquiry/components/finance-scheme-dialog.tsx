"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Currency, Lender, SalesEmployee } from "@/services/financing";
import {
  getFinanceSchemeDefaults,
  transformFinanceSchemeToApi,
  type FinanceSchemeFormData as FinanceFormData,
} from "./utils/getFinanceSchemeDefaults";
const financeSchemeSchema = z.object({
  lenderCode: z.string().min(1, "Lender is required"),
  currency: z.string().min(1, "Currency is required"),
  vehiclePrice: z.string().optional(),
  term: z.string().min(1, "Term is required"),
  downpayment: z.string().optional(),
  tradeInValue: z.string().optional(),
  interestRate: z.string().optional(),
  fda: z.string().optional(),
  gpvBalloon: z.string().optional(),
  salesEmployeeName: z.string().optional(),
  saleCode: z.string().optional(),
});

type FinanceSchemeFormData = FinanceFormData;

interface FinanceSchemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lenders: Lender[];
  currencies: Currency[];
  salesEmployees: SalesEmployee[];
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function FinanceSchemeDialog({
  open,
  onOpenChange,
  lenders,
  currencies,
  salesEmployees,
  onSubmit,
  initialData,
}: FinanceSchemeDialogProps) {
  // Memoize default values to prevent unnecessary recalculations
  const defaultValues = useMemo(
    () => getFinanceSchemeDefaults(initialData),
    [initialData]
  );

  const form = useForm<FinanceSchemeFormData>({
    resolver: zodResolver(financeSchemeSchema) as any,
    defaultValues,
  });

  // Reset form when initialData changes
  // Using useCallback to prevent infinite loop warnings
  const resetForm = useCallback(() => {
    const newDefaults = getFinanceSchemeDefaults(initialData);
    form.reset(newDefaults);
  }, [form, initialData]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const selectedSaleCode = form.watch("saleCode");
  const selectedSalesEmployeeName = form.watch("salesEmployeeName");

  useEffect(() => {
    const currentCode = String(selectedSaleCode || "").trim();
    const currentName = String(selectedSalesEmployeeName || "").trim();

    if (!currentCode && !currentName) {
      return;
    }

    const matchedEmployee = salesEmployees.find((employee) => {
      const employeeCode = String(employee.SALES_EMPLOYEE_CODE || "").trim();
      const employeeName = String(employee.SALES_EMPLOYEE_NAME || "").trim();

      if (currentCode && employeeCode === currentCode) return true;
      if (currentName && employeeName === currentName) return true;
      return false;
    });

    if (!matchedEmployee) {
      return;
    }

    const normalizedCode = String(matchedEmployee.SALES_EMPLOYEE_CODE || "").trim();
    const normalizedName = String(matchedEmployee.SALES_EMPLOYEE_NAME || "").trim();

    if (currentCode !== normalizedCode) {
      form.setValue("saleCode", normalizedCode, { shouldDirty: false });
    }

    if (currentName !== normalizedName) {
      form.setValue("salesEmployeeName", normalizedName, { shouldDirty: false });
    }
  }, [form, salesEmployees, selectedSaleCode, selectedSalesEmployeeName]);

  const handleSubmit = useCallback(
    (data: FinanceSchemeFormData) => {
      const selectedLender = lenders.find((l) => l.LENDER_CODE === data.lenderCode);
      const lenderName =
        selectedLender?.LENDER_NAME ||
        lenders.find((l) => l.LENDER_NAME === data.lenderCode)?.LENDER_NAME ||
        data.lenderCode;
      const apiData = transformFinanceSchemeToApi(
        data,
        lenderName
      );

      onSubmit(apiData);
      resetForm(); // Reset to clean state
      onOpenChange(false);
    },
    [lenders, onSubmit, resetForm, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Finance Scheme Parameters</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="lenderCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lender *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lenders.map((lender) => (
                          <SelectItem key={lender.LENDER_CODE} value={lender.LENDER_CODE}>
                            {lender.LENDER_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem
                            key={currency.CURRENCY_CODE}
                            value={currency.CURRENCY_CODE}
                          >
                            {currency.CURRENCY_CODE} - {currency.CURRENCY_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="vehiclePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term (months) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="downpayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cash</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tradeInValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade-in Value</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FDA</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="gpvBalloon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPV/Balloon</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salesEmployeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Name</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const selectedEmployee = salesEmployees.find(
                          (employee) => employee.SALES_EMPLOYEE_NAME === value
                        );
                        form.setValue(
                          "saleCode",
                          selectedEmployee?.SALES_EMPLOYEE_CODE || "",
                          { shouldDirty: true }
                        );
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sales name" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salesEmployees.map((employee) => (
                          <SelectItem
                            key={`${employee.SALES_EMPLOYEE_CODE}-${employee.SALES_EMPLOYEE_NAME}`}
                            value={employee.SALES_EMPLOYEE_NAME}
                          >
                            {employee.SALES_EMPLOYEE_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="saleCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Code</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const selectedEmployee = salesEmployees.find(
                          (employee) => employee.SALES_EMPLOYEE_CODE === value
                        );
                        form.setValue(
                          "salesEmployeeName",
                          selectedEmployee?.SALES_EMPLOYEE_NAME || "",
                          { shouldDirty: true }
                        );
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sales code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salesEmployees.map((employee) => (
                          <SelectItem
                            key={`${employee.SALES_EMPLOYEE_CODE}-${employee.SALES_EMPLOYEE_NAME}-code`}
                            value={employee.SALES_EMPLOYEE_CODE}
                          >
                            {employee.SALES_EMPLOYEE_CODE}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">OK</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
