export type DispatchStatus =
  | 'Confirmed'
  | 'Completed'
  | 'POD Submitted'
  | 'Dispatched';

export interface DeliveryNoteVehicle {
  id: string;
  serialNo: number;
  deliveryNo: string;
  soNo: string;
  invoiceNo: string;
  vinNo: string;
  model: string;
  qty: number;
}

export interface DeliveryNoteSource {
  id: string;
  hdSlno?: number;
  dndocEntry?: string;
  dNoteNo: string;
  dNoteDate: string;
  customerCode: string;
  customerName: string;
  address: string;
  salespersonName?: string;
  salespersonEmail?: string;
  soRef: string;
  remarks: string;
  totalQty: number;
  vehicles: DeliveryNoteVehicle[];
}

export interface DispatchVehicle {
  lineId?: string;
  sourceVehicleId?: string;
  serialNo: number;
  deliveryNo: string;
  soNo: string;
  invoiceNo: string;
  vinNo: string;
  model: string;
  qty: number;
}

export interface DispatchPOD {
  invoice: boolean;
  insurance: boolean;
  warranty: boolean;
  deliveryCheckList: boolean;
  registrationPapers: boolean;
  vehicleKeys: boolean;
  vehicleManuals: boolean;
  receivedByName: string;
  receivedByMobile: string;
  deliveredBy: string;
  signature: string;
  submittedAt: string;
}

export interface DispatchRecord {
  id: string;
  hdSlno?: number;
  dndocEntry?: string;
  dispatchNo: string;
  dispatchDate: string;
  sourceDNoteId: string;
  dNoteNo: string;
  dNoteDate: string;
  customerCode: string;
  customerName: string;
  address: string;
  salespersonName?: string;
  salespersonEmail?: string;
  soRef: string;
  remarks: string;
  totalQty: number;
  vehicles: DispatchVehicle[];
  status: DispatchStatus;
  pod?: DispatchPOD;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchStore {
  dispatches: DispatchRecord[];
  dnotes: DeliveryNoteSource[];
}

export interface CreateDispatchInput {
  dispatchDate: string;
  sourceDNoteId: string;
  remarks?: string;
  selectedVehicleIds: string[];
}
