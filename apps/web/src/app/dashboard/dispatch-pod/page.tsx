'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { formatDate } from '@/lib/formatters';
import { useDispatchStore } from '@/hooks/dispatch/useDispatchStore';
import { getAvailableDNotes, getDNoteByNo } from '@/services/dispatch';
import type { DeliveryNoteSource, DeliveryNoteVehicle, DispatchStatus } from '@/types/dispatch';

const statusVariant = (status: DispatchStatus): 'default' | 'secondary' | 'outline' => {
  switch (status) {
    case 'Completed':
      return 'default';
    case 'POD Submitted':
      return 'secondary';
    case 'Dispatched':
    default:
      return 'outline';
  }
};

const normalizeDateText = (value: string) => {
  const text = value.trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text;
};

const MAX_DNOTE_OPTIONS = 200;

export default function DispatchPODPage() {
  const router = useRouter();
  const { dispatches, getAvailableVehicles, create, isLoading, nextDispatchNo } = useDispatchStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [sourceDNoteId, setSourceDNoteId] = useState('');
  const [selectedDNoteSummary, setSelectedDNoteSummary] = useState<DeliveryNoteSource | null>(null);
  const [remarks, setRemarks] = useState('');
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);

  const { data: availableDNotes = [] } = useQuery({
    queryKey: ['dispatch-pod', 'dnotes', isCreateOpen, filterDateFrom, filterDateTo, customerFilter],
    queryFn: () =>
      getAvailableDNotes({
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
        search: customerFilter || undefined,
      }),
    enabled: isCreateOpen,
  });

  const filteredDNotes = useMemo(
    () => availableDNotes.sort((a, b) => b.dNoteNo.localeCompare(a.dNoteNo)),
    [availableDNotes]
  );

  const visibleDNotes = useMemo(() => {
    const selected = sourceDNoteId
      ? filteredDNotes.find((item) => item.id === sourceDNoteId || item.dNoteNo === sourceDNoteId)
      : null;
    const sliced = filteredDNotes.slice(0, MAX_DNOTE_OPTIONS);

    if (selected && !sliced.some((item) => item.id === selected.id)) {
      return [selected, ...sliced.slice(0, MAX_DNOTE_OPTIONS - 1)];
    }

    return sliced;
  }, [filteredDNotes, sourceDNoteId]);

  const { data: selectedDNoteDetail } = useQuery({
    queryKey: ['dispatch-pod', 'dnotes', 'detail', sourceDNoteId],
    queryFn: () => getDNoteByNo(sourceDNoteId),
    enabled: Boolean(sourceDNoteId),
  });

  const selectedDNote = selectedDNoteDetail || selectedDNoteSummary;

  const dispatchableVehicles = useMemo<DeliveryNoteVehicle[]>(
    () =>
      selectedDNote?.vehicles?.length
        ? selectedDNote.vehicles
        : sourceDNoteId
          ? getAvailableVehicles(sourceDNoteId)
          : [],
    [getAvailableVehicles, selectedDNote, sourceDNoteId]
  );

  const selectedQty = useMemo(
    () =>
      dispatchableVehicles
        .filter((vehicle) => selectedVehicleIds.includes(vehicle.id))
        .reduce((sum, vehicle) => sum + vehicle.qty, 0),
    [dispatchableVehicles, selectedVehicleIds]
  );

  const formatVinSummary = (dispatch: (typeof dispatches)[number]) => {
    if (dispatch.vehicles.length === 0) return dispatch.totalQty ? String(dispatch.totalQty) : '-';

    const vins = dispatch.vehicles
      .map((vehicle) => vehicle.vinNo)
      .filter(Boolean);

    if (vins.length <= 2) return vins.join(', ');
    return `${vins.slice(0, 2).join(', ')} +${vins.length - 2}`;
  };

  const resetCreateState = () => {
    setDispatchDate(new Date().toISOString().slice(0, 10));
    setFilterDateFrom('');
    setFilterDateTo('');
    setCustomerFilter('');
    setSourceDNoteId('');
    setSelectedDNoteSummary(null);
    setRemarks('');
    setSelectedVehicleIds([]);
  };

  const handleOpenCreate = () => {
    resetCreateState();
    setIsCreateOpen(true);
  };

  const handleDNoteChange = (value: string) => {
    setSourceDNoteId(value);
    const found = filteredDNotes.find((item) => item.id === value) || null;
    setSelectedDNoteSummary(found);
    setRemarks(found?.remarks || '');
    setSelectedVehicleIds([]);
  };

  const toggleVehicleSelection = (vehicleId: string, checked: boolean) => {
    setSelectedVehicleIds((current) =>
      checked ? [...current, vehicleId] : current.filter((item) => item !== vehicleId)
    );
  };

  const handleCreate = async () => {
    if (!selectedDNote || !selectedVehicleIds.length || !dispatchDate) {
      toast.error('Select DNote, dispatch date, and at least one VIN');
      return;
    }

    try {
      const created = await create({
        dispatchDate,
        dNoteNo: selectedDNote.dNoteNo,
        dndocEntry: selectedDNote.dndocEntry,
        dNoteDate: selectedDNote.dNoteDate,
        customerCode: selectedDNote.customerCode,
        customerName: selectedDNote.customerName,
        address: selectedDNote.address,
        salespersonName: selectedDNote.salespersonName,
        salespersonEmail: selectedDNote.salespersonEmail,
        soRef: selectedDNote.soRef,
        qty: selectedQty || selectedDNote.totalQty,
        remarks,
        vehicles: dispatchableVehicles
          .filter((vehicle) => selectedVehicleIds.includes(vehicle.id))
          .map((vehicle) => ({
            deliveryNo: vehicle.deliveryNo,
            soNo: vehicle.soNo,
            invoiceNo: vehicle.invoiceNo,
            vinNo: vehicle.vinNo,
            model: vehicle.model,
            qty: vehicle.qty,
          })),
      });

      setIsCreateOpen(false);
      resetCreateState();
      router.push(`/dashboard/dispatch-pod/${created.dispatchNo}?created=1`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create dispatch';
      toast.error(message);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading dispatch records..." />;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Vehicle Dispatch & POD</CardTitle>
              <CardDescription>
                Manage dispatch records and open POD details by dispatch number.
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Dispatch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dispatches.length === 0 ? (
            <ErrorState
              title="No Dispatch Records"
              message="Create a dispatch from a DNote to start the dispatch and POD flow."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Dispatch No</TableHead>
                    <TableHead>Dispatch Date</TableHead>
                    <TableHead>DNote No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>VINs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.map((dispatch, index) => (
                    <TableRow key={dispatch.id || dispatch.dispatchNo}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{dispatch.dispatchNo}</TableCell>
                      <TableCell>{formatDate(dispatch.dispatchDate)}</TableCell>
                      <TableCell>{dispatch.dNoteNo}</TableCell>
                      <TableCell className="min-w-[260px]">
                        {dispatch.customerCode} - {dispatch.customerName}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate" title={dispatch.vehicles.map((vehicle) => vehicle.vinNo).filter(Boolean).join(', ')}>
                        {formatVinSummary(dispatch)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(dispatch.status)}>{dispatch.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/dispatch-pod/${dispatch.dispatchNo}`)}
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Vehicle Dispatch Entry</DialogTitle>
            <DialogDescription>
              Select a DNote, then choose one or more VIN numbers that are still available for dispatch.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Dispatch No.</Label>
              <Input value={nextDispatchNo} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Dispatch Date</Label>
              <Input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Customer Name</Label>
              <Input
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                placeholder="Filter by CardName, CardCode, or DNote No"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>DNote No.</Label>
              <Select value={sourceDNoteId} onValueChange={handleDNoteChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select DNote" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {visibleDNotes.map((dnote) => (
                    <SelectItem key={dnote.id} value={dnote.id}>
                      {dnote.dNoteNo} | {dnote.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filteredDNotes.length > MAX_DNOTE_OPTIONS ? (
                <p className="text-xs text-muted-foreground">
                  Showing first {MAX_DNOTE_OPTIONS} of {filteredDNotes.length} DNotes. Use date or customer filters to narrow the list.
                </p>
              ) : null}
            </div>
          </div>

          {selectedDNote ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>DNote Date</Label>
                  <Input value={selectedDNote.dNoteDate} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Total Qty</Label>
                  <Input value={String(selectedQty || selectedDNote.totalQty)} readOnly />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Customer Code & Name</Label>
                  <Input
                    value={`${selectedDNote.customerCode} - ${selectedDNote.customerName}`}
                    readOnly
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Address</Label>
                  <Input value={selectedDNote.address} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>SO Ref.</Label>
                  <Input value={selectedDNote.soRef} readOnly />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Remarks</Label>
                  <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Vehicles</div>
                <div className="max-h-[320px] overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12" />
                        <TableHead>S.No</TableHead>
                        <TableHead>Del. Num</TableHead>
                        <TableHead>SO No</TableHead>
                        <TableHead>Inv No.</TableHead>
                        <TableHead>VIN No.</TableHead>
                        <TableHead>Model</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dispatchableVehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                            No vehicle lines were returned for this DNote. This may mean all VINs are already dispatched.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dispatchableVehicles.map((vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedVehicleIds.includes(vehicle.id)}
                                onCheckedChange={(checked) =>
                                  toggleVehicleSelection(vehicle.id, checked === true)
                                }
                              />
                            </TableCell>
                            <TableCell>{vehicle.serialNo}</TableCell>
                            <TableCell>{vehicle.deliveryNo}</TableCell>
                            <TableCell>{vehicle.soNo}</TableCell>
                            <TableCell>{vehicle.invoiceNo}</TableCell>
                            <TableCell>{vehicle.vinNo}</TableCell>
                            <TableCell>{vehicle.model}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Close
            </Button>
            <Button onClick={handleCreate}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
