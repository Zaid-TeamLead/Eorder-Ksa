'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  passToCashierFormSchema,
  type PassToCashierFormData,
} from '@/forms/quotation/schema';
import { useQuotationMutations } from '@/hooks/entities/useQuotationMutations';
import { useLenders } from '@/hooks/entities/useLenders';
import { useSalesEmployees } from '@/hooks/entities/useSalesEmployees';
import { logger } from '@/lib/logger';

interface PassToCashierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: number;
  initialDepositAmount?: number;
  onSuccess?: () => void;
}

export function PassToCashierDialog({
  open,
  onOpenChange,
  quotationId,
  initialDepositAmount = 0,
  onSuccess,
}: PassToCashierDialogProps) {
  const { passToCashier } = useQuotationMutations();
  const { lenders, isLoading: isLoadingLenders } = useLenders('BANK');
  const { salesEmployees, isLoading: isLoadingSalesEmployees } = useSalesEmployees();
  const [selectedBankName, setSelectedBankName] = useState('');
  const [selectedSalesEmployeeCode, setSelectedSalesEmployeeCode] = useState('');
  const [selectionError, setSelectionError] = useState('');

  const form = useForm<PassToCashierFormData>({
    resolver: zodResolver(passToCashierFormSchema),
    defaultValues: {
      assignedTo: '',
      depositAmount: initialDepositAmount || 0,
      requestNotes: '',
    },
  });

  useEffect(() => {
    if (open) {
      setSelectedBankName('');
      setSelectedSalesEmployeeCode('');
      setSelectionError('');
      form.reset({
        assignedTo: '',
        depositAmount: initialDepositAmount || 0,
        requestNotes: '',
      });
    }
  }, [open, initialDepositAmount, form]);

  const selectedSalesEmployee = useMemo(
    () =>
      salesEmployees.find(
        (employee) => employee.SALES_EMPLOYEE_CODE === selectedSalesEmployeeCode
      ),
    [salesEmployees, selectedSalesEmployeeCode]
  );

  useEffect(() => {
    if (!selectedBankName || !selectedSalesEmployee) {
      form.setValue('assignedTo', '');
      return;
    }

    form.setValue(
      'assignedTo',
      `${selectedBankName} | ${selectedSalesEmployee.SALES_EMPLOYEE_CODE} - ${selectedSalesEmployee.SALES_EMPLOYEE_NAME}`,
      { shouldValidate: true }
    );
  }, [form, selectedBankName, selectedSalesEmployee]);

  const onSubmit = async (data: PassToCashierFormData) => {
    try {
      if (!selectedBankName || !selectedSalesEmployee) {
        setSelectionError('Select bank and sales employee');
        return;
      }

      const assignedTo = `${selectedBankName} | ${selectedSalesEmployee.SALES_EMPLOYEE_CODE} - ${selectedSalesEmployee.SALES_EMPLOYEE_NAME}`;

      await passToCashier(quotationId, {
        ...data,
        assignedTo,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      logger.error('Error passing quotation to cashier:', error);
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Pass Enquiry to Cashier for Deposit</DialogTitle>
          <DialogDescription>
            Assign the cashier/superior who will action this deposit request.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Bank *</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => {
                    setSelectedBankName(value);
                    setSelectionError('');
                  }}
                  value={selectedBankName}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={isLoadingLenders ? 'Loading banks...' : 'Select bank'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {lenders.map((lender) => {
                      const value = lender.LENDER_NAME || lender.LENDER_CODE;
                      const label =
                        lender.LENDER_CODE && lender.LENDER_NAME
                          ? `${lender.LENDER_CODE} - ${lender.LENDER_NAME}`
                          : value;
                      return (
                        <SelectItem key={`${lender.LENDER_CODE}-${lender.LENDER_NAME}`} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Sales Employee *</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => {
                    setSelectedSalesEmployeeCode(value);
                    setSelectionError('');
                  }}
                  value={selectedSalesEmployeeCode}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingSalesEmployees
                          ? 'Loading sales employees...'
                          : 'Select sales employee'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {salesEmployees.map((employee) => (
                      <SelectItem
                        key={`${employee.SALES_EMPLOYEE_CODE}-${employee.SALES_EMPLOYEE_NAME}`}
                        value={employee.SALES_EMPLOYEE_CODE}
                      >
                        {employee.SALES_EMPLOYEE_CODE} - {employee.SALES_EMPLOYEE_NAME}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>

            {selectionError ? <p className="text-sm text-destructive">{selectionError}</p> : null}

            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      step="0.01"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Add notes for cashier/superior (optional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finish
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
