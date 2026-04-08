'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { formatDate } from '@/lib/formatters';
import { queryKeys } from '@/lib/query-keys';
import { getDispatchByNo } from '@/services/dispatch';
import { useDispatchStore } from '@/hooks/dispatch/useDispatchStore';
import type { DispatchStatus } from '@/types/dispatch';

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

export default function DispatchPODDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const dispatchNo = Array.isArray(params.id) ? params.id[0] : params.id;
  const { saveHeader, submitPOD } = useDispatchStore();

  const { data: dispatch, isLoading } = useQuery({
    queryKey: queryKeys.dispatch.detail(dispatchNo || ''),
    queryFn: () => getDispatchByNo(dispatchNo || ''),
    enabled: !!dispatchNo,
  });

  const [remarks, setRemarks] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [podDraft, setPodDraft] = useState({
    invoice: false,
    insurance: false,
    warranty: false,
    deliveryCheckList: false,
    registrationPapers: false,
    vehicleKeys: false,
    vehicleManuals: false,
    receivedByName: '',
    receivedByMobile: '',
    deliveredBy: '',
    signature: '',
  });
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const startSignature = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    context.strokeStyle = '#111827';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    setIsDrawing(true);
    canvas.setPointerCapture(event.pointerId);
  };

  const moveSignature = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    context.stroke();
  };

  const endSignature = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    setIsDrawing(false);
    setPodDraft((prev) => ({
      ...prev,
      signature: canvas.toDataURL('image/png'),
    }));
  };

  const clearSignature = () => {
    clearSignatureCanvas();
    setPodDraft((prev) => ({ ...prev, signature: '' }));
  };

  useEffect(() => {
    if (!dispatch) return;

    setRemarks(dispatch.remarks || '');
    setDispatchDate(dispatch.dispatchDate || '');
    setPodDraft({
      invoice: dispatch.pod?.invoice || false,
      insurance: dispatch.pod?.insurance || false,
      warranty: dispatch.pod?.warranty || false,
      deliveryCheckList: dispatch.pod?.deliveryCheckList || false,
      registrationPapers: dispatch.pod?.registrationPapers || false,
      vehicleKeys: dispatch.pod?.vehicleKeys || false,
      vehicleManuals: dispatch.pod?.vehicleManuals || false,
      receivedByName: dispatch.pod?.receivedByName || '',
      receivedByMobile: dispatch.pod?.receivedByMobile || '',
      deliveredBy: dispatch.pod?.deliveredBy || '',
      signature: dispatch.pod?.signature || '',
    });
  }, [dispatch]);

  useEffect(() => {
    clearSignatureCanvas();
  }, []);

  useEffect(() => {
    clearSignatureCanvas();

    if (!podDraft.signature) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = podDraft.signature;
  }, [podDraft.signature]);

  useEffect(() => {
    if (searchParams.get('created') !== '1' || !dispatchNo) return;

    toast.success('Dispatch created successfully');
    router.replace(`/dashboard/dispatch-pod/${dispatchNo}`);
  }, [dispatchNo, router, searchParams]);

  const totalQty = useMemo(
    () => dispatch?.vehicles.reduce((sum, vehicle) => sum + vehicle.qty, 0) || 0,
    [dispatch]
  );

  const handleSaveHeader = async () => {
    await saveHeader();
  };

  const handleSubmitPOD = async () => {
    if (!dispatch) return;
    if (dispatch.status === 'Completed') {
      toast.info('POD is already submitted for this dispatch');
      return;
    }
    if (!podDraft.receivedByName.trim()) {
      toast.error('Received by name is required');
      return;
    }
    if (!podDraft.deliveredBy.trim()) {
      toast.error('Delivered by is required');
      return;
    }
    if (!podDraft.signature.trim()) {
      toast.error('Signature is required');
      return;
    }

    try {
      await submitPOD(dispatch.dispatchNo, podDraft);
      toast.success('POD submitted and dispatch marked as completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit POD';
      toast.error(message);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading dispatch details..." />;
  }

  if (!dispatch) {
    return (
      <ErrorState
        title="Dispatch Not Found"
        message="This dispatch number does not exist."
      />
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Button variant="ghost" onClick={() => router.push('/dashboard/dispatch-pod')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dispatch List
      </Button>

      <div className="mt-4 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Vehicle Dispatch Entry</CardTitle>
                <CardDescription>
                  Dispatch No. {dispatch.dispatchNo} | Created {formatDate(dispatch.createdAt, { includeTime: true })}
                </CardDescription>
              </div>
              <Badge variant={statusVariant(dispatch.status)}>{dispatch.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Dispatch No.</Label>
                <Input value={dispatch.dispatchNo} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Dispatch Date</Label>
                <Input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>DNote No.</Label>
                <Input value={dispatch.dNoteNo} readOnly />
              </div>
              <div className="space-y-2">
                <Label>DNote Date</Label>
                <Input value={dispatch.dNoteDate} readOnly />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Customer Code & Name</Label>
                <Input value={`${dispatch.customerCode} - ${dispatch.customerName}`} readOnly />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Address</Label>
                <Input value={dispatch.address} readOnly />
              </div>
              <div className="space-y-2">
                <Label>SO Ref.</Label>
                <Input value={dispatch.soRef} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Total Qty</Label>
                <Input value={String(totalQty)} readOnly />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Remarks</Label>
                <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveHeader}>Save Header</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Delivery Confirmation</CardTitle>
              <CardDescription>POD is linked to this dispatch number.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={podDraft.invoice} onCheckedChange={(checked) => setPodDraft((prev) => ({ ...prev, invoice: checked === true }))} />
                    <Label>Invoice</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={podDraft.insurance} onCheckedChange={(checked) => setPodDraft((prev) => ({ ...prev, insurance: checked === true }))} />
                    <Label>Insurance</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={podDraft.warranty} onCheckedChange={(checked) => setPodDraft((prev) => ({ ...prev, warranty: checked === true }))} />
                    <Label>Warranty</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={podDraft.deliveryCheckList} onCheckedChange={(checked) => setPodDraft((prev) => ({ ...prev, deliveryCheckList: checked === true }))} />
                    <Label>Delivery Check List</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={podDraft.registrationPapers} onCheckedChange={(checked) => setPodDraft((prev) => ({ ...prev, registrationPapers: checked === true }))} />
                    <Label>TAMM - Registration Papers</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={podDraft.vehicleKeys} onCheckedChange={(checked) => setPodDraft((prev) => ({ ...prev, vehicleKeys: checked === true }))} />
                    <Label>Vehicle Keys</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={podDraft.vehicleManuals} onCheckedChange={(checked) => setPodDraft((prev) => ({ ...prev, vehicleManuals: checked === true }))} />
                    <Label>Vehicle Manuals</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Received By Name</Label>
                <Input value={podDraft.receivedByName} onChange={(e) => setPodDraft((prev) => ({ ...prev, receivedByName: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Received By Mobile</Label>
                <Input value={podDraft.receivedByMobile} onChange={(e) => setPodDraft((prev) => ({ ...prev, receivedByMobile: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Delivered By</Label>
                <Input value={podDraft.deliveredBy} onChange={(e) => setPodDraft((prev) => ({ ...prev, deliveredBy: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Signature</Label>
                  <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                    Clear Signature
                  </Button>
                </div>
                <canvas
                  ref={signatureCanvasRef}
                  width={900}
                  height={180}
                  className="h-44 w-full rounded border bg-white"
                  onPointerDown={startSignature}
                  onPointerMove={moveSignature}
                  onPointerUp={endSignature}
                  onPointerLeave={endSignature}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => router.push('/dashboard/dispatch-pod')}>
                  Close
                </Button>
              <Button onClick={handleSubmitPOD} disabled={dispatch.status === 'Completed'}>
                {dispatch.status === 'Completed' ? 'Submitted' : 'Submit'}
              </Button>
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicles</CardTitle>
              <CardDescription>
                All VIN numbers linked to dispatch number {dispatch.dispatchNo}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Del. Num</TableHead>
                      <TableHead>SO No</TableHead>
                      <TableHead>Inv No.</TableHead>
                      <TableHead>VIN No.</TableHead>
                      <TableHead>Model</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatch.vehicles.map((vehicle, index) => (
                      <TableRow key={vehicle.lineId || vehicle.sourceVehicleId || vehicle.vinNo || `dispatch-vehicle-${index}`}>
                        <TableCell>{vehicle.serialNo}</TableCell>
                        <TableCell>{vehicle.deliveryNo}</TableCell>
                        <TableCell>{vehicle.soNo}</TableCell>
                        <TableCell>{vehicle.invoiceNo}</TableCell>
                        <TableCell>{vehicle.vinNo}</TableCell>
                        <TableCell>{vehicle.model}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
