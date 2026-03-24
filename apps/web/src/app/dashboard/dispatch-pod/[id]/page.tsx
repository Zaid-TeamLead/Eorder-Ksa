'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Pencil, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { formatDate } from '@/lib/formatters';
import { MOCK_DRIVERS, MOCK_VEHICLES } from '@/services/dispatchMock';
import { useDispatchMockStore } from '@/hooks/dispatch/useDispatchMockStore';
import type { DeliveryStatus, DispatchLine, DispatchStatus } from '@/types/dispatch';

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

const deliveryStatusOptions: DeliveryStatus[] = [
  'Pending',
  'Delivered',
  'Partially Delivered',
  'Failed Delivery',
];

const csvEscape = (value: string | number) => {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

export default function DispatchPODDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const dispatchId = Array.isArray(params.id) ? params.id[0] : params.id;

  const {
    isLoading,
    availableNotes,
    getById,
    saveHeader,
    addNotes,
    saveLine,
    finalize,
    setStatus,
    submitPOD,
  } = useDispatchMockStore();

  const dispatch = dispatchId ? getById(dispatchId) : null;

  const [isAddNotesOpen, setIsAddNotesOpen] = useState(false);
  const [isEditLineOpen, setIsEditLineOpen] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('all');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadInputKey, setUploadInputKey] = useState(0);
  const [headerDraft, setHeaderDraft] = useState({
    loadingNo: '',
    date: '',
    driver: '',
    vehicle: '',
    externalDriverName: '',
    externalVehicleNo: '',
    externalVendor: '',
    remarks: '',
  });
  const [deliveryInstructionsDraft, setDeliveryInstructionsDraft] = useState('');
  const [lfsDetailsDraft, setLfsDetailsDraft] = useState('');
  const [podDraft, setPodDraft] = useState({
    receiverName: '',
    receiverPhone: '',
    proofType: 'Signature' as const,
    signatureDataUrl: '',
    notes: '',
  });
  const [lineEditDraft, setLineEditDraft] = useState<{
    lineId: string;
    vehicle: string;
    driver: string;
    packageCount: number;
    packageRemarks: string;
    deliveryLocation: string;
    deliveryStatus: DeliveryStatus;
  } | null>(null);

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
      signatureDataUrl: canvas.toDataURL('image/png'),
    }));
  };

  const clearSignature = () => {
    clearSignatureCanvas();
    setPodDraft((prev) => ({
      ...prev,
      signatureDataUrl: '',
    }));
  };

  useEffect(() => {
    if (!dispatch) return;

    setHeaderDraft({
      loadingNo: dispatch.loadingNo || '',
      date: dispatch.date || '',
      driver: dispatch.driver || '',
      vehicle: dispatch.vehicle || '',
      externalDriverName: dispatch.externalDriverName || '',
      externalVehicleNo: dispatch.externalVehicleNo || '',
      externalVendor: dispatch.externalVendor || '',
      remarks: dispatch.remarks || '',
    });

    setDeliveryInstructionsDraft(dispatch.deliveryInstructions || '');
    setLfsDetailsDraft(dispatch.lfsDetails || '');

    setPodDraft({
      receiverName: dispatch.pod?.receiverName || '',
      receiverPhone: dispatch.pod?.receiverPhone || '',
      proofType: 'Signature',
      signatureDataUrl: dispatch.pod?.signatureDataUrl || '',
      notes: dispatch.pod?.notes || '',
    });
  }, [dispatch]);

  useEffect(() => {
    clearSignatureCanvas();
  }, []);

  useEffect(() => {
    clearSignatureCanvas();

    if (!podDraft.signatureDataUrl) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = podDraft.signatureDataUrl;
  }, [podDraft.signatureDataUrl]);

  const selectableNotes = useMemo(() => {
    if (!dispatch) return [];
    const selectedIds = new Set(dispatch.lines.map((line) => line.id));
    return availableNotes.filter((note) => {
      if (selectedIds.has(note.id)) return false;
      if (invoiceTypeFilter !== 'all' && note.invoiceType !== invoiceTypeFilter) {
        return false;
      }
      if (!searchText.trim()) return true;

      const query = searchText.trim().toLowerCase();
      return (
        note.customerCodeName.toLowerCase().includes(query) ||
        note.dNoteNo.toLowerCase().includes(query) ||
        note.invoiceNo.toLowerCase().includes(query) ||
        note.loadList.toLowerCase().includes(query)
      );
    });
  }, [availableNotes, dispatch, invoiceTypeFilter, searchText]);

  const totalQty = useMemo(
    () => (dispatch ? dispatch.lines.reduce((sum, line) => sum + (line.qty || 0), 0) : 0),
    [dispatch]
  );

  const freightLoadSummary = useMemo(() => {
    if (!dispatch) return [];

    const map = new Map<
      string,
      {
        loadList: string;
        freightLL: string;
        dnoteCount: number;
        qty: number;
      }
    >();

    dispatch.lines.forEach((line) => {
      const key = `${line.loadList}__${line.freightLL}`;
      const found = map.get(key);
      if (found) {
        found.dnoteCount += 1;
        found.qty += line.qty;
      } else {
        map.set(key, {
          loadList: line.loadList,
          freightLL: line.freightLL,
          dnoteCount: 1,
          qty: line.qty,
        });
      }
    });

    return Array.from(map.values());
  }, [dispatch]);

  if (isLoading) {
    return <LoadingState message="Loading dispatch details..." />;
  }

  if (!dispatch) {
    return (
      <ErrorState
        title="Dispatch Not Found"
        message="This dispatch ID does not exist in mock data."
      />
    );
  }

  const openLineEditor = (line: DispatchLine) => {
    setLineEditDraft({
      lineId: line.lineId,
      vehicle: line.vehicle,
      driver: line.driver,
      packageCount: line.packageCount,
      packageRemarks: line.packageRemarks || '',
      deliveryLocation: line.deliveryLocation || '',
      deliveryStatus: line.deliveryStatus,
    });
    setIsEditLineOpen(true);
  };

  const handleSaveLineEdit = () => {
    if (!lineEditDraft) return;

    saveLine(dispatch.id, lineEditDraft.lineId, {
      vehicle: lineEditDraft.vehicle,
      driver: lineEditDraft.driver,
      packageCount: lineEditDraft.packageCount,
      packageRemarks: lineEditDraft.packageRemarks,
      deliveryLocation: lineEditDraft.deliveryLocation,
      deliveryStatus: lineEditDraft.deliveryStatus,
    });

    setIsEditLineOpen(false);
    setLineEditDraft(null);
    toast.success('Dispatch line updated');
  };

  const handleSaveHeader = () => {
    saveHeader(dispatch.id, headerDraft);
    toast.success('Dispatch header saved');
  };

  const handleSaveDeliveryInstructions = () => {
    saveHeader(dispatch.id, { deliveryInstructions: deliveryInstructionsDraft });
    toast.success('Delivery instructions saved');
  };

  const handleSaveLfsDetails = () => {
    saveHeader(dispatch.id, { lfsDetails: lfsDetailsDraft });
    toast.success('LFS details saved');
  };

  const handleAddNotes = () => {
    if (!selectedNoteIds.length) return;
    addNotes(dispatch.id, selectedNoteIds);
    setSelectedNoteIds([]);
    setSearchText('');
    setInvoiceTypeFilter('all');
    setIsAddNotesOpen(false);
    toast.success('Delivery notes added to dispatch');
  };

  const handleFinalize = () => {
    if (!dispatch.lines.length) {
      toast.error('Add at least one delivery note before finalizing');
      return;
    }
    finalize(dispatch.id);
    toast.success('Dispatch finalized');
  };

  const handleCancelDispatch = () => {
    setStatus(dispatch.id, 'Pending');
    toast.success('Dispatch status set to pending');
  };

  const handleDownloadEditable = () => {
    if (!dispatch.lines.length) {
      toast.error('No lines available to export');
      return;
    }

    const headers = [
      'DNOTE_NO',
      'VEHICLE',
      'DRIVER',
      'PACKAGE_COUNT',
      'PACKAGE_REMARKS',
      'DELIVERY_LOCATION',
      'DELIVERY_STATUS',
    ];

    const rows = dispatch.lines.map((line) => [
      csvEscape(line.dNoteNo),
      csvEscape(line.vehicle),
      csvEscape(line.driver),
      csvEscape(line.packageCount),
      csvEscape(line.packageRemarks || ''),
      csvEscape(line.deliveryLocation || ''),
      csvEscape(line.deliveryStatus),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dispatch-${dispatch.refNo}-editable.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Editable file downloaded');
  };

  const handleUploadChanges = async () => {
    if (!uploadFile) {
      toast.error('Select a CSV file first');
      return;
    }

    try {
      const text = await uploadFile.text();
      const rows = text
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter(Boolean);

      if (rows.length < 2) {
        toast.error('CSV file has no data rows');
        return;
      }

      const headers = parseCsvLine(rows[0]).map((header) => header.toUpperCase());
      const indexOf = (name: string) => headers.indexOf(name);

      const dnoteIndex = indexOf('DNOTE_NO');
      if (dnoteIndex === -1) {
        toast.error('CSV must include DNOTE_NO column');
        return;
      }

      const lineByDnote = new Map(dispatch.lines.map((line) => [line.dNoteNo, line]));
      let updatedCount = 0;

      for (let i = 1; i < rows.length; i += 1) {
        const values = parseCsvLine(rows[i]);
        const dnote = values[dnoteIndex];
        if (!dnote) continue;

        const line = lineByDnote.get(dnote);
        if (!line) continue;

        const vehicle = values[indexOf('VEHICLE')] ?? line.vehicle;
        const driver = values[indexOf('DRIVER')] ?? line.driver;
        const packageCountRaw = values[indexOf('PACKAGE_COUNT')];
        const packageRemarks = values[indexOf('PACKAGE_REMARKS')] ?? line.packageRemarks ?? '';
        const deliveryLocation = values[indexOf('DELIVERY_LOCATION')] ?? line.deliveryLocation ?? '';
        const deliveryStatusRaw = values[indexOf('DELIVERY_STATUS')];

        const nextStatus = deliveryStatusOptions.includes(deliveryStatusRaw as DeliveryStatus)
          ? (deliveryStatusRaw as DeliveryStatus)
          : line.deliveryStatus;

        saveLine(dispatch.id, line.lineId, {
          vehicle,
          driver,
          packageCount:
            packageCountRaw && !Number.isNaN(Number(packageCountRaw))
              ? Number(packageCountRaw)
              : line.packageCount,
          packageRemarks,
          deliveryLocation,
          deliveryStatus: nextStatus,
        });

        updatedCount += 1;
      }

      setUploadFile(null);
      setUploadInputKey((prev) => prev + 1);
      toast.success(`Upload applied to ${updatedCount} line(s)`);
    } catch {
      toast.error('Failed to read CSV file');
    }
  };

  const handleSubmitPOD = () => {
    if (!dispatch.finalized) {
      toast.error('Finalize dispatch first');
      return;
    }
    if (!podDraft.receiverName.trim()) {
      toast.error('Receiver name is required');
      return;
    }
    if (!dispatch.lines.length) {
      toast.error('No delivery notes found');
      return;
    }
    if (!podDraft.signatureDataUrl) {
      toast.error('Receiver signature is required');
      return;
    }

    submitPOD(dispatch.id, podDraft);
    toast.success('POD submitted and dispatch status updated');
  };

  return (
    <div className="container mx-auto py-6">
      <Button variant="ghost" onClick={() => router.push('/dashboard/dispatch-pod')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dispatch List
      </Button>

      <div className="mt-4 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Consolidated Dispatch Confirmation</CardTitle>
                <CardDescription>
                  Ref #{dispatch.refNo} | Created{' '}
                  {formatDate(dispatch.createdAt, { includeTime: true })}
                </CardDescription>
              </div>
              <Badge variant={statusVariant(dispatch.status)}>{dispatch.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Loading No.</Label>
                <Input
                  value={headerDraft.loadingNo}
                  onChange={(e) =>
                    setHeaderDraft((prev) => ({ ...prev, loadingNo: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={headerDraft.date}
                  onChange={(e) =>
                    setHeaderDraft((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Select
                  value={headerDraft.driver}
                  onValueChange={(value) => setHeaderDraft((prev) => ({ ...prev, driver: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Driver --" />
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
                <Label>Vehicle</Label>
                <Select
                  value={headerDraft.vehicle}
                  onValueChange={(value) =>
                    setHeaderDraft((prev) => ({ ...prev, vehicle: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Vehicle --" />
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
                <Label>External Driver Name</Label>
                <Input
                  value={headerDraft.externalDriverName}
                  onChange={(e) =>
                    setHeaderDraft((prev) => ({
                      ...prev,
                      externalDriverName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>External Vehicle No.</Label>
                <Input
                  value={headerDraft.externalVehicleNo}
                  onChange={(e) =>
                    setHeaderDraft((prev) => ({
                      ...prev,
                      externalVehicleNo: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-span-3 space-y-2">
                <Label>External Vendor</Label>
                <Input
                  value={headerDraft.externalVendor}
                  onChange={(e) =>
                    setHeaderDraft((prev) => ({
                      ...prev,
                      externalVendor: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-span-3 space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={headerDraft.remarks}
                  onChange={(e) =>
                    setHeaderDraft((prev) => ({ ...prev, remarks: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSaveHeader}>Save Header</Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="delivery">
          <TabsList>
            <TabsTrigger value="delivery">Delivery Details</TabsTrigger>
            <TabsTrigger value="freight">Freight LoadList</TabsTrigger>
            <TabsTrigger value="instructions">Delivery Instructions</TabsTrigger>
            <TabsTrigger value="lfs">LFS Details</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="delivery" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Selected DNotes</CardTitle>
                    <CardDescription>Dispatch lines selected for this loading run.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setIsAddNotesOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add DNotes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={handleDownloadEditable}>
                    <Download className="mr-2 h-4 w-4" />
                    Download For Editing
                  </Button>
                  <Input
                    key={uploadInputKey}
                    type="file"
                    accept=".csv"
                    className="max-w-sm"
                    onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                  />
                  <Button type="button" variant="outline" onClick={handleUploadChanges}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Changes
                  </Button>
                </div>

                {!dispatch.lines.length ? (
                  <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                    No delivery notes selected yet. Click Add DNotes to continue.
                  </div>
                ) : (
                  <div className="overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>S.No</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>DNote No</TableHead>
                          <TableHead>LoadList</TableHead>
                          <TableHead>Freight LL</TableHead>
                          <TableHead>DNote Date</TableHead>
                          <TableHead>DI No</TableHead>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Customer Code/Name</TableHead>
                          <TableHead>Invoice Type</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Package</TableHead>
                          <TableHead>Package Remarks</TableHead>
                          <TableHead>Delivery Location</TableHead>
                          <TableHead>Edit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dispatch.lines.map((line, index) => (
                          <TableRow key={line.lineId}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{line.branch}</TableCell>
                            <TableCell>{line.dNoteNo}</TableCell>
                            <TableCell>{line.loadList}</TableCell>
                            <TableCell>{line.freightLL}</TableCell>
                            <TableCell>{formatDate(line.dNoteDate)}</TableCell>
                            <TableCell>{line.diNo}</TableCell>
                            <TableCell>{line.invoiceNo}</TableCell>
                            <TableCell className="min-w-[320px]">{line.customerCodeName}</TableCell>
                            <TableCell>{line.invoiceType}</TableCell>
                            <TableCell>{line.qty}</TableCell>
                            <TableCell>{line.vehicle || '-- Vehicle --'}</TableCell>
                            <TableCell>{line.driver || '-- Driver --'}</TableCell>
                            <TableCell>{line.packageCount}</TableCell>
                            <TableCell>{line.packageRemarks || ''}</TableCell>
                            <TableCell>{line.deliveryLocation || ''}</TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openLineEditor(line)}
                                aria-label="Edit line"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={10} />
                          <TableCell className="font-semibold">Total</TableCell>
                          <TableCell className="font-semibold">{totalQty}</TableCell>
                          <TableCell colSpan={5} />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-3 items-center">
                  <div>
                    <Button type="button" variant="destructive" onClick={handleCancelDispatch}>
                      Cancel
                    </Button>
                  </div>
                  <div className="text-center">
                    <Button
                      type="button"
                      onClick={handleFinalize}
                      disabled={dispatch.finalized || dispatch.status === 'Completed'}
                    >
                      Finalize
                    </Button>
                  </div>
                  <div className="text-right">
                    <Button type="button" variant="outline" onClick={() => router.push('/dashboard/dispatch-pod')}>
                      Close
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="freight" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Freight LoadList</CardTitle>
                <CardDescription>Grouped loading details by LoadList and Freight LL.</CardDescription>
              </CardHeader>
              <CardContent>
                {!freightLoadSummary.length ? (
                  <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                    No data available. Add DNotes first.
                  </div>
                ) : (
                  <div className="overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>LoadList</TableHead>
                          <TableHead>Freight LL</TableHead>
                          <TableHead>DNotes Count</TableHead>
                          <TableHead>Total Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {freightLoadSummary.map((row) => (
                          <TableRow key={`${row.loadList}-${row.freightLL}`}>
                            <TableCell>{row.loadList}</TableCell>
                            <TableCell>{row.freightLL}</TableCell>
                            <TableCell>{row.dnoteCount}</TableCell>
                            <TableCell>{row.qty}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Instructions</CardTitle>
                <CardDescription>Add dispatch-level delivery instructions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Textarea
                    rows={6}
                    value={deliveryInstructionsDraft}
                    onChange={(e) => setDeliveryInstructionsDraft(e.target.value)}
                    placeholder="Enter delivery instructions"
                  />
                  <div className="flex justify-end">
                    <Button type="button" onClick={handleSaveDeliveryInstructions}>
                      Save Delivery Instructions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lfs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>LFS Details</CardTitle>
                <CardDescription>Add logistics/LFS details for this dispatch.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Textarea
                    rows={6}
                    value={lfsDetailsDraft}
                    onChange={(e) => setLfsDetailsDraft(e.target.value)}
                    placeholder="Enter LFS details"
                  />
                  <div className="flex justify-end">
                    <Button type="button" onClick={handleSaveLfsDetails}>
                      Save LFS Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>Finalize delivery statuses and submit POD signature.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border p-3">
                    <div className="text-sm text-muted-foreground">Total DNotes</div>
                    <div className="text-xl font-semibold">{dispatch.lines.length}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-sm text-muted-foreground">Total Quantity</div>
                    <div className="text-xl font-semibold">{totalQty}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-sm text-muted-foreground">Current Status</div>
                    <div className="text-xl font-semibold">{dispatch.status}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Receiver Name *</Label>
                    <Input
                      value={podDraft.receiverName}
                      onChange={(e) =>
                        setPodDraft((prev) => ({
                          ...prev,
                          receiverName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Receiver Phone</Label>
                    <Input
                      value={podDraft.receiverPhone}
                      onChange={(e) =>
                        setPodDraft((prev) => ({
                          ...prev,
                          receiverPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Proof Type</Label>
                    <Input value="Signature" readOnly />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>POD Notes</Label>
                    <Textarea
                      rows={2}
                      value={podDraft.notes}
                      onChange={(e) => setPodDraft((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <Label>Receiver Signature</Label>
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

                <div className="mt-4 overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DNote No</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Delivery Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dispatch.lines.map((line) => (
                        <TableRow key={line.lineId}>
                          <TableCell>{line.dNoteNo}</TableCell>
                          <TableCell className="min-w-[320px]">{line.customerCodeName}</TableCell>
                          <TableCell>{line.qty}</TableCell>
                          <TableCell>
                            <Select
                              value={line.deliveryStatus}
                              onValueChange={(value: DeliveryStatus) =>
                                saveLine(dispatch.id, line.lineId, {
                                  deliveryStatus: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {deliveryStatusOptions.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!dispatch.finalized) {
                        toast.error('Finalize dispatch first');
                        return;
                      }
                      setStatus(dispatch.id, 'In Transit');
                      toast.success('Dispatch marked as in transit');
                    }}
                    disabled={!dispatch.finalized || dispatch.status !== 'Dispatched'}
                  >
                    Mark In Transit
                  </Button>
                  <Button type="button" onClick={handleSubmitPOD}>
                    Submit POD
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAddNotesOpen} onOpenChange={setIsAddNotesOpen}>
        <DialogContent className="sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Available Delivery Notes</DialogTitle>
            <DialogDescription>
              Select one or more delivery notes and add them to this dispatch.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3">
            <Input
              placeholder="Filter by customer / DNote / invoice / loadlist"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select value={invoiceTypeFilter} onValueChange={setInvoiceTypeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoice Types</SelectItem>
                <SelectItem value="Local">Local</SelectItem>
                <SelectItem value="Export">Export</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center text-sm text-muted-foreground">
              {selectableNotes.length} note(s) available
            </div>
          </div>

          <div className="max-h-[380px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>DNote No</TableHead>
                  <TableHead>LoadList</TableHead>
                  <TableHead>Freight LL</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice Type</TableHead>
                  <TableHead>Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectableNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-20 text-center text-muted-foreground">
                      No delivery notes match this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectableNotes.map((note) => {
                    const checked = selectedNoteIds.includes(note.id);
                    return (
                      <TableRow key={note.id}>
                        <TableCell>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              setSelectedNoteIds((prev) =>
                                value
                                  ? [...prev, note.id]
                                  : prev.filter((item) => item !== note.id)
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell>{note.branch}</TableCell>
                        <TableCell>{note.dNoteNo}</TableCell>
                        <TableCell>{note.loadList}</TableCell>
                        <TableCell>{note.freightLL}</TableCell>
                        <TableCell>{formatDate(note.dNoteDate)}</TableCell>
                        <TableCell>{note.invoiceNo}</TableCell>
                        <TableCell className="min-w-[280px]">{note.customerCodeName}</TableCell>
                        <TableCell>{note.invoiceType}</TableCell>
                        <TableCell>{note.qty}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddNotesOpen(false)}>
              Close
            </Button>
            <Button onClick={handleAddNotes} disabled={!selectedNoteIds.length}>
              Add Selected DNotes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditLineOpen} onOpenChange={setIsEditLineOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Dispatch Line</DialogTitle>
            <DialogDescription>
              Update vehicle, driver, package and location values for this row.
            </DialogDescription>
          </DialogHeader>

          {!lineEditDraft ? null : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select
                  value={lineEditDraft.vehicle || '__none'}
                  onValueChange={(value) =>
                    setLineEditDraft((prev) =>
                      prev
                        ? { ...prev, vehicle: value === '__none' ? '' : value }
                        : prev
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">-- Vehicle --</SelectItem>
                    {MOCK_VEHICLES.map((vehicle) => (
                      <SelectItem key={vehicle} value={vehicle}>
                        {vehicle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Select
                  value={lineEditDraft.driver || '__none'}
                  onValueChange={(value) =>
                    setLineEditDraft((prev) =>
                      prev
                        ? { ...prev, driver: value === '__none' ? '' : value }
                        : prev
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">-- Driver --</SelectItem>
                    {MOCK_DRIVERS.map((driver) => (
                      <SelectItem key={driver} value={driver}>
                        {driver}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Package</Label>
                <Input
                  type="number"
                  min={0}
                  value={lineEditDraft.packageCount}
                  onChange={(e) =>
                    setLineEditDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            packageCount: Number(e.target.value) || 0,
                          }
                        : prev
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Status</Label>
                <Select
                  value={lineEditDraft.deliveryStatus}
                  onValueChange={(value: DeliveryStatus) =>
                    setLineEditDraft((prev) =>
                      prev ? { ...prev, deliveryStatus: value } : prev
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Package Remarks</Label>
                <Input
                  value={lineEditDraft.packageRemarks}
                  onChange={(e) =>
                    setLineEditDraft((prev) =>
                      prev ? { ...prev, packageRemarks: e.target.value } : prev
                    )
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Delivery Location</Label>
                <Input
                  value={lineEditDraft.deliveryLocation}
                  onChange={(e) =>
                    setLineEditDraft((prev) =>
                      prev ? { ...prev, deliveryLocation: e.target.value } : prev
                    )
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditLineOpen(false)}>
              Close
            </Button>
            <Button onClick={handleSaveLineEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
