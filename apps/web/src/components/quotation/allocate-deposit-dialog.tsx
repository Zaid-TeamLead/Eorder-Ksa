'use client';

import { useEffect } from 'react';
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
  allocateDepositFormSchema,
  type AllocateDepositFormData,
} from '@/forms/quotation/schema';
import { useQuotationMutations } from '@/hooks/entities/useQuotationMutations';
import { logger } from '@/lib/logger';

interface AllocateDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: number;
  defaultAmount?: number;
  onSuccess?: () => void;
}

export function AllocateDepositDialog({
  open,
  onOpenChange,
  quotationId,
  defaultAmount,
  onSuccess,
}: AllocateDepositDialogProps) {
  const { allocateDeposit } = useQuotationMutations();

  const form = useForm<AllocateDepositFormData>({
    resolver: zodResolver(allocateDepositFormSchema),
    defaultValues: {
      depositAmount: defaultAmount && defaultAmount > 0 ? defaultAmount : 0,
      allocationNotes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        depositAmount: defaultAmount && defaultAmount > 0 ? defaultAmount : 0,
        allocationNotes: '',
      });
    }
  }, [open, defaultAmount, form]);

  const onSubmit = async (data: AllocateDepositFormData) => {
    try {
      await allocateDeposit(quotationId, data);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      logger.error('Error allocating deposit:', error);
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Allocate Deposit To Enquiry</DialogTitle>
          <DialogDescription>
            Confirm deposit receipt and allocate it against this enquiry.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Amount *</FormLabel>
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
              name="allocationNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allocation Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Optional notes about this deposit allocation"
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
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
