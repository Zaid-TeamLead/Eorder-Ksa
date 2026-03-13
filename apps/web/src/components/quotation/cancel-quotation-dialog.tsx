import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CancelQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationNumber?: string;
  isCancelling?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
}

export function CancelQuotationDialog({
  open,
  onOpenChange,
  quotationNumber,
  isCancelling = false,
  onConfirm,
}: CancelQuotationDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  const handleConfirm = async () => {
    await onConfirm(reason.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Quotation</DialogTitle>
          <DialogDescription>
            {quotationNumber
              ? `Cancel quotation ${quotationNumber} and capture the reason.`
              : 'Cancel this quotation and capture the reason.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-quotation-reason">Cancellation Reason *</Label>
          <Textarea
            id="cancel-quotation-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for cancellation"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCancelling}
          >
            Close
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={isCancelling || reason.trim().length < 3}
          >
            {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
