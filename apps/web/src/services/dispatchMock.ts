import type {
  CreateDispatchInput,
  DispatchLine,
  DispatchPOD,
  DispatchRecord,
  DispatchStatus,
  DispatchStore,
  DeliveryNote,
} from '@/types/dispatch';

const STORAGE_KEY = 'dispatch_pod_mock_store_v1';

export const MOCK_DRIVERS = [
  'Ahmad Khan',
  'Ravi Shankar',
  'Elaine Tolentino',
  'Mohammed Ali',
  'External Driver',
];

export const MOCK_VEHICLES = [
  'Truck-01',
  'Truck-02',
  'Van-01',
  'Van-02',
  'External Vehicle',
];

const seedDeliveryNotes = (): DeliveryNote[] => [
  {
    id: 'dn-1',
    branch: 'ISUZU',
    dNoteNo: '201006366',
    loadList: '71128',
    freightLL: '95063',
    dNoteDate: '2026-03-16',
    diNo: '201003355',
    invoiceNo: '201006381',
    customerCodeName: 'IZC1208 - ABDULLAH MOHAMMED SALEM BAHAShWAN COMPANY',
    invoiceType: 'Local',
    qty: 1,
    directShipment: 'NO',
    warehouse: 'RUH01',
  },
  {
    id: 'dn-2',
    branch: 'ISUZU',
    dNoteNo: '201006365',
    loadList: '71127',
    freightLL: '95061',
    dNoteDate: '2026-03-16',
    diNo: '201003287',
    invoiceNo: '201006380',
    customerCodeName: 'IZC0004 - NWADER AL RIYADH TRADING CO. LTD',
    invoiceType: 'Local',
    qty: 2493,
    directShipment: 'NO',
    warehouse: 'RUH01',
  },
  {
    id: 'dn-3',
    branch: 'ISUZU',
    dNoteNo: '201006362',
    loadList: '71126',
    freightLL: '95060',
    dNoteDate: '2026-03-16',
    diNo: '201003335',
    invoiceNo: '201006377',
    customerCodeName: 'IZC0004 - NWADER AL RIYADH TRADING CO. LTD',
    invoiceType: 'Local',
    qty: 5446,
    directShipment: 'NO',
    warehouse: 'RUH01',
  },
  {
    id: 'dn-4',
    branch: 'ISUZU',
    dNoteNo: 'T201006357',
    loadList: '71120',
    freightLL: '95056',
    dNoteDate: '2026-03-16',
    diNo: '201003288',
    invoiceNo: '201006372',
    customerCodeName: 'IZC0004 - NWADER AL RIYADH TRADING CO. LTD',
    invoiceType: 'Local',
    qty: 1266,
    directShipment: 'NO',
    warehouse: 'RUH01',
  },
  {
    id: 'dn-5',
    branch: 'ISUZU',
    dNoteNo: '201006356',
    loadList: '71119',
    freightLL: '95055',
    dNoteDate: '2026-03-16',
    diNo: '201003348',
    invoiceNo: '201006371',
    customerCodeName: 'IZC0069 - AL-BARAKAH EST.',
    invoiceType: 'Local',
    qty: 3,
    directShipment: 'NO',
    warehouse: 'RUH01',
  },
  {
    id: 'dn-6',
    branch: 'ISUZU',
    dNoteNo: '201006349',
    loadList: '71117',
    freightLL: '95054',
    dNoteDate: '2026-03-16',
    diNo: '201003349',
    invoiceNo: '201006364',
    customerCodeName: 'IZC0710 - SUPER CATEGORY COMMERCIAL COMPANY BRANCH 3',
    invoiceType: 'Local',
    qty: 15,
    directShipment: 'NO',
    warehouse: 'RUH01',
  },
  {
    id: 'dn-7',
    branch: 'ISUZU',
    dNoteNo: '201006347',
    loadList: '71116',
    freightLL: '95053',
    dNoteDate: '2026-03-16',
    diNo: '201003347',
    invoiceNo: '201006362',
    customerCodeName: 'IZC1363 - AL-YAMAMA WATER PROJECTS COMPANY',
    invoiceType: 'Local',
    qty: 20,
    directShipment: 'NO',
    warehouse: 'RUH02',
  },
  {
    id: 'dn-8',
    branch: 'ISUZU',
    dNoteNo: '201006346',
    loadList: '71114',
    freightLL: '95051',
    dNoteDate: '2026-03-16',
    diNo: '201003344',
    invoiceNo: '201006361',
    customerCodeName: 'IZC1363 - AL-YAMAMA WATER PROJECTS COMPANY',
    invoiceType: 'Local',
    qty: 47,
    directShipment: 'NO',
    warehouse: 'RUH01',
  },
  {
    id: 'dn-9',
    branch: 'ISUZU',
    dNoteNo: '201006345',
    loadList: '71112',
    freightLL: '95050',
    dNoteDate: '2026-03-16',
    diNo: '201003342',
    invoiceNo: '201006359',
    customerCodeName: 'IZC1363 - AL-YAMAMA WATER PROJECTS COMPANY',
    invoiceType: 'Local',
    qty: 2,
    directShipment: 'NO',
    warehouse: 'RUH01',
  },
  {
    id: 'dn-10',
    branch: 'ISUZU',
    dNoteNo: '201006335',
    loadList: '71110',
    freightLL: '95045',
    dNoteDate: '2026-03-16',
    diNo: '201003332',
    invoiceNo: '201006350',
    customerCodeName: 'IZC1295 - UNITED INTERNATIONAL TRANSPORTATION COMPANY',
    invoiceType: 'Local',
    qty: 3,
    directShipment: 'NO',
    warehouse: 'RUH01',
  },
];

