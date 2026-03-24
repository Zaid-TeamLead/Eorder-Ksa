'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CreateDispatchInput,
  DispatchLine,
  DispatchPOD,
  DispatchRecord,
  DispatchStatus,
  DispatchStore,
} from '@/types/dispatch';
import {
  addDispatchDeliveryNotes,
  createDispatch,
  finalizeDispatch,
  getDispatchStore,
  setDispatchStatus,
  submitDispatchPOD,
  updateDispatch,
  updateDispatchLine,
} from '@/services/dispatchMock';

const emptyStore: DispatchStore = {
  dispatches: [],
  availableNotes: [],
};

export function useDispatchMockStore() {
  const [store, setStore] = useState<DispatchStore>(emptyStore);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(() => {
    setStore(getDispatchStore());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const getById = useCallback(
    (id: string) => store.dispatches.find((item) => item.id === id) || null,
    [store.dispatches]
  );

  const create = useCallback(
    (payload: CreateDispatchInput) => {
      const created = createDispatch(payload);
      reload();
      return created;
    },
    [reload]
  );

  const saveHeader = useCallback(
    (
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
        >
      >
    ) => {
      const updated = updateDispatch(id, payload);
      reload();
      return updated;
    },
    [reload]
  );

  const addNotes = useCallback(
    (id: string, noteIds: string[]) => {
      const updated = addDispatchDeliveryNotes(id, noteIds);
      reload();
      return updated;
    },
    [reload]
  );

  const saveLine = useCallback(
    (
      id: string,
      lineId: string,
      payload: Partial<
        Pick<
          DispatchLine,
          | 'vehicle'
          | 'driver'
          | 'packageCount'
          | 'packageRemarks'
          | 'deliveryLocation'
          | 'deliveryStatus'
          | 'proofAttached'
        >
      >
    ) => {
      const updated = updateDispatchLine(id, lineId, payload);
      reload();
      return updated;
    },
    [reload]
  );

  const finalize = useCallback(
    (id: string) => {
      const updated = finalizeDispatch(id);
      reload();
      return updated;
    },
    [reload]
  );

  const setStatus = useCallback(
    (id: string, status: DispatchStatus) => {
      const updated = setDispatchStatus(id, status);
      reload();
      return updated;
    },
    [reload]
  );

  const submitPOD = useCallback(
    (id: string, pod: Omit<DispatchPOD, 'submittedAt'>) => {
      const updated = submitDispatchPOD(id, pod);
      reload();
      return updated;
    },
    [reload]
  );

  const availableNotes = useMemo(() => store.availableNotes, [store.availableNotes]);

  return {
    dispatches: store.dispatches,
    availableNotes,
    isLoading,
    getById,
    reload,
    create,
    saveHeader,
    addNotes,
    saveLine,
    finalize,
    setStatus,
    submitPOD,
  };
}
