export type DispatchStatus =
  | 'Pending'
  | 'Dispatched'
  | 'In Transit'
  | 'POD Submitted'
  | 'Completed'
  | 'Partially Completed';

export type DeliveryStatus =
  | 'Pending'
  | 'Delivered'
  | 'Partially Delivered'
  | 'Failed Delivery';

export interface DeliveryNote {
  id: string;
  branch: string;
  dNoteNo: string;
  loadList: string;
  freightLL: string;
  dNoteDate: string;
  diNo: string;
  invoiceNo: string;
  customerCodeName: string;
  invoiceType: string;
  qty: number;
  directShipment: 'YES' | 'NO';
  warehouse: string;
}

export interface DispatchLine extends DeliveryNote {
  lineId: string;
  vehicle: string;
  driver: string;
  packageCount: number;
  packageRemarks?: string;
  deliveryLocation?: string;
  deliveryStatus: DeliveryStatus;
  proofAttached: boolean;
}

export interface DispatchPOD {
  receiverName: string;
  receiverPhone?: string;
  proofType: 'Signature';
  signatureDataUrl?: string;
  notes?: string;
  submittedAt: string;
}

export interface DispatchRecord {
  id: string;
  refNo: string;
  loadingNo: string;
  date: string;
  driver: string;
  vehicle: string;
  externalDriverName?: string;
  externalVehicleNo?: string;
  externalVendor?: string;
  remarks?: string;
  deliveryInstructions?: string;
  lfsDetails?: string;
  status: DispatchStatus;
  lines: DispatchLine[];
  finalized: boolean;
  pod?: DispatchPOD;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchStore {
  dispatches: DispatchRecord[];
  availableNotes: DeliveryNote[];
}

export interface CreateDispatchInput {
  loadingNo: string;
  date: string;
  driver: string;
  vehicle: string;
  externalDriverName?: string;
  externalVehicleNo?: string;
  externalVendor?: string;
  remarks?: string;
}
