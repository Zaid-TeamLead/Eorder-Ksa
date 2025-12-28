'use client';

import { useState } from 'react';
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
import { discountApprovalRequestFormSchema, type DiscountApprovalRequestFormData } from '@/forms/quotation/schema';

interface RequestDiscountApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: number;
  discountAmount: number;
  discountPercentage: number;
  userDiscountLimit?: number;
  onSuccess?: () => void;
}

// Mock managers list - in production, this would come from an API
const managers = [
  { value: 'john.doe', label: 'John Doe - Sales Manager' },
  { value: 'jane.smith', label: 'Jane Smith - Regional Manager' },
  { value: 'michael.brown', label: 'Michael Brown - Director' },
];

export function RequestDiscountApprovalDialog({
  open,
  onOpenChange,
  quotationId,
  discountAmount,
  discountPercentage,
  userDiscountLimit = 0,
  onSuccess,
}: RequestDiscountApprovalDialogProps) {
  const { requestApproval } = useQuotationMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DiscountApprovalRequestFormData>({
    resolver: zodResolver(discountApprovalRequestFormSchema),
    defaultValues: {
      discountAmount,
      discountPercentage,
      justification: '',
      assignedTo: '',
    },
  });

  const amountOverLimit = Math.abs(discountAmount) - userDiscountLimit;
  const isOverLimit = amountOverLimit > 0;

  const handleSubmit = async (data: DiscountApprovalRequestFormData) => {
    setIsSubmitting(true);
    try {
      await requestApproval(quotationId, data);
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error requesting approval:', error);
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
                    SAR {Math.abs(discountAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Discount Percentage:</p>
                  <p className="text-lg font-bold">{discountPercentage.toFixed(2)}%</p>
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
                    <FormLabel>Assign To Manager *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a manager to review this request" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {managers.map((manager) => (
                          <SelectItem key={manager.value} value={manager.value}>
                            {manager.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the appropriate manager based on the discount amount
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hidden fields (auto-populated) */}
              <Input type="hidden" {...form.register('discountAmount')} />
              <Input type="hidden" {...form.register('discountPercentage')} />
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
