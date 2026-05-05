import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useMutationWithToast } from '@/hooks/mutations/useMutationWithToast';
import {
  cancelSalesOrder,
  confirmSalesOrderToSalesOrder,
  createSalesOrderHandoverBooking,
  createSalesOrderFromQuotation,
  markSalesOrderAsPrinted,
  passSalesOrderToVehicleAdmin,
  recordSalesOrderAsLost,
  reserveSalesOrderVehicle,
  updateSalesOrder,
} from '@/services/salesOrder';
import type {
  CancelSalesOrderData,
  CreateHandoverBookingData,
  CreateSalesOrderFromQuotationData,
  PassToVehicleAdminData,
  RecordLostSaleData,
  ReserveVehicleData,
  UpdateSalesOrderData,
} from '@/types/salesOrder';

export function useSalesOrderMutations() {
  const queryClient = useQueryClient();
  const invalidateSalesOrders = (id?: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all });
    if (id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.detail(id) });
    }
  };

  const createFromQuotationMutation = useMutationWithToast({
    mutationFn: (data: CreateSalesOrderFromQuotationData) =>
      createSalesOrderFromQuotation(data),
    successMessage: (result) =>
      result?.sapPosting?.status
        ? `Sales order ${result?.salesOrderNumber || ''} created. Queue status: ${result.sapPosting.status}`
        : `Sales order ${result?.salesOrderNumber || ''} created successfully`,
    onSuccess: () => {
      invalidateSalesOrders();
    },
  });

  const updateMutation = useMutationWithToast({
    mutationFn: ({ id, data }: { id: number; data: UpdateSalesOrderData }) =>
      updateSalesOrder(id, data),
    successMessage: 'Sales order updated successfully',
    onSuccess: (_result, variables) => {
      invalidateSalesOrders(variables.id);
    },
  });

  const printMutation = useMutationWithToast({
    mutationFn: (id: number) => markSalesOrderAsPrinted(id),
    successMessage: 'Sales order marked as printed',
    onSuccess: (_result, id) => {
      invalidateSalesOrders(id);
    },
  });

  const confirmToSalesOrderMutation = useMutationWithToast({
    mutationFn: (id: number) => confirmSalesOrderToSalesOrder(id),
    successMessage: (result) =>
      result?.sapPosting?.status
        ? `Sales order confirmed. Queue status: ${result.sapPosting.status}`
        : `SAP Sales Order ${result?.targetDocumentNumber || ''} created successfully`,
    onSuccess: (_result, id) => {
      invalidateSalesOrders(id);
    },
  });

  const passToVehicleAdminMutation = useMutationWithToast({
    mutationFn: ({ id, data }: { id: number; data: PassToVehicleAdminData }) =>
      passSalesOrderToVehicleAdmin(id, data),
    successMessage: 'Sales order passed to vehicle admin',
    onSuccess: (_result, variables) => {
      invalidateSalesOrders(variables.id);
    },
  });

  const recordLostMutation = useMutationWithToast({
    mutationFn: ({ id, data }: { id: number; data: RecordLostSaleData }) =>
      recordSalesOrderAsLost(id, data),
    successMessage: 'Sales order recorded as lost sale',
    onSuccess: (_result, variables) => {
      invalidateSalesOrders(variables.id);
    },
  });

  const reserveVehicleMutation = useMutationWithToast({
    mutationFn: ({ id, data }: { id: number; data: ReserveVehicleData }) =>
      reserveSalesOrderVehicle(id, data),
    successMessage: 'Vehicle reserved successfully',
    onSuccess: (_result, variables) => {
      invalidateSalesOrders(variables.id);
    },
  });

  const cancelMutation = useMutationWithToast({
    mutationFn: ({ id, data }: { id: number; data: CancelSalesOrderData }) =>
      cancelSalesOrder(id, data),
    successMessage: 'Sales order cancelled',
    onSuccess: (_result, variables) => {
      invalidateSalesOrders(variables.id);
    },
  });

  const createHandoverBookingMutation = useMutationWithToast({
    mutationFn: ({ id, data }: { id: number; data: CreateHandoverBookingData }) =>
      createSalesOrderHandoverBooking(id, data),
    successMessage: 'Handover booking created successfully',
    onSuccess: (_result, variables) => {
      invalidateSalesOrders(variables.id);
    },
  });

  return {
    createFromQuotation: async (data: CreateSalesOrderFromQuotationData) =>
      createFromQuotationMutation.mutateAsync(data),
    updateSalesOrder: async (id: number, data: UpdateSalesOrderData) =>
      updateMutation.mutateAsync({ id, data }),
    markAsPrinted: async (id: number) => printMutation.mutateAsync(id),
    confirmToSalesOrder: async (id: number) =>
      confirmToSalesOrderMutation.mutateAsync(id),
    passToVehicleAdmin: async (id: number, data: PassToVehicleAdminData) =>
      passToVehicleAdminMutation.mutateAsync({ id, data }),
    reserveVehicle: async (id: number, data: ReserveVehicleData) =>
      reserveVehicleMutation.mutateAsync({ id, data }),
    createHandoverBooking: async (id: number, data: CreateHandoverBookingData) =>
      createHandoverBookingMutation.mutateAsync({ id, data }),
    recordLostSale: async (id: number, data: RecordLostSaleData) =>
      recordLostMutation.mutateAsync({ id, data }),
    cancelSalesOrder: async (id: number, data: CancelSalesOrderData) =>
      cancelMutation.mutateAsync({ id, data }),
    isCreating: createFromQuotationMutation.isPending,
    isUpdating: updateMutation.isPending,
    isPrinting: printMutation.isPending,
    isConfirmingSalesOrder: confirmToSalesOrderMutation.isPending,
    isPassingToVehicleAdmin: passToVehicleAdminMutation.isPending,
    isReservingVehicle: reserveVehicleMutation.isPending,
    isCreatingHandoverBooking: createHandoverBookingMutation.isPending,
    isRecordingLostSale: recordLostMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}
