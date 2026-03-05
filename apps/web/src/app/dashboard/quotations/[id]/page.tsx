'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { formatCurrency } from '@/lib/formatters';
import { LoadingState } from '@/components/shared/loading-state';
import { QuotationStatusBadge } from '@/components/quotation/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { RequestDiscountApprovalDialog } from '@/components/quotation/request-discount-approval-dialog';

// Custom hooks
import { useQuotationActions } from '@/hooks/quotation/useQuotationActions';

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = parseInt(params.id as string, 10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestApprovalDialogOpen, setRequestApprovalDialogOpen] = useState(false);

  const { quotation, isLoading, error, refetch } = useQuotationById(quotationId);

  // Use custom hook for all actions
  const {
    handleBack,
    handleDelete,
    isDeleting,
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
  const lineItemsDiscountAmount = (quotation.lineItems || []).reduce(
    (sum, item) => sum + Number(item.DISCOUNT_AMOUNT || 0),
    0
  );
  // Fallback to line-item discounts when TOTAL_DISCOUNT_AMOUNT is not synced.
  const effectiveDiscountAmount =
    totalDiscountAmount !== 0 ? totalDiscountAmount : lineItemsDiscountAmount;
  const discountPercentage = Number(quotation.DISCOUNT_PERCENTAGE || 0);
  const canRequestApproval =
    effectiveDiscountAmount < 0 && quotation.DISCOUNT_APPROVAL_STATUS !== 'Approved';

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Quotation {quotation.QUOTATION_NUMBER}</h1>
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

      {canRequestApproval && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium">Discount Approval Required</p>
              <p className="text-sm text-muted-foreground">
                Discount {formatCurrency(effectiveDiscountAmount)} ({discountPercentage.toFixed(2)}%)
              </p>
            </div>
            <Button onClick={() => setRequestApprovalDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Request Approval
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
              <span className="font-medium">{formatCurrency(quotation.SUBTOTAL)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT ({quotation.TAX_RATE}%)</span>
              <span className="font-medium">{formatCurrency(quotation.TAX_AMOUNT)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Grand Total</span>
              <span className="font-bold">{formatCurrency(quotation.GRAND_TOTAL)}</span>
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
                    {formatCurrency(quotation.NET_AMOUNT_DUE)}
                  </span>
                </div>
              </>
            )}

            {quotation.TOTAL_DISCOUNT_AMOUNT && Number(quotation.TOTAL_DISCOUNT_AMOUNT) < 0 && (
              <>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Discount</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(quotation.TOTAL_DISCOUNT_AMOUNT)}
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
        description={`Are you sure you want to delete quotation ${quotation.QUOTATION_NUMBER}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />

      {canRequestApproval && (
        <RequestDiscountApprovalDialog
          open={requestApprovalDialogOpen}
          onOpenChange={setRequestApprovalDialogOpen}
          quotationId={quotationId}
          discountAmount={effectiveDiscountAmount}
          discountPercentage={discountPercentage}
          onSuccess={() => {
            void refetch();
          }}
        />
      )}
    </div>
  );
}
