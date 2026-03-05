'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuotationMutations } from '@/hooks/entities/useQuotationMutations';
import { approveDiscountFormSchema, type ApproveDiscountFormData } from '@/forms/quotation/schema';
import type { DiscountApproval } from '@/types/quotation';
import { logger } from '@/lib/logger';

interface ApproveDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approval: DiscountApproval;
  onSuccess?: () => void;
}

export function ApproveDiscountDialog({
  open,
  onOpenChange,
  approval,
  onSuccess,
}: ApproveDiscountDialogProps) {
  const { approveDiscount } = useQuotationMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'Approved' | 'Rejected' | null>(null);
  const discountPercentage = Number(approval.DISCOUNT_PERCENTAGE || 0);
  const userDiscountLimit = Number(approval.USER_DISCOUNT_LIMIT || 0);
  const amountOverLimit = Number(approval.AMOUNT_OVER_LIMIT || 0);

  const form = useForm<ApproveDiscountFormData>({
    resolver: zodResolver(approveDiscountFormSchema),
    defaultValues: {
      approvalStatus: 'Approved',
      approvalNotes: '',
      rejectionReason: '',
    },
  });

  const handleSubmit = async (data: ApproveDiscountFormData) => {
    setIsSubmitting(true);
    try {
      await approveDiscount(approval.SLNO, data);
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      logger.error('Error processing approval:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = () => {
    setSelectedStatus('Approved');
    form.setValue('approvalStatus', 'Approved');
    form.setValue('rejectionReason', ''); // Clear rejection reason if previously set
  };

  const handleReject = () => {
    setSelectedStatus('Rejected');
    form.setValue('approvalStatus', 'Rejected');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review Discount Approval Request</DialogTitle>
          <DialogDescription>
            Review the discount request details and approve or reject the request.
          </DialogDescription>
        </DialogHeader>

        {/* Request Details */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-3 font-semibold">Request Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Requested By:</p>
              <p className="font-medium">{approval.REQUESTED_BY}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Request Date:</p>
              <p className="font-medium">
                {new Date(approval.REQUESTED_DATE).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Discount Amount:</p>
              <p className="text-lg font-bold text-destructive">
                SAR {Math.abs(approval.DISCOUNT_AMOUNT).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Discount Percentage:</p>
              <p className="text-lg font-bold">{discountPercentage.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">User's Discount Limit:</p>
              <p className="font-medium">
                SAR {userDiscountLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Amount Over Limit:</p>
              <Badge variant="destructive">
                SAR {amountOverLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Badge>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Justification:</p>
            <p className="rounded-md bg-background p-3 text-sm">{approval.JUSTIFICATION}</p>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        {!selectedStatus && (
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={handleApprove}
              className="flex-1"
              variant="default"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve Request
            </Button>
            <Button
              type="button"
              onClick={handleReject}
              className="flex-1"
              variant="destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Request
            </Button>
          </div>
        )}

        {/* Form for Notes/Reason */}
        {selectedStatus && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  {selectedStatus === 'Approved' ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-600">Approving Request</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="font-semibold text-destructive">Rejecting Request</span>
                    </>
                  )}
                </div>

                {selectedStatus === 'Approved' ? (
                  <FormField
                    control={form.control}
                    name="approvalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approval Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Add any notes or conditions for this approval..."
                            rows={4}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormDescription>
                          Optional notes that will be visible to the requester
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="rejectionReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rejection Reason *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Please provide a clear reason for rejecting this request..."
                            rows={4}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormDescription>
                          Required: Explain why this discount request is being rejected
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedStatus(null);
                    form.reset();
                  }}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedStatus === 'Approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