const defaultStore = (): DispatchStore => ({
  dispatches: [],
  availableNotes: seedDeliveryNotes(),
});

const readStore = (): DispatchStore => {
  if (typeof window === 'undefined') {
    return defaultStore();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = defaultStore();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as DispatchStore;
    return {
      dispatches: parsed.dispatches || [],
      availableNotes: parsed.availableNotes?.length
        ? parsed.availableNotes
        : seedDeliveryNotes(),
    };
  } catch {
    const seed = defaultStore();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
};

const writeStore = (store: DispatchStore) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const nextRefNo = (dispatches: DispatchRecord[]) =>
  String(20000 + dispatches.length + 1);

const makeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `dispatch-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

export const getDispatchStore = (): DispatchStore => readStore();

export const createDispatch = (input: CreateDispatchInput): DispatchRecord => {
  const store = readStore();
  const now = new Date().toISOString();
  const record: DispatchRecord = {
    id: makeId(),
    refNo: nextRefNo(store.dispatches),
    loadingNo: input.loadingNo,
    date: input.date,
    driver: input.driver,
    vehicle: input.vehicle,
    externalDriverName: input.externalDriverName || '',
    externalVehicleNo: input.externalVehicleNo || '',
    externalVendor: input.externalVendor || '',
    remarks: input.remarks || '',
    deliveryInstructions: '',
    lfsDetails: '',
    status: 'Pending',
    lines: [],
    finalized: false,
    createdAt: now,
    updatedAt: now,
  };

  store.dispatches = [record, ...store.dispatches];
  writeStore(store);
  return record;
};

export const updateDispatch = (
  id: string,
  payload: Partial<
    Pick<
      DispatchRecord,
      | 'loadingNo'
      | 'date'
      | 'driver'
      | 'vehicle'
      | 'externalDriverName'
      | 'externalVehicleNo'
      | 'externalVendor'
      | 'remarks'
      | 'deliveryInstructions'
      | 'lfsDetails'
      | 'status'
      | 'finalized'
    >
  >
): DispatchRecord | null => {
  const store = readStore();
  const index = store.dispatches.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updated: DispatchRecord = {
    ...store.dispatches[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  store.dispatches[index] = updated;
  writeStore(store);
  return updated;
};

export const addDispatchDeliveryNotes = (
  id: string,
  noteIds: string[]
): DispatchRecord | null => {
  if (!noteIds.length) return null;

  const store = readStore();
  const index = store.dispatches.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const dispatch = store.dispatches[index];
  const existing = new Set(dispatch.lines.map((line) => line.id));
  const selectedNotes = store.availableNotes.filter(
    (note) => noteIds.includes(note.id) && !existing.has(note.id)
  );

  const mappedLines: DispatchLine[] = selectedNotes.map((note) => ({
    ...note,
    lineId: `${id}-${note.id}`,
    vehicle: dispatch.vehicle || '',
    driver: dispatch.driver || '',
    packageCount: 0,
    packageRemarks: '',
    deliveryLocation: '',
    deliveryStatus: 'Pending',
    proofAttached: false,
  }));

  const updated: DispatchRecord = {
    ...dispatch,
    lines: [...dispatch.lines, ...mappedLines],
    updatedAt: new Date().toISOString(),
  };

  store.dispatches[index] = updated;
  writeStore(store);
  return updated;
};

export const updateDispatchLine = (
  id: string,
  lineId: string,
  payload: Partial<
    Pick<
      DispatchLine,
      'vehicle' | 'driver' | 'packageCount' | 'packageRemarks' | 'deliveryLocation' | 'deliveryStatus' | 'proofAttached'
    >
  >
): DispatchRecord | null => {
  const store = readStore();
  const index = store.dispatches.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const dispatch = store.dispatches[index];
  const lines = dispatch.lines.map((line) =>
    line.lineId === lineId ? { ...line, ...payload } : line
  );

  const updated: DispatchRecord = {
    ...dispatch,
    lines,
    updatedAt: new Date().toISOString(),
  };
  store.dispatches[index] = updated;
  writeStore(store);
  return updated;
};

export const finalizeDispatch = (id: string): DispatchRecord | null =>
  updateDispatch(id, { status: 'Dispatched', finalized: true });

export const setDispatchStatus = (
  id: string,
  status: DispatchStatus
): DispatchRecord | null => updateDispatch(id, { status });

export const submitDispatchPOD = (
  id: string,
  podInput: Omit<DispatchPOD, 'submittedAt'>
): DispatchRecord | null => {
  const store = readStore();
  const index = store.dispatches.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const dispatch = store.dispatches[index];

  const deliveryStatuses = dispatch.lines.map((line) => line.deliveryStatus);
  const allDelivered =
    deliveryStatuses.length > 0 &&
    deliveryStatuses.every((status) => status === 'Delivered');
  const anyDelivered = deliveryStatuses.some(
    (status) => status === 'Delivered' || status === 'Partially Delivered'
  );

  let nextStatus: DispatchStatus = 'POD Submitted';
  if (allDelivered) {
    nextStatus = 'Completed';
  } else if (anyDelivered) {
    nextStatus = 'Partially Completed';
  }

  const updated: DispatchRecord = {
    ...dispatch,
    status: nextStatus,
    pod: {
      ...podInput,
      submittedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  store.dispatches[index] = updated;
  writeStore(store);
  return updated;
};
