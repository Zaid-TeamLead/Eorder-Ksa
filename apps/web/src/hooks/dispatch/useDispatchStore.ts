'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import {
  createDispatch,
  getAvailableDNotes,
  getDispatchByNo,
  getDispatches,
  submitDispatchPOD,
  type CreateDispatchData,
} from '@/services/dispatch';
import type { DeliveryNoteVehicle, DispatchPOD, DispatchRecord } from '@/types/dispatch';

export function useDispatchStore() {
  const queryClient = useQueryClient();

  const {
    data: dispatches = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.dispatch.all,
    queryFn: () => getDispatches(),
  });

  const {
    data: availableDNotes = [],
    isLoading: isLoadingDNotes,
    refetch: refetchDNotes,
  } = useQuery({
    queryKey: queryKeys.dispatch.dnotes,
    queryFn: () => getAvailableDNotes(),
  });

  const createMutation = useMutation({
    mutationFn: createDispatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatch.dnotes });
    },
  });

  const submitPodMutation = useMutation({
    mutationFn: ({ dispatchNo, pod }: { dispatchNo: string; pod: Omit<DispatchPOD, 'submittedAt'> }) =>
      submitDispatchPOD(dispatchNo, pod),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatch.detail(result.dispatchNo) });
    },
  });

  const nextDispatchNo = useMemo(() => {
    const numeric = dispatches
      .map((dispatch) => Number.parseInt(dispatch.dispatchNo || '', 10))
      .filter((value) => Number.isFinite(value));
    if (!numeric.length) return 'Auto';
    return String(Math.max(...numeric) + 1);
  }, [dispatches]);

  const getById = (dispatchNo: string) => getDispatchByNo(dispatchNo);

  const getAvailableVehicles = (dnoteId: string): DeliveryNoteVehicle[] => {
    const dnote = availableDNotes.find((item) => item.id === dnoteId || item.dNoteNo === dnoteId);
    return dnote?.vehicles || [];
  };

  return {
    dispatches,
    availableDNotes,
    isLoading: isLoading || isLoadingDNotes,
    nextDispatchNo,
    getById,
    getAvailableVehicles,
    reload: async () => {
      await Promise.all([refetch(), refetchDNotes()]);
    },
    create: async (payload: CreateDispatchData): Promise<DispatchRecord> => {
      return createMutation.mutateAsync(payload);
    },
    saveHeader: async () => {
      toast.info('Dispatch header update SP is not available yet.');
      return null;
    },
    submitPOD: async (dispatchNo: string, pod: Omit<DispatchPOD, 'submittedAt'>) => {
      return submitPodMutation.mutateAsync({ dispatchNo, pod });
    },
  };
}
