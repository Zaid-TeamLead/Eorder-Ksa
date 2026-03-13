'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarCheck2,
  CircleX,
  FilePenLine,
  Lock,
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
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useSalesOrderById } from '@/hooks/entities/useSalesOrders';
import { useSalesOrderMutations } from '@/hooks/entities/useSalesOrderMutations';

export default function SalesOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number.parseInt(params.id as string, 10);

  const { salesOrder, isLoading, error } = useSalesOrderById(orderId);
  const {
    updateSalesOrder,
    passToVehicleAdmin,
    reserveVehicle,
    createHandoverBooking,
    recordLostSale,
    cancelSalesOrder,
    isUpdating,
    isPassingToVehicleAdmin,
    isReservingVehicle,
    isCreatingHandoverBooking,
    isRecordingLostSale,
    isCancelling,
  } = useSalesOrderMutations();

  const [isEditNotesOpen, setIsEditNotesOpen] = useState(false);
  const [isReserveVehicleOpen, setIsReserveVehicleOpen] = useState(false);
  const [isPassToVehicleAdminOpen, setIsPassToVehicleAdminOpen] = useState(false);
  const [isCreateHandoverOpen, setIsCreateHandoverOpen] = useState(false);
  const [isRecordLostOpen, setIsRecordLostOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const [notesDraft, setNotesDraft] = useState('');
  const [vinDraft, setVinDraft] = useState('');
  const [reservationNotes, setReservationNotes] = useState('');
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
  const isVehicleReserved = salesOrder.VEHICLE_RESERVED === 'Y';
  const canPrint = status !== 'Cancelled' && status !== 'Lost';
  const canReserveVehicle =
    !isVehicleReserved &&
    status !== 'Cancelled' &&
    status !== 'Lost' &&
    !!salesOrder.VIN_NUMBER?.trim();
  const canPassToVehicleAdmin = status === 'Printed' || status === 'PassedToVehicleAdmin';
  const canCreateHandover =
    (status === 'PassedToVehicleAdmin' || status === 'HandoverBooked') &&
    salesOrder.PASSED_TO_VEHICLE_ADMIN === 'Y';
  const canRecordLost = status !== 'Cancelled' && status !== 'Lost';
  const canCancel = status !== 'Cancelled' && status !== 'Lost';

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

  const handleReserveVehicle = async () => {
    await reserveVehicle(orderId, {
      reservationNotes: reservationNotes || undefined,
    });
    setIsReserveVehicleOpen(false);
    setReservationNotes('');
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
                  onClick={() => setIsReserveVehicleOpen(true)}
                  disabled={!canReserveVehicle}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Reserve Vehicle
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
              salesOrder.VEHICLE_RESERVED === 'Y' ||
              salesOrder.VEHICLE_RESERVED_DATE ||
              salesOrder.PASSED_TO_VA_DATE ||
              salesOrder.HANDOVER_BOOKED === 'Y' ||
              salesOrder.HANDOVER_DATE ||
              salesOrder.LOST_REASON ||
              salesOrder.CANCELLATION_REASON) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  {salesOrder.VEHICLE_RESERVED === 'Y' && (
                    <div>
                      <p className="text-muted-foreground">Vehicle Reservation</p>
                      <p className="font-medium">Reserved</p>
                    </div>
                  )}
                  {salesOrder.VEHICLE_RESERVED_DATE && (
                    <div>
                      <p className="text-muted-foreground">Vehicle Reserved On</p>
                      <p className="font-medium">{formatDate(salesOrder.VEHICLE_RESERVED_DATE)}</p>
                    </div>
                  )}
                  {salesOrder.VEHICLE_RESERVED_BY && (
                    <div>
                      <p className="text-muted-foreground">Reserved By</p>
                      <p className="font-medium">{salesOrder.VEHICLE_RESERVED_BY}</p>
                    </div>
                  )}
                  {salesOrder.VEHICLE_ADMIN_ASSIGNED_TO && (
                    <div>
                      <p className="text-muted-foreground">Vehicle Admin Assignee</p>
                      <p className="font-medium">{salesOrder.VEHICLE_ADMIN_ASSIGNED_TO}</p>
                    </div>
                  )}
                  {salesOrder.VEHICLE_RESERVATION_NOTES && (
                    <div>
                      <p className="text-muted-foreground">Reservation Notes</p>
                      <p className="font-medium">{salesOrder.VEHICLE_RESERVATION_NOTES}</p>
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

      <Dialog open={isReserveVehicleOpen} onOpenChange={setIsReserveVehicleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Vehicle</DialogTitle>
            <DialogDescription>
              Reserve VIN {salesOrder.VIN_NUMBER || '-'} for this sales order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reserve-vehicle-notes">Reservation Notes</Label>
            <Textarea
              id="reserve-vehicle-notes"
              rows={4}
              value={reservationNotes}
              onChange={(e) => setReservationNotes(e.target.value)}
              placeholder="Optional notes for reservation"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReserveVehicleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleReserveVehicle()} disabled={isReservingVehicle}>
              {isReservingVehicle ? 'Reserving...' : 'Reserve Vehicle'}
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
              <Input
                id="vehicle-admin-assigned-to"
                value={vehicleAdminAssignedTo}
                onChange={(e) => setVehicleAdminAssignedTo(e.target.value)}
                placeholder="Vehicle admin name or ID"
              />
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
