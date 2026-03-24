'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { formatDate } from '@/lib/formatters';
import { MOCK_DRIVERS, MOCK_VEHICLES } from '@/services/dispatchMock';
import { useDispatchMockStore } from '@/hooks/dispatch/useDispatchMockStore';
import type { DispatchStatus } from '@/types/dispatch';

const statusVariant = (status: DispatchStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'Completed':
      return 'default';
    case 'Partially Completed':
    case 'POD Submitted':
    case 'In Transit':
      return 'secondary';
    case 'Pending':
    case 'Dispatched':
    default:
      return 'outline';
  }
};

export default function DispatchPODPage() {
  const router = useRouter();
  const { dispatches, isLoading, create } = useDispatchMockStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    loadingNo: '',
    date: new Date().toISOString().slice(0, 10),
    driver: '',
    vehicle: '',
    externalDriverName: '',
    externalVehicleNo: '',
    externalVendor: '',
    remarks: '',
  });

  if (isLoading) {
    return <LoadingState message="Loading dispatch mock data..." />;
  }

  const handleCreate = () => {
    if (!form.loadingNo.trim() || !form.date || !form.driver || !form.vehicle) {
      return;
    }

    const created = create(form);
    setIsCreateOpen(false);
    setForm({
      loadingNo: '',
      date: new Date().toISOString().slice(0, 10),
      driver: '',
      vehicle: '',
      externalDriverName: '',
      externalVehicleNo: '',
      externalVendor: '',
      remarks: '',
    });

    router.push(`/dashboard/dispatch-pod/${created.id}`);
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Consolidated Dispatch Confirmation</CardTitle>
              <CardDescription>
                Mock flow: Dispatch + Delivery Notes + POD in one process
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Dispatch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dispatches.length === 0 ? (
            <ErrorState
              title="No Dispatch Records"
              message="Create a dispatch to start the end-to-end Dispatch and POD flow."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Ref No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>DNotes</TableHead>
                    <TableHead>Log</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.map((dispatch, index) => (
                    <TableRow key={dispatch.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{dispatch.refNo}</TableCell>
                      <TableCell>{formatDate(dispatch.date)}</TableCell>
                      <TableCell>{dispatch.vehicle || 'N/A'}</TableCell>
                      <TableCell>{dispatch.driver || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(dispatch.status)}>{dispatch.status}</Badge>
                      </TableCell>
                      <TableCell>{dispatch.lines.length}</TableCell>
                      <TableCell>{formatDate(dispatch.updatedAt, { includeTime: true })}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/dispatch-pod/${dispatch.id}`)}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Dispatch</DialogTitle>
            <DialogDescription>
              Create dispatch header first, then add DNotes and complete POD.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="loading-no">Loading No *</Label>
              <Input
                id="loading-no"
                value={form.loadingNo}
                onChange={(e) => setForm((prev) => ({ ...prev, loadingNo: e.target.value }))}
                placeholder="e.g. 20001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dispatch-date">Date *</Label>
              <Input
                id="dispatch-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Driver *</Label>
              <Select
                value={form.driver}
                onValueChange={(value) => setForm((prev) => ({ ...prev, driver: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_DRIVERS.map((driver) => (
                    <SelectItem key={driver} value={driver}>
                      {driver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle *</Label>
              <Select
                value={form.vehicle}
                onValueChange={(value) => setForm((prev) => ({ ...prev, vehicle: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_VEHICLES.map((vehicle) => (
                    <SelectItem key={vehicle} value={vehicle}>
                      {vehicle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="external-driver-name">External Driver Name</Label>
              <Input
                id="external-driver-name"
                value={form.externalDriverName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, externalDriverName: e.target.value }))
                }
                placeholder="External driver"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="external-vehicle-no">External Vehicle No.</Label>
              <Input
                id="external-vehicle-no"
                value={form.externalVehicleNo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, externalVehicleNo: e.target.value }))
                }
                placeholder="Vehicle number"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="external-vendor">External Vendor</Label>
              <Input
                id="external-vendor"
                value={form.externalVendor}
                onChange={(e) => setForm((prev) => ({ ...prev, externalVendor: e.target.value }))}
                placeholder="Vendor code/name"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={form.remarks}
                onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder="Dispatch remarks"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.loadingNo.trim() || !form.date || !form.driver || !form.vehicle}
            >
              Create & Open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
