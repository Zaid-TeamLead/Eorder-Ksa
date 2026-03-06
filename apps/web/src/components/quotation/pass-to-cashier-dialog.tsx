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
  passToCashierFormSchema,
  type PassToCashierFormData,
} from '@/forms/quotation/schema';
import { useQuotationMutations } from '@/hooks/entities/useQuotationMutations';
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
      form.reset({
        assignedTo: '',
        depositAmount: initialDepositAmount || 0,
        requestNotes: '',
      });
    }
  }, [open, initialDepositAmount, form]);

  const onSubmit = async (data: PassToCashierFormData) => {
    try {
      await passToCashier(quotationId, data);
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
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Who Will Action The Request *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter cashier/superior name or ID" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
