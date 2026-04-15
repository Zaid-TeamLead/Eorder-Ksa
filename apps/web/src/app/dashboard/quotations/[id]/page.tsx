'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Send,
  Wallet,
  CircleDollarSign,
  FileText,
  CircleX,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog';
import { useQuotationById } from '@/hooks/entities/useQuotations';

// Shared utilities and components
import { formatCurrency, formatDate } from '@/lib/formatters';
import { LoadingState } from '@/components/shared/loading-state';
import { QuotationStatusBadge } from '@/components/quotation/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { RequestDiscountApprovalDialog } from '@/components/quotation/request-discount-approval-dialog';
import { PassToCashierDialog } from '@/components/quotation/pass-to-cashier-dialog';
import { AllocateDepositDialog } from '@/components/quotation/allocate-deposit-dialog';
import { CancelQuotationDialog } from '@/components/quotation/cancel-quotation-dialog';

// Custom hooks
import { useQuotationActions } from '@/hooks/quotation/useQuotationActions';
import { useQuotationMutations } from '@/hooks/entities/useQuotationMutations';

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = parseInt(params.id as string, 10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestApprovalDialogOpen, setRequestApprovalDialogOpen] = useState(false);
  const [passToCashierDialogOpen, setPassToCashierDialogOpen] = useState(false);
  const [allocateDepositDialogOpen, setAllocateDepositDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reserveVehicleDialogOpen, setReserveVehicleDialogOpen] = useState(false);
  const [reservationFromDate, setReservationFromDate] = useState('');
  const [reservationToDate, setReservationToDate] = useState('');
  const [reservationNotes, setReservationNotes] = useState('');

  const { quotation, isLoading, error, refetch } = useQuotationById(quotationId);
  const { reserveVehicle, isReservingVehicle } = useQuotationMutations();
  const activeQuotationId = Number(quotation?.SLNO || quotationId);

  // Use custom hook for all actions
  const {
    handleBack,
    handleDelete,
    handleCancel,
    isDeleting,
    isCancelling,
  } = useQuotationActions({
    quotationId,
    onSuccess: () => router.push('/dashboard/quotations'),
  });

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading quotation..." />;
  }

  // Error or not found state
  if (error || !quotation) {
    return (
      <ErrorState
        title="Quotation Not Found"
        message="The quotation you're looking for doesn't exist or you don't have permission to view it."
      />
    );
  }

  const totalDiscountAmount = Number(quotation.TOTAL_DISCOUNT_AMOUNT || 0);
  const displayQuotationNumber = quotation.ROOT_QUOTATION_NUMBER || quotation.QUOTATION_NUMBER;
  const storedReservationNotes = quotation.VEHICLE_RESERVATION_NOTES || '';
  const legacyReservationFromMatch = storedReservationNotes.match(/Reservation From:\s*([^\n\r]+)/i);
  const legacyReservationToMatch = storedReservationNotes.match(/Reservation To:\s*([^\n\r]+)/i);
  const displayReservationFrom =
    quotation.VEHICLE_RESERVATION_FROM_DATE || legacyReservationFromMatch?.[1]?.trim() || '';
  const displayReservationTo =
    quotation.VEHICLE_RESERVATION_TO_DATE || legacyReservationToMatch?.[1]?.trim() || '';
  const displayReservationNotes = storedReservationNotes
    .replace(/Reservation From:\s*[^\n\r]+/gi, '')
    .replace(/Reservation To:\s*[^\n\r]+/gi, '')
    .trim();
  const lineItemsDiscountAmount = (quotation.lineItems || []).reduce(
    (sum, item) => sum + Number(item.DISCOUNT_AMOUNT || 0),
    0
  );
  const lineItemsSubtotal = (quotation.lineItems || []).reduce(
    (sum, item) => sum + Number(item.NET_PRICE || 0),
    0
  );
  const pricingSubtotalFallback =
    lineItemsSubtotal +
    Number(quotation.ACCESSORIES_NET_TOTAL || 0) +
    Number(quotation.WARRANTY_TOTAL || 0) +
    Number(quotation.INSURANCE_TOTAL || 0);
  const effectiveSubtotal =
    Number(quotation.SUBTOTAL || 0) !== 0 ? Number(quotation.SUBTOTAL) : pricingSubtotalFallback;
  const effectiveTaxAmount =
    Number(quotation.TAX_AMOUNT || 0) !== 0
      ? Number(quotation.TAX_AMOUNT)
      : Number((effectiveSubtotal * (Number(quotation.TAX_RATE || 0) / 100)).toFixed(2));
  const effectiveGrandTotal =
    Number(quotation.GRAND_TOTAL || 0) !== 0
      ? Number(quotation.GRAND_TOTAL)
      : Number((effectiveSubtotal + effectiveTaxAmount).toFixed(2));
  const effectiveNetAmountDue =
    Number(quotation.NET_AMOUNT_DUE || 0) !== 0
      ? Number(quotation.NET_AMOUNT_DUE)
      : Math.max(
          0,
          Number(
            (
              effectiveGrandTotal -
              Number(quotation.TRADE_IN_VALUE || 0) -
              Number(quotation.DOWNPAYMENT || 0)
            ).toFixed(2)
          )
        );
  const isCancelled = quotation.STATUS === 'Cancelled';
  const isSuperseded = quotation.STATUS === 'Superseded';
  const isTerminalStatus = isCancelled || isSuperseded;
  // Fallback to line-item discounts when TOTAL_DISCOUNT_AMOUNT is not synced.
  const effectiveDiscountAmount =
    totalDiscountAmount !== 0 ? totalDiscountAmount : lineItemsDiscountAmount;
  const discountPercentage = Number(quotation.DISCOUNT_PERCENTAGE || 0);
  const discountApprovalStatus = String(quotation.DISCOUNT_APPROVAL_STATUS || '').trim();
  const hasPendingApprovalRequest = discountApprovalStatus === 'Pending';
  const hasApprovedDiscountRequest = discountApprovalStatus === 'Approved';
  const canRequestApproval =
    !isTerminalStatus &&
    !hasPendingApprovalRequest &&
    !hasApprovedDiscountRequest;
  const isPassedToCashier = quotation.PASSED_TO_CASHIER === 'Y';
  const isDepositCollected = quotation.DEPOSIT_COLLECTED === 'Y';
  const canPassToCashier = !isTerminalStatus && !isPassedToCashier;
  const canAllocateDeposit = !isTerminalStatus && isPassedToCashier && !isDepositCollected;
  const canCancel = !isCancelled && !isSuperseded;
  const isVehicleReserved = quotation.VEHICLE_RESERVED === 'Y';
  const canReserveVehicle =
    !isVehicleReserved &&
    !isTerminalStatus &&
    !!quotation.VIN_NUMBER?.trim();

  const handleReserveVehicle = async () => {
    if (reservationFromDate && reservationToDate && reservationToDate < reservationFromDate) {
      toast.error('Reservation To date must be on or after Reservation From date');
      return;
    }

    try {
      await reserveVehicle(activeQuotationId, {
        reservationFromDate: reservationFromDate || undefined,
        reservationToDate: reservationToDate || undefined,
        reservationNotes: reservationNotes || undefined,
      });
      setReserveVehicleDialogOpen(false);
      setReservationFromDate('');
      setReservationToDate('');
      setReservationNotes('');
      void refetch();
    } catch {
      // Error toast is already handled by the mutation layer.
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Quotation {displayQuotationNumber}</h1>
            {quotation.VERSION > 1 && (
              <Badge variant="outline">Version {quotation.VERSION}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Created on {new Date(quotation.CREATED_DATE).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2">
        <QuotationStatusBadge status={quotation.STATUS} />
        {quotation.IS_LATEST_VERSION === 'N' && (
          <Badge variant="outline">Superseded</Badge>
        )}
      </div>

      {!isTerminalStatus && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium">Additional Discount Request</p>
              {effectiveDiscountAmount < 0 ? (
                <p className="text-sm text-muted-foreground">
                  Send discount {formatCurrency(effectiveDiscountAmount)} ({discountPercentage.toFixed(2)}%)
                  {' '}to sales manager or supervisor for approval.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add a discount to this quotation first, then send the request for approval.
                </p>
              )}
              {hasPendingApprovalRequest && (
                <p className="mt-1 text-sm text-amber-600">
                  Approval request already sent and is pending review.
                </p>
              )}
              {hasApprovedDiscountRequest && (
                <p className="mt-1 text-sm text-green-600">
                  Discount request already approved.
                </p>
              )}
            </div>
            <Button
              onClick={() => setRequestApprovalDialogOpen(true)}
              disabled={!canRequestApproval}
            >
              <Send className="mr-2 h-4 w-4" />
              Request Additional Discount
            </Button>
          </CardContent>
        </Card>
      )}

      {(canPassToCashier || canAllocateDeposit) && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium">Deposit Workflow</p>
              {canPassToCashier ? (
                <p className="text-sm text-muted-foreground">
                  Pass this enquiry to cashier/superior for deposit handling.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Enquiry already passed to cashier. Allocate deposit once received.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canPassToCashier && (
                <Button onClick={() => setPassToCashierDialogOpen(true)}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Pass To Cashier
                </Button>
              )}
              {canAllocateDeposit && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/open-deposits')}
                  >
                    Open Deposits Received
                  </Button>
                  <Button onClick={() => setAllocateDepositDialogOpen(true)}>
                    <CircleDollarSign className="mr-2 h-4 w-4" />
                    Allocate Deposit
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-medium">Sales Order</p>
            <p className="text-sm text-muted-foreground">
              Create a provisional sales order from this quotation when needed.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/sales-order?quotationId=${quotationId}`)}
            disabled={isTerminalStatus}
          >
            <FileText className="mr-2 h-4 w-4" />
            Create Sales Order
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">Vehicle Reservation</p>
              <p className="text-sm text-muted-foreground">
                Reserve the selected VIN directly from this quotation.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">VIN</p>
                <p className="font-medium">{quotation.VIN_NUMBER || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reservation Status</p>
                <p className="font-medium">{isVehicleReserved ? 'Reserved' : 'Not Reserved'}</p>
              </div>
              {quotation.VEHICLE_RESERVED_DATE && (
                <div>
                  <p className="text-muted-foreground">Reserved On</p>
                  <p className="font-medium">{formatDate(quotation.VEHICLE_RESERVED_DATE)}</p>
                </div>
              )}
              {quotation.VEHICLE_RESERVED_BY && (
                <div>
                  <p className="text-muted-foreground">Reserved By</p>
                  <p className="font-medium">{quotation.VEHICLE_RESERVED_BY}</p>
                </div>
              )}
              {isVehicleReserved && (
                <div>
                  <p className="text-muted-foreground">Reserved From</p>
                  <p className="font-medium">{displayReservationFrom || 'Not set'}</p>
                </div>
              )}
              {isVehicleReserved && (
                <div>
                  <p className="text-muted-foreground">Reserved To</p>
                  <p className="font-medium">{displayReservationTo || 'Not set'}</p>
                </div>
              )}
              {displayReservationNotes && (
                <div>
                  <p className="text-muted-foreground">Reservation Notes</p>
                  <p className="font-medium whitespace-pre-wrap">{displayReservationNotes}</p>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setReserveVehicleDialogOpen(true)}
            disabled={!canReserveVehicle}
          >
            <Lock className="mr-2 h-4 w-4" />
            Reserve Vehicle
          </Button>
        </CardContent>
      </Card>

      {canCancel && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium">Cancel Quotation</p>
              <p className="text-sm text-muted-foreground">
                Stop this quotation from continuing in the sales flow.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
              <CircleX className="mr-2 h-4 w-4" />
              Cancel Quotation
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{quotation.CUSTOMER_NAME || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mobile</p>
              <p className="font-medium">{quotation.CUSTOMER_MOBILE || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{quotation.CUSTOMER_EMAIL || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{quotation.CUSTOMER_ADDRESS || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Make</p>
              <p className="font-medium">{quotation.VEHICLE_MAKE || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium">{quotation.VEHICLE_MODEL || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Variant</p>
              <p className="font-medium">{quotation.VEHICLE_VARIANT || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Year</p>
              <p className="font-medium">{quotation.VEHICLE_YEAR || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Color</p>
              <p className="font-medium">{quotation.VEHICLE_COLOR || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">VIN</p>
              <p className="font-medium">{quotation.VIN_NUMBER || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Net Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.lineItems && quotation.lineItems.length > 0 ? (
                quotation.lineItems.map((item, index) => (
                  <TableRow key={item.SLNO || index}>
                    <TableCell>{item.LINE_NUMBER || index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.ITEM_DESCRIPTION}</p>
                        {item.NOTES && (
                          <p className="text-sm text-muted-foreground">{item.NOTES}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.QUANTITY}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.UNIT_PRICE)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.DISCOUNT_AMOUNT)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.NET_PRICE)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No line items
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(effectiveSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT ({quotation.TAX_RATE}%)</span>
              <span className="font-medium">{formatCurrency(effectiveTaxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Grand Total</span>
              <span className="font-bold">{formatCurrency(effectiveGrandTotal)}</span>
            </div>

            {(quotation.TRADE_IN_VALUE && Number(quotation.TRADE_IN_VALUE) > 0) && (
              <>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trade-in Value</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(quotation.TRADE_IN_VALUE)}
                  </span>
                </div>
              </>
            )}

            {(quotation.DOWNPAYMENT && Number(quotation.DOWNPAYMENT) > 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Downpayment</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(quotation.DOWNPAYMENT)}
                </span>
              </div>
            )}

            {((quotation.TRADE_IN_VALUE && Number(quotation.TRADE_IN_VALUE) > 0) ||
              (quotation.DOWNPAYMENT && Number(quotation.DOWNPAYMENT) > 0)) && (
              <>
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Net Amount Due</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(effectiveNetAmountDue)}
                  </span>
                </div>
              </>
            )}

            {effectiveDiscountAmount < 0 && (
              <>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Discount</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(effectiveDiscountAmount)}
                    {quotation.DISCOUNT_PERCENTAGE > 0 && ` (${quotation.DISCOUNT_PERCENTAGE}%)`}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      {(quotation.VALID_UNTIL || quotation.NOTES || quotation.TERMS_AND_CONDITIONS) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quotation.VALID_UNTIL && (
              <div>
                <p className="text-sm text-muted-foreground">Valid Until</p>
                <p className="font-medium">
                  {new Date(quotation.VALID_UNTIL).toLocaleDateString()}
                </p>
              </div>
            )}

            {quotation.NOTES && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="whitespace-pre-wrap">{quotation.NOTES}</p>
              </div>
            )}

            {quotation.TERMS_AND_CONDITIONS && (
              <div>
                <p className="text-sm text-muted-foreground">Terms & Conditions</p>
                <p className="whitespace-pre-wrap text-sm">{quotation.TERMS_AND_CONDITIONS}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => handleDelete()}
        title="Delete Quotation"
        description={`Are you sure you want to delete quotation ${displayQuotationNumber}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />

      {!isTerminalStatus && (
        <RequestDiscountApprovalDialog
          open={requestApprovalDialogOpen}
          onOpenChange={setRequestApprovalDialogOpen}
          quotationId={quotationId}
          discountAmount={effectiveDiscountAmount}
          discountPercentage={discountPercentage}
          quotationSubtotal={effectiveSubtotal}
          onSuccess={() => {
            void refetch();
          }}
        />
      )}

      {canPassToCashier && (
        <PassToCashierDialog
          open={passToCashierDialogOpen}
          onOpenChange={setPassToCashierDialogOpen}
          quotationId={quotationId}
          initialDepositAmount={Number(quotation.DEPOSIT_AMOUNT || 0)}
          onSuccess={() => {
            void refetch();
          }}
        />
      )}

      {canAllocateDeposit && (
        <AllocateDepositDialog
          open={allocateDepositDialogOpen}
          onOpenChange={setAllocateDepositDialogOpen}
          quotationId={quotationId}
          defaultAmount={Number(quotation.DEPOSIT_AMOUNT || 0)}
          onSuccess={() => {
            void refetch();
          }}
        />
      )}

      <CancelQuotationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        quotationNumber={displayQuotationNumber}
        isCancelling={isCancelling}
        onConfirm={async (reason) => {
          await handleCancel({ cancellationReason: reason });
        }}
      />

      <Dialog open={reserveVehicleDialogOpen} onOpenChange={setReserveVehicleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Vehicle</DialogTitle>
            <DialogDescription>
              Reserve VIN {quotation.VIN_NUMBER || '-'} from this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quotation-reserve-vehicle-from-date">Reservation From</Label>
              <Input
                id="quotation-reserve-vehicle-from-date"
                type="date"
                value={reservationFromDate}
                onChange={(e) => setReservationFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quotation-reserve-vehicle-to-date">Reservation To</Label>
              <Input
                id="quotation-reserve-vehicle-to-date"
                type="date"
                value={reservationToDate}
                min={reservationFromDate || undefined}
                onChange={(e) => setReservationToDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quotation-reserve-vehicle-notes">Reservation Notes</Label>
            <Textarea
              id="quotation-reserve-vehicle-notes"
              rows={4}
              value={reservationNotes}
              onChange={(e) => setReservationNotes(e.target.value)}
              placeholder="Optional notes for reservation"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReserveVehicleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleReserveVehicle()} disabled={isReservingVehicle}>
              {isReservingVehicle ? 'Reserving...' : 'Reserve Vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
