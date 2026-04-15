'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarCheck2,
  CircleX,
  FilePenLine,
  Printer,
  Send,
  TriangleAlert,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useSalesOrderById } from '@/hooks/entities/useSalesOrders';
import { useSalesOrderMutations } from '@/hooks/entities/useSalesOrderMutations';
import { useSalesEmployees } from '@/hooks/entities/useSalesEmployees';

export default function SalesOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number.parseInt(params.id as string, 10);

  const { salesOrder, isLoading, error } = useSalesOrderById(orderId);
  const { salesEmployees, isLoading: isLoadingSalesEmployees } = useSalesEmployees();
  const {
    updateSalesOrder,
    passToVehicleAdmin,
    createHandoverBooking,
    recordLostSale,
    cancelSalesOrder,
    isUpdating,
    isPassingToVehicleAdmin,
    isCreatingHandoverBooking,
    isRecordingLostSale,
    isCancelling,
  } = useSalesOrderMutations();

  const [isEditNotesOpen, setIsEditNotesOpen] = useState(false);
  const [isPassToVehicleAdminOpen, setIsPassToVehicleAdminOpen] = useState(false);
  const [isCreateHandoverOpen, setIsCreateHandoverOpen] = useState(false);
  const [isRecordLostOpen, setIsRecordLostOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const [notesDraft, setNotesDraft] = useState('');
  const [vinDraft, setVinDraft] = useState('');
  const [vehicleAdminAssignedTo, setVehicleAdminAssignedTo] = useState('');
  const [vehicleAdminNotes, setVehicleAdminNotes] = useState('');
  const [handoverDate, setHandoverDate] = useState('');
  const [handoverTime, setHandoverTime] = useState('');
  const [handoverLocation, setHandoverLocation] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [lostNotes, setLostNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (!salesOrder) return;
    setNotesDraft(salesOrder.NOTES || '');
    setVinDraft(salesOrder.VIN_NUMBER || '');
  }, [salesOrder]);

  if (isLoading) {
    return <LoadingState message="Loading sales order..." />;
  }

  if (error || !salesOrder) {
    return (
      <ErrorState
        title="Sales Order Not Found"
        message="The sales order does not exist or you don't have permission to view it."
      />
    );
  }

  const status = salesOrder.STATUS;
  const canPrint = status !== 'Cancelled' && status !== 'Lost';
  const canPassToVehicleAdmin = status === 'Printed' || status === 'PassedToVehicleAdmin';
  const canCreateHandover =
    (status === 'PassedToVehicleAdmin' || status === 'HandoverBooked') &&
    salesOrder.PASSED_TO_VEHICLE_ADMIN === 'Y';
  const canRecordLost = status !== 'Cancelled' && status !== 'Lost';
  const canCancel = status !== 'Cancelled' && status !== 'Lost';
  const quotation = salesOrder.quotation;
  const enquiry = salesOrder.enquiry;
  const lineItems = salesOrder.lineItems || [];
  const financingSchemes = salesOrder.financingSchemes || [];

  const formatOptionalCurrency = (value: unknown) => {
    if (value === undefined || value === null || value === '') return 'N/A';
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? String(value) : formatCurrency(numericValue);
  };

  const toNumber = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const lineItemsDiscountTotal = lineItems.reduce(
    (sum, item) => sum + toNumber(item.DISCOUNT_AMOUNT),
    0
  );
  const effectiveVehicleDiscount =
    toNumber(quotation?.VEHICLE_DISCOUNT) !== 0
      ? toNumber(quotation?.VEHICLE_DISCOUNT)
      : lineItemsDiscountTotal;

  const customerDetails = [
    { label: 'Customer ID', value: enquiry?.CUSTOMERID || 'N/A' },
    { label: 'Email', value: salesOrder.CUSTOMER_EMAIL || 'N/A' },
    { label: 'Address', value: quotation?.CUSTOMER_ADDRESS || enquiry?.ADDRESS || 'N/A' },
    { label: 'Postcode', value: enquiry?.POSTCODE || 'N/A' },
    { label: 'Branch', value: enquiry?.BRANCHNAME || enquiry?.BRANCH || 'N/A' },
    { label: 'Salesperson', value: enquiry?.SALESPERSON || salesOrder.SLPCODE || 'N/A' },
  ];

  const vehicleDetails = [
    { label: 'Year', value: quotation?.VEHICLE_YEAR || enquiry?.YEAR || 'N/A' },
    { label: 'Color', value: quotation?.VEHICLE_COLOR || enquiry?.COLOR || 'N/A' },
    { label: 'Model Code', value: enquiry?.MODELCODE || 'N/A' },
    { label: 'Supp Cat Num', value: enquiry?.SUPPCATNUM || 'N/A' },
    { label: 'Quantity', value: enquiry?.QUANTITY || 'N/A' },
    { label: 'Budget', value: enquiry?.BUDGET || 'N/A' },
  ];

  const pricingDetails = [
    { label: 'Vehicle Base Price', value: formatOptionalCurrency(quotation?.VEHICLE_BASE_PRICE) },
    { label: 'Vehicle Discount', value: formatOptionalCurrency(effectiveVehicleDiscount) },
    { label: 'Vehicle Net Price', value: formatOptionalCurrency(quotation?.VEHICLE_NET_PRICE) },
    { label: 'Accessories Total', value: formatOptionalCurrency(quotation?.ACCESSORIES_TOTAL) },
    { label: 'Accessories Discount', value: formatOptionalCurrency(quotation?.ACCESSORIES_DISCOUNT) },
    { label: 'Accessories Net', value: formatOptionalCurrency(quotation?.ACCESSORIES_NET_TOTAL) },
    { label: 'Warranty', value: formatOptionalCurrency(quotation?.WARRANTY_TOTAL) },
    { label: 'Insurance', value: formatOptionalCurrency(quotation?.INSURANCE_TOTAL) },
    { label: 'Subtotal', value: formatOptionalCurrency(quotation?.SUBTOTAL) },
    { label: 'Tax Amount', value: formatOptionalCurrency(quotation?.TAX_AMOUNT) },
    { label: 'Downpayment', value: formatOptionalCurrency(quotation?.DOWNPAYMENT) },
    { label: 'Net Amount Due', value: formatOptionalCurrency(quotation?.NET_AMOUNT_DUE) },
  ];
  const salesEmployeeOptions = salesEmployees.map((employee) => {
    const code = String(employee.SALES_EMPLOYEE_CODE || '').trim();
    const name = String(employee.SALES_EMPLOYEE_NAME || '').trim();

    return {
      value: [code, name].filter(Boolean).join(' - ') || name || code,
      label: [code, name].filter(Boolean).join(' - ') || name || code,
    };
  });

  const handleSaveOrderDetails = async () => {
    const payload: { notes?: string; vinNumber?: string } = {
      notes: notesDraft,
    };

    if (vinDraft.trim()) {
      payload.vinNumber = vinDraft.trim();
    }

    await updateSalesOrder(orderId, payload);
    setIsEditNotesOpen(false);
  };

  const handlePassToVehicleAdmin = async () => {
    await passToVehicleAdmin(orderId, {
      assignedTo: vehicleAdminAssignedTo,
      notes: vehicleAdminNotes || undefined,
    });
    setIsPassToVehicleAdminOpen(false);
    setVehicleAdminAssignedTo('');
    setVehicleAdminNotes('');
  };

  const handleCreateHandoverBooking = async () => {
    await createHandoverBooking(orderId, {
      handoverDate,
      handoverTime: handoverTime || undefined,
      handoverLocation: handoverLocation || undefined,
      notes: handoverNotes || undefined,
    });
    setIsCreateHandoverOpen(false);
    setHandoverDate('');
    setHandoverTime('');
    setHandoverLocation('');
    setHandoverNotes('');
  };

  const handleRecordLostSale = async () => {
    await recordLostSale(orderId, {
      lostReason,
      notes: lostNotes || undefined,
    });
    setIsRecordLostOpen(false);
    setLostReason('');
    setLostNotes('');
  };

  const handleCancelOrder = async () => {
    await cancelSalesOrder(orderId, { cancellationReason });
    setIsCancelOpen(false);
    setCancellationReason('');
  };

  return (
    <div className="container mx-auto py-6">
      <Button variant="ghost" onClick={() => router.push('/dashboard/sales-order')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Sales Orders
      </Button>

      <div className="mt-4 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Sales Order {salesOrder.SALES_ORDER_NUMBER}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Created {formatDate(salesOrder.CREATED_DATE)} by {salesOrder.CREATED_BY}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{salesOrder.STATUS}</Badge>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/sales-order/print/${salesOrder.SLNO}`)
                  }
                  disabled={!canPrint}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPassToVehicleAdminOpen(true)}
                  disabled={!canPassToVehicleAdmin}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Pass to Vehicle Admin
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateHandoverOpen(true)}
                  disabled={!canCreateHandover}
                >
                  <CalendarCheck2 className="mr-2 h-4 w-4" />
                  Create Handover Booking
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsRecordLostOpen(true)}
                  disabled={!canRecordLost}
                >
                  <TriangleAlert className="mr-2 h-4 w-4" />
                  Record Lost Sale
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsCancelOpen(true)}
                  disabled={!canCancel}
                >
                  <CircleX className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Quotation ID</p>
                <p className="font-medium">#{salesOrder.QUOTATION_SLNO}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Enquiry ID</p>
                <p className="font-medium">#{salesOrder.ENQUIRY_SLNO}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{salesOrder.CUSTOMER_NAME || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Mobile</p>
                <p className="font-medium">{salesOrder.CUSTOMER_MOBILE || 'N/A'}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Vehicle</p>
                <p className="font-medium">
                  {`${salesOrder.VEHICLE_MAKE || ''} ${salesOrder.VEHICLE_MODEL || ''}`.trim() ||
                    'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Variant</p>
                <p className="font-medium">{salesOrder.VEHICLE_VARIANT || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">VIN</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{salesOrder.VIN_NUMBER || 'N/A'}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setIsEditNotesOpen(true)}
                  >
                    Set VIN
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Grand Total</p>
                <p className="font-semibold">{formatCurrency(salesOrder.GRAND_TOTAL)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Internal Notes</p>
                <Button variant="ghost" size="sm" onClick={() => setIsEditNotesOpen(true)}>
                  <FilePenLine className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
              </div>
              <p className="whitespace-pre-wrap rounded-md border bg-muted/20 p-3">
                {salesOrder.NOTES || 'No notes added.'}
              </p>
            </div>

            {(salesOrder.VEHICLE_ADMIN_ASSIGNED_TO ||
              salesOrder.PASSED_TO_VA_DATE ||
              salesOrder.HANDOVER_BOOKED === 'Y' ||
              salesOrder.HANDOVER_DATE ||
              salesOrder.LOST_REASON ||
              salesOrder.CANCELLATION_REASON) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  {salesOrder.VEHICLE_ADMIN_ASSIGNED_TO && (
                    <div>
                      <p className="text-muted-foreground">Vehicle Admin Assignee</p>
                      <p className="font-medium">{salesOrder.VEHICLE_ADMIN_ASSIGNED_TO}</p>
                    </div>
                  )}
                  {salesOrder.PASSED_TO_VA_DATE && (
                    <div>
                      <p className="text-muted-foreground">Passed to Vehicle Admin On</p>
                      <p className="font-medium">{formatDate(salesOrder.PASSED_TO_VA_DATE)}</p>
                    </div>
                  )}
                  {salesOrder.HANDOVER_BOOKED === 'Y' && (
                    <div>
                      <p className="text-muted-foreground">Handover Booking</p>
                      <p className="font-medium">Booked</p>
                    </div>
                  )}
                  {salesOrder.HANDOVER_DATE && (
                    <div>
                      <p className="text-muted-foreground">Handover Date</p>
                      <p className="font-medium">{formatDate(salesOrder.HANDOVER_DATE)}</p>
                    </div>
                  )}
                  {salesOrder.HANDOVER_TIME && (
                    <div>
                      <p className="text-muted-foreground">Handover Time</p>
                      <p className="font-medium">{salesOrder.HANDOVER_TIME}</p>
                    </div>
                  )}
                  {salesOrder.HANDOVER_LOCATION && (
                    <div>
                      <p className="text-muted-foreground">Handover Location</p>
                      <p className="font-medium">{salesOrder.HANDOVER_LOCATION}</p>
                    </div>
                  )}
                  {salesOrder.HANDOVER_BOOKED_BY && (
                    <div>
                      <p className="text-muted-foreground">Handover Booked By</p>
                      <p className="font-medium">{salesOrder.HANDOVER_BOOKED_BY}</p>
                    </div>
                  )}
                  {salesOrder.HANDOVER_NOTES && (
                    <div>
                      <p className="text-muted-foreground">Handover Notes</p>
                      <p className="font-medium">{salesOrder.HANDOVER_NOTES}</p>
                    </div>
                  )}
                  {salesOrder.LOST_REASON && (
                    <div>
                      <p className="text-muted-foreground">Lost Reason</p>
                      <p className="font-medium">{salesOrder.LOST_REASON}</p>
                    </div>
                  )}
                  {salesOrder.CANCELLATION_REASON && (
                    <div>
                      <p className="text-muted-foreground">Cancellation Reason</p>
                      <p className="font-medium">{salesOrder.CANCELLATION_REASON}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer And Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Customer
              </h3>
              <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
                {customerDetails.map((item) => (
                  <div key={item.label}>
                    <p className="text-muted-foreground">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Vehicle
              </h3>
              <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
                {vehicleDetails.map((item) => (
                  <div key={item.label}>
                    <p className="text-muted-foreground">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {(enquiry?.CHARGENAME || enquiry?.CHARGECODE || enquiry?.CHARGEPRICE) && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Charge
                  </h3>
                  <div className="grid gap-4 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Charge Code</p>
                      <p className="font-medium">{enquiry?.CHARGECODE || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Charge Name</p>
                      <p className="font-medium">{enquiry?.CHARGENAME || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Charge Price</p>
                      <p className="font-medium">
                        {formatOptionalCurrency(enquiry?.CHARGEPRICE)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
              {pricingDetails.map((item) => (
                <div key={item.label}>
                  <p className="text-muted-foreground">{item.label}</p>
                  <p className="font-medium">{item.value}</p>
                </div>
              ))}
              <div>
                <p className="text-muted-foreground">Tax Rate</p>
                <p className="font-medium">
                  {quotation?.TAX_RATE !== undefined && quotation?.TAX_RATE !== null
                    ? `${quotation.TAX_RATE}%`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Trade-In Value</p>
                <p className="font-medium">{formatOptionalCurrency(quotation?.TRADE_IN_VALUE)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Grand Total</p>
                <p className="font-semibold">{formatOptionalCurrency(quotation?.GRAND_TOTAL)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {lineItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quotation Line Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lineItems.map((item) => (
                <div
                  key={item.SLNO || `${item.LINE_NUMBER}-${item.ITEM_CODE || item.ITEM_DESCRIPTION}`}
                  className="rounded-lg border p-4"
                >
                  <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">Line</p>
                      <p className="font-medium">{item.LINE_NUMBER || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Item</p>
                      <p className="font-medium">{item.ITEM_CODE || item.ITEM_TYPE || 'N/A'}</p>
                    </div>
                    <div className="lg:col-span-2">
                      <p className="text-muted-foreground">Description</p>
                      <p className="font-medium">{item.ITEM_DESCRIPTION || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">{item.QUANTITY ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unit Price</p>
                      <p className="font-medium">{formatOptionalCurrency(item.UNIT_PRICE)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Discount</p>
                      <p className="font-medium">
                        {formatOptionalCurrency(item.DISCOUNT_AMOUNT)}
                        {item.DISCOUNT_PERCENTAGE !== undefined &&
                        item.DISCOUNT_PERCENTAGE !== null
                          ? ` (${item.DISCOUNT_PERCENTAGE}%)`
                          : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net Price</p>
                      <p className="font-semibold">{formatOptionalCurrency(item.NET_PRICE)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {financingSchemes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Financing Schemes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {financingSchemes.map((scheme) => (
                <div key={scheme.SLNO} className="rounded-lg border p-4">
                  <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">Lender</p>
                      <p className="font-medium">{scheme.LENDER_NAME || scheme.LENDER_CODE || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Scheme</p>
                      <p className="font-medium">{scheme.SCHEME_NAME || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Currency</p>
                      <p className="font-medium">{scheme.CURRENCY || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sale Code</p>
                      <p className="font-medium">{scheme.SALE_CODE || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Term</p>
                      <p className="font-medium">
                        {scheme.TERM_MONTHS ? `${scheme.TERM_MONTHS} months` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interest Rate</p>
                      <p className="font-medium">
                        {scheme.INTEREST_RATE !== undefined && scheme.INTEREST_RATE !== null
                          ? `${scheme.INTEREST_RATE}%`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monthly Payment</p>
                      <p className="font-medium">
                        {formatOptionalCurrency(scheme.MONTHLY_PAYMENT)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Finance Amount</p>
                      <p className="font-medium">
                        {formatOptionalCurrency(scheme.FINANCE_AMOUNT)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isEditNotesOpen} onOpenChange={setIsEditNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Sales Order Details</DialogTitle>
            <DialogDescription>
              Update VIN and notes for this sales order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="sales-order-vin">VIN Number</Label>
            <Input
              id="sales-order-vin"
              value={vinDraft}
              onChange={(e) => setVinDraft(e.target.value)}
              placeholder="Enter VIN"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sales-order-notes">Notes</Label>
            <Textarea
              id="sales-order-notes"
              rows={6}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Add notes..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNotesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveOrderDetails()} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPassToVehicleAdminOpen}
        onOpenChange={setIsPassToVehicleAdminOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pass To Vehicle Admin</DialogTitle>
            <DialogDescription>
              Assign this sales order to vehicle admin for processing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-admin-assigned-to">Assigned To *</Label>
              <Select value={vehicleAdminAssignedTo} onValueChange={setVehicleAdminAssignedTo}>
                <SelectTrigger id="vehicle-admin-assigned-to">
                  <SelectValue
                    placeholder={
                      isLoadingSalesEmployees
                        ? 'Loading sales employees...'
                        : 'Select sales employee'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {salesEmployeeOptions.length > 0 ? (
                    salesEmployeeOptions.map((employee) => (
                      <SelectItem key={employee.value} value={employee.value}>
                        {employee.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_sales_employee__" disabled>
                      No sales employees found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-admin-notes">Notes</Label>
              <Textarea
                id="vehicle-admin-notes"
                rows={4}
                value={vehicleAdminNotes}
                onChange={(e) => setVehicleAdminNotes(e.target.value)}
                placeholder="Optional handover notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPassToVehicleAdminOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handlePassToVehicleAdmin()}
              disabled={isPassingToVehicleAdmin || !vehicleAdminAssignedTo.trim()}
            >
              {isPassingToVehicleAdmin ? 'Passing...' : 'Pass'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateHandoverOpen} onOpenChange={setIsCreateHandoverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Handover Booking</DialogTitle>
            <DialogDescription>
              Capture planned handover date and details for this sales order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="handover-date">Handover Date *</Label>
              <Input
                id="handover-date"
                type="date"
                value={handoverDate}
                onChange={(e) => setHandoverDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handover-time">Handover Time</Label>
              <Input
                id="handover-time"
                type="time"
                value={handoverTime}
                onChange={(e) => setHandoverTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handover-location">Handover Location</Label>
              <Input
                id="handover-location"
                value={handoverLocation}
                onChange={(e) => setHandoverLocation(e.target.value)}
                placeholder="Showroom / delivery location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handover-notes">Notes</Label>
              <Textarea
                id="handover-notes"
                rows={3}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Optional handover notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateHandoverOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreateHandoverBooking()}
              disabled={isCreatingHandoverBooking || !handoverDate.trim()}
            >
              {isCreatingHandoverBooking ? 'Saving...' : 'Create Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRecordLostOpen} onOpenChange={setIsRecordLostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record As Lost Sale</DialogTitle>
            <DialogDescription>
              Mark this sales order as lost and provide the reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lost-reason">Lost Reason *</Label>
              <Textarea
                id="lost-reason"
                rows={3}
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Reason why the sale was lost"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lost-notes">Additional Notes</Label>
              <Textarea
                id="lost-notes"
                rows={3}
                value={lostNotes}
                onChange={(e) => setLostNotes(e.target.value)}
                placeholder="Optional additional context"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecordLostOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleRecordLostSale()}
              disabled={isRecordingLostSale || !lostReason.trim()}
            >
              {isRecordingLostSale ? 'Saving...' : 'Record Lost Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Sales Order</DialogTitle>
            <DialogDescription>
              Cancel this sales order and capture the reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Cancellation Reason *</Label>
            <Textarea
              id="cancel-reason"
              rows={4}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Reason for cancellation"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleCancelOrder()}
              disabled={isCancelling || !cancellationReason.trim()}
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
