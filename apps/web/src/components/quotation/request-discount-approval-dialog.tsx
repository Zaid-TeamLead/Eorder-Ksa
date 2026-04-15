'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  FormDescription,
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuotationMutations } from '@/hooks/entities/useQuotationMutations';
import { useSalesEmployees } from '@/hooks/entities/useSalesEmployees';
import { discountApprovalRequestFormSchema, type DiscountApprovalRequestFormData } from '@/forms/quotation/schema';
import { logger } from '@/lib/logger';

interface RequestDiscountApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: number;
  discountAmount: number;
  discountPercentage: number;
  quotationSubtotal?: number;
  userDiscountLimit?: number;
  onSuccess?: () => void;
}

export function RequestDiscountApprovalDialog({
  open,
  onOpenChange,
  quotationId,
  discountAmount,
  discountPercentage,
  quotationSubtotal = 0,
  userDiscountLimit = 0,
  onSuccess,
}: RequestDiscountApprovalDialogProps) {
  const { requestApproval } = useQuotationMutations();
  const { salesEmployees, isLoading: isLoadingSalesEmployees } = useSalesEmployees();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastEditedField, setLastEditedField] = useState<'amount' | 'percentage'>('amount');

  const form = useForm<DiscountApprovalRequestFormData>({
    resolver: zodResolver(discountApprovalRequestFormSchema),
    defaultValues: {
      discountAmount,
      discountPercentage,
      justification: '',
      assignedTo: '',
    },
  });

  const watchedDiscountAmount = useWatch({
    control: form.control,
    name: 'discountAmount',
  });
  const watchedDiscountPercentage = useWatch({
    control: form.control,
    name: 'discountPercentage',
  });

  const normalizedDiscountAmount = Number(watchedDiscountAmount || 0);
  const normalizedDiscountPercentage = Number(watchedDiscountPercentage || 0);
  const absoluteDiscountAmount = Math.abs(normalizedDiscountAmount);
  const amountOverLimit = absoluteDiscountAmount - userDiscountLimit;
  const isOverLimit = amountOverLimit > 0;
  const normalizedQuotationSubtotal = Number(quotationSubtotal || 0);

  useEffect(() => {
    form.reset({
      discountAmount,
      discountPercentage,
      justification: '',
      assignedTo: '',
    });
    setLastEditedField('amount');
  }, [discountAmount, discountPercentage, form, open]);

  useEffect(() => {
    if (!open || normalizedQuotationSubtotal <= 0) {
      return;
    }

    if (lastEditedField === 'amount') {
      const nextPercentage = Number(
        ((absoluteDiscountAmount / normalizedQuotationSubtotal) * 100).toFixed(2)
      );
      if (Math.abs(nextPercentage - normalizedDiscountPercentage) > 0.009) {
        form.setValue('discountPercentage', nextPercentage, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      return;
    }

    const nextAmount = -Number(
      ((normalizedQuotationSubtotal * normalizedDiscountPercentage) / 100).toFixed(2)
    );
    if (Math.abs(nextAmount - normalizedDiscountAmount) > 0.009) {
      form.setValue('discountAmount', nextAmount, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    absoluteDiscountAmount,
    form,
    lastEditedField,
    normalizedDiscountAmount,
    normalizedDiscountPercentage,
    normalizedQuotationSubtotal,
    open,
  ]);

  const handleSubmit = async (data: DiscountApprovalRequestFormData) => {
    setIsSubmitting(true);
    try {
      await requestApproval(quotationId, data);
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      logger.error('Error requesting approval:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Discount Approval</DialogTitle>
          <DialogDescription>
            Submit your discount request with justification for manager approval.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Discount Summary */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-3 font-semibold">Discount Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Discount Amount:</p>
                  <p className="text-lg font-bold text-destructive">
                    SAR {absoluteDiscountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Discount Percentage:</p>
                  <p className="text-lg font-bold">{normalizedDiscountPercentage.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Your Discount Limit:</p>
                  <p className="font-semibold">
                    SAR {userDiscountLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Over Limit:</p>
                  <p className="font-semibold">
                    {isOverLimit ? (
                      <Badge variant="destructive">
                        SAR {amountOverLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600">
                        Within Limit
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested Discount Amount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={Math.abs(Number(field.value || 0))}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value || 0);
                            setLastEditedField('amount');
                            field.onChange(nextValue === 0 ? 0 : -Math.abs(nextValue));
                          }}
                          placeholder="Enter discount amount"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the requested discount amount in SAR.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested Discount Percentage *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={Number(field.value || 0)}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value || 0);
                            setLastEditedField('percentage');
                            field.onChange(nextValue);
                          }}
                          placeholder="Enter discount percentage"
                        />
                      </FormControl>
                      <FormDescription>
                        The amount updates automatically from the quotation subtotal.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justification *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Provide a detailed justification for this discount (minimum 10 characters)..."
                        rows={5}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      Explain why this discount is necessary (e.g., loyal customer, bulk purchase, competitive pricing)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To Manager / Supervisor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isLoadingSalesEmployees
                                ? 'Loading sales employees...'
                                : 'Select sales employee'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salesEmployees.length > 0 ? (
                          salesEmployees.map((employee) => {
                            const assignedValue = `${employee.SALES_EMPLOYEE_CODE} - ${employee.SALES_EMPLOYEE_NAME}`;
                            return (
                              <SelectItem
                                key={`${employee.SALES_EMPLOYEE_CODE}-${employee.SALES_EMPLOYEE_NAME}`}
                                value={assignedValue}
                              >
                                {assignedValue}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="__no-sales-employees__" disabled>
                            No sales employees found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Uses the same sales employee list as Pass Enquiry to Cashier for Deposit.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
