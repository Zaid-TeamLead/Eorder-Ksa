"use client";
import { use, useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GenericDataTable } from "@/components/shared/generic-data-table";
import { CrudDialog } from "@/components/shared/crud-dialog";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { createSalesEnquiryColumns } from "./components/columns";
import { IconPlus } from "@tabler/icons-react";
import { EnquiryDetailsModal } from "@/components/enquiry-details-modal";
import { Button } from "@/components/ui/button";
import {
  SalesEnquiryForm,
  type SalesEnquiryFormSubmission,
} from "@/forms/sales-enquiry";
import axios from "axios";
import { useSession, authClient } from "@/lib/auth-client";
import {
  createEnquiry,
  getAllEnquiries,
  updateEnquiry,
  updateEnquiryStatus,
  deleteEnquiry,
  type SalesEnquiry,
} from "@/services/enquiry";
import { getAllVehicleInventory, type VehicleInventory } from "@/services/vehicles";
import { VehicleSelectionModal } from "@/components/vehicle-selection-modal";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const TABS = [
  { id: "customer-information", label: "Customer Information" },
  { id: "vehicle-details", label: "Vehicle Details" },
  { id: "enquiry-details", label: "Enquiry Details" },
  { id: "additional", label: "Additional Info" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SalesEnquiry({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const params = use(searchParams);
  const action = params.action;
  const { data: session } = useSession();
  const slpCode = session?.user.SlpCode;
  const [isCreate, setIsCreate] = useState(action === "create");
  const [isEdit, setIsEdit] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<SalesEnquiry | null>(null);
  const [viewEnquiry, setViewEnquiry] = useState<SalesEnquiry | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<TabId>("customer-information");
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const formRef = useRef<{ submit: () => void }>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch all enquiries
  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => getAllEnquiries(),
  });

  // Fetch vehicle inventory
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicle-inventory"],
    queryFn: () => getAllVehicleInventory(),
  });

  // Create enquiry mutation
  const createEnquiryMutation = useMutation({
    mutationFn: createEnquiry,
    onSuccess: () => {
      toast.success("Sales enquiry created successfully");
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      setIsCreate(false);
      setCurrentTab("customer-information");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create enquiry");
    },
  });

  // Update enquiry mutation
  const updateEnquiryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateEnquiry(id, data),
    onSuccess: () => {
      toast.success("Sales enquiry updated successfully");
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      setIsEdit(false);
      setSelectedEnquiry(null);
      setCurrentTab("customer-information");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update enquiry");
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateEnquiryStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  // Delete enquiry mutation
  const deleteEnquiryMutation = useMutation({
    mutationFn: deleteEnquiry,
    onSuccess: () => {
      toast.success("Enquiry deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete enquiry");
    },
  });

  useEffect(() => {
    setIsCreate(action === "create");
    if (!isCreate) {
      setCurrentTab("customer-information");
    }
  }, []);

  // Listen for vehicle inventory modal trigger
  useEffect(() => {
    const handleOpenModal = () => {
      setVehicleModalOpen(true);
    };

    window.addEventListener('openVehicleInventoryModal', handleOpenModal);
    return () => window.removeEventListener('openVehicleInventoryModal', handleOpenModal);
  }, []);

  const handleNext = () => {
    const currentIndex = TABS.findIndex((tab) => tab.id === currentTab);
    if (currentIndex < TABS.length - 1) {
      setCurrentTab(TABS[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = TABS.findIndex((tab) => tab.id === currentTab);
    if (currentIndex > 0) {
      setCurrentTab(TABS[currentIndex - 1].id);
    }
  };

  const handleSubmit = async (data: SalesEnquiryFormSubmission) => {
    try {
      const payload = {
        customerId: data.customerId,
        customerName: data.customerName,
        address: data.address,
        postcode: data.postcode,
        homePhone: data.homePhone,
        workPhone: data.workPhone,
        mobile: data.mobile,
        homeEmail: data.homeEmail,
        make: data.make,
        model: data.model,
        variant: data.variant,
        year: data.year,
        color: data.color,
        suppCatNum: data.suppCatNum,
        modelCode: data.modelCode,
        quantity: data.quantity,
        vinNumber: data.vinNumber,
        vinDetails: data.vinDetails,
        branch: data.branch,
        budget: data.budget,
        financing: data.financing,
        preferredContact: data.preferredContact,
        preferredTime: data.preferredTime,
        preferredDelivery: data.preferredDelivery,
        source: data.source,
        salesType: data.sales_type,
        tradeInMake: data.tradeInMake,
        tradeInModel: data.tradeInModel,
        tradeInYear: data.tradeInYear,
        tradeInKms: data.tradeInKms,
        tradeInExpectedPrice: data.tradeInExpectedPrice,
        salesperson: data.salesperson,
        slpCode: data.slpCode,
        notes: data.notes,
      };

      if (isEdit && selectedEnquiry) {
        await updateEnquiryMutation.mutateAsync({
          id: selectedEnquiry.SLNO,
          data: payload,
        });
      } else {
        await createEnquiryMutation.mutateAsync(payload);
      }
    } catch (error) {
      console.error("Error saving enquiry:", error);
    }
  };

  const handleViewEnquiry = (enquiry: SalesEnquiry) => {
    setViewEnquiry(enquiry);
  };

  const handleEditEnquiry = (enquiry: SalesEnquiry) => {
    setSelectedEnquiry(enquiry);
    setIsEdit(true);
    setCurrentTab("customer-information");
  };

  const handleDeleteEnquiry = (id: number) => {
    setDeleteId(id);
  };

  const handleTradeInAppraisal = (enquiry: SalesEnquiry) => {
    router.push(`/dashboard/trade-in-appraisal/${enquiry.SLNO}`);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteEnquiryMutation.mutate(deleteId);
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleCustomerSearch = async (query: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/customers/search`,
        {
          search: query,
          slpCode: slpCode?.toString() || "",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return response.data as { success: boolean; data: any[] };
    } catch (error: any) {
      console.error("Error searching customers:", error);
      if (error.response?.status === 401) {
        console.error("Authentication failed. Please log in again.");
      }
      throw error;
    }
  };

  const handleNewCustomer = () => {
    console.log("Creating new customer");
    // Implement new customer logic
  };

  const handleNewEnquiry = () => {
    setIsCreate(true);
  };

  const handleVehicleSelect = (vehicle: VehicleInventory) => {
    // This will be passed to the SalesEnquiryForm component
    // The form will handle populating the fields
    sessionStorage.setItem('selectedEnquiryVehicle', JSON.stringify(vehicle));
    // Trigger a custom event to notify the form
    window.dispatchEvent(new CustomEvent('vehicleSelected', { detail: vehicle }));
    setVehicleModalOpen(false);
  };

  // Create columns with handlers
  const columns = useMemo(
    () =>
      createSalesEnquiryColumns({
        onViewEnquiry: handleViewEnquiry,
        onEditEnquiry: handleEditEnquiry,
        onDeleteEnquiry: handleDeleteEnquiry,
        onStatusChange: handleStatusChange,
        onTradeInAppraisal: handleTradeInAppraisal,
      }),
    []
  );

  return (
    <div className="flex flex-col gap-4 p-6 md:gap-6">
      <GenericDataTable
        columns={columns}
        data={enquiries}
        isLoading={isLoading}
        filterConfig={{
          columnId: "CUSTOMERNAME",
          placeholder: "Filter by customer name...",
        }}
        paginationConfig={{
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 30, 50],
          showPageSizeSelector: true,
          formatPaginationText: (start, end, total) =>
            `Showing ${start} to ${end} of ${total} enquiries`,
        }}
        toolbarActions={[
          {
            label: "Create New Enquiry",
            onClick: handleNewEnquiry,
            icon: <IconPlus className="mr-2 h-4 w-4" />,
            variant: "default",
            size: "sm",
          },
        ]}
        emptyStateConfig={{
          message: "No enquiries found.",
        }}
      />

      {/* View Enquiry Modal */}
      <EnquiryDetailsModal
        enquiry={viewEnquiry}
        open={!!viewEnquiry}
        onOpenChange={(open) => !open && setViewEnquiry(null)}
      />

      {/* Create/Edit Enquiry Dialog */}
      <CrudDialog
        open={isCreate || isEdit}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreate(false);
            setIsEdit(false);
            setSelectedEnquiry(null);
            setCurrentTab("customer-information");
          }
        }}
        mode={isEdit ? "edit" : "create"}
        entityName="Sales Enquiry"
        description="Fill in all the required information across the tabs below"
        onSubmit={() => formRef.current?.submit()}
        isSubmitting={createEnquiryMutation.isPending || updateEnquiryMutation.isPending}
        multiStepConfig={{
          currentStep: TABS.findIndex((tab) => tab.id === currentTab),
          totalSteps: TABS.length,
          onPrevious: handlePrevious,
          onNext: handleNext,
        }}
      >
        <SalesEnquiryForm
          ref={formRef}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onCustomerSearch={handleCustomerSearch}
          onNewCustomer={handleNewCustomer}
          onSubmit={handleSubmit}
          onSelectFromInventory={() => setVehicleModalOpen(true)}
          defaultValues={
            isEdit && selectedEnquiry
              ? {
                  customerId: selectedEnquiry.CUSTOMERID || "",
                  customerName: selectedEnquiry.CUSTOMERNAME || "",
                  address: selectedEnquiry.ADDRESS || "",
                  postcode: selectedEnquiry.POSTCODE || "",
                  homePhone: selectedEnquiry.HOMEPHONE || "",
                  workPhone: selectedEnquiry.WORKPHONE || "",
                  mobile: selectedEnquiry.MOBILE || "",
                  homeEmail: selectedEnquiry.HOMEEMAIL || "",
                  make: selectedEnquiry.MAKE || "",
                  model: selectedEnquiry.MODEL || "",
                  variant: selectedEnquiry.VARIANT || "",
                  year: selectedEnquiry.YEAR || "",
                  color: selectedEnquiry.COLOR || "",
                  suppCatNum: selectedEnquiry.SUPPCATNUM || "",
                  modelCode: selectedEnquiry.MODELCODE || "",
                  quantity: selectedEnquiry.QUANTITY || undefined,
                  vinNumber: selectedEnquiry.VINNUMBER || "",
                  vinDetails: selectedEnquiry.VINDETAILS || undefined,
                  branch: selectedEnquiry.BRANCH || "",
                  budget: selectedEnquiry.BUDGET || "",
                  financing: selectedEnquiry.FINANCING || undefined,
                  preferredContact: selectedEnquiry.PREFERREDCONTACT || undefined,
                  preferredTime: selectedEnquiry.PREFERREDTIME || undefined,
                  preferredDelivery: selectedEnquiry.PREFERREDDELIVERY || "",
                  source: selectedEnquiry.SOURCE || "",
                  sales_type: selectedEnquiry.SALESTYPE || "",
                  tradeInMake: selectedEnquiry.TRADEINMAKE || "",
                  tradeInModel: selectedEnquiry.TRADEINMODEL || "",
                  tradeInYear: selectedEnquiry.TRADEINYEAR || "",
                  tradeInKms: selectedEnquiry.TRADEINKMS || "",
                  tradeInExpectedPrice: selectedEnquiry.TRADEINEXPECTEDPRICE || "",
                  salesperson: selectedEnquiry.SALESPERSON || "",
                  slpCode: selectedEnquiry.SLPCODE || "",
                  notes: selectedEnquiry.NOTES || "",
                }
              : undefined
          }
        />
      </CrudDialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
        entityName="sales enquiry"
        isDeleting={deleteEnquiryMutation.isPending}
      />

      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal
        open={vehicleModalOpen}
        onOpenChange={setVehicleModalOpen}
        onSelectVehicle={handleVehicleSelect}
        vehicles={vehicles}
        isLoading={isLoadingVehicles}
      />
    </div>
  );
}
