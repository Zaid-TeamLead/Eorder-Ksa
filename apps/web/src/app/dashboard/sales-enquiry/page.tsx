"use client";
import { use, useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IconPlus } from "@tabler/icons-react";

import { GenericDataTable } from "@/components/shared/generic-data-table";
import { CrudDialog } from "@/components/shared/crud-dialog";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { createSalesEnquiryColumns } from "./components/columns";
import { EnquiryDetailsModal } from "@/components/enquiry-details-modal";
import { Button } from "@/components/ui/button";
import { SalesEnquiryForm, type SalesEnquiryFormSubmission } from "@/forms/sales-enquiry";
import { VehicleSelectionModal } from "@/components/vehicle-selection-modal";

import { useSession } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import { useEnquiries } from "@/hooks/entities/useEnquiries";
import { useEnquiryMutations } from "@/hooks/entities/useEnquiryMutations";
import { useEntityModal } from "@/hooks/crud/useEntityModal";
import { getAllVehicleInventory, type VehicleInventory } from "@/services/vehicles";
import type { SalesEnquiry } from "@/services/enquiry";

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
  const router = useRouter();
  const formRef = useRef<{ submit: () => void }>(null);

  // Modal state management using custom hook
  const modal = useEntityModal<SalesEnquiry>();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabId>("customer-information");

  // Fetch enquiries using custom hook
  const { enquiries, isLoading } = useEnquiries();

  // Fetch vehicle inventory
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: queryKeys.vehicles.all,
    queryFn: getAllVehicleInventory,
  });

  // CRUD mutations using custom hook
  const {
    createEnquiry: createEnquiryMutation,
    updateEnquiry: updateEnquiryMutation,
    deleteEnquiry: deleteEnquiryMutation,
    updateStatus,
  } = useEnquiryMutations();

  useEffect(() => {
    if (action === "create") {
      modal.openCreate();
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

      if (modal.isEditMode && modal.selectedEntity) {
        await updateEnquiryMutation(modal.selectedEntity.SLNO, payload);
        modal.close();
        setCurrentTab("customer-information");
      } else {
        await createEnquiryMutation(payload);
        modal.close();
        setCurrentTab("customer-information");
      }
    } catch (error) {
      console.error("Error saving enquiry:", error);
    }
  };

  const handleEditEnquiry = (enquiry: SalesEnquiry) => {
    modal.openEdit(enquiry);
    setCurrentTab("customer-information");
  };

  const handleTradeInAppraisal = (enquiry: SalesEnquiry) => {
    router.push(`/dashboard/trade-in-appraisal/${enquiry.SLNO}`);
  };

  const handleBankFunding = (enquiry: SalesEnquiry) => {
    router.push(`/dashboard/bank-funding/${enquiry.SLNO}`);
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
    modal.openCreate();
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
        onViewEnquiry: modal.openView,
        onEditEnquiry: handleEditEnquiry,
        onDeleteEnquiry: modal.openDelete,
        onStatusChange: updateStatus,
        onTradeInAppraisal: handleTradeInAppraisal,
        onBankFunding: handleBankFunding,
      }),
    [modal, updateStatus]
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
        enquiry={modal.selectedEntity}
        open={modal.isViewMode}
        onOpenChange={(open) => !open && modal.close()}
      />

      {/* Create/Edit Enquiry Dialog */}
      <CrudDialog
        open={modal.isCreateMode || modal.isEditMode}
        onOpenChange={(open) => {
          if (!open) {
            modal.close();
            setCurrentTab("customer-information");
          }
        }}
        mode={modal.isEditMode ? "edit" : "create"}
        entityName="Sales Enquiry"
        description="Fill in all the required information across the tabs below"
        onSubmit={() => formRef.current?.submit()}
        isSubmitting={false}
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
            modal.isEditMode && modal.selectedEntity
              ? {
                  customerId: modal.selectedEntity.CUSTOMERID || "",
                  customerName: modal.selectedEntity.CUSTOMERNAME || "",
                  address: modal.selectedEntity.ADDRESS || "",
                  postcode: modal.selectedEntity.POSTCODE || "",
                  homePhone: modal.selectedEntity.HOMEPHONE || "",
                  workPhone: modal.selectedEntity.WORKPHONE || "",
                  mobile: modal.selectedEntity.MOBILE || "",
                  homeEmail: modal.selectedEntity.HOMEEMAIL || "",
                  make: modal.selectedEntity.MAKE || "",
                  model: modal.selectedEntity.MODEL || "",
                  variant: modal.selectedEntity.VARIANT || "",
                  year: modal.selectedEntity.YEAR || "",
                  color: modal.selectedEntity.COLOR || "",
                  suppCatNum: modal.selectedEntity.SUPPCATNUM || "",
                  modelCode: modal.selectedEntity.MODELCODE || "",
                  quantity: modal.selectedEntity.QUANTITY || undefined,
                  vinNumber: modal.selectedEntity.VINNUMBER || "",
                  vinDetails: modal.selectedEntity.VINDETAILS || undefined,
                  branch: modal.selectedEntity.BRANCH || "",
                  budget: modal.selectedEntity.BUDGET || "",
                  financing: modal.selectedEntity.FINANCING || undefined,
                  preferredContact: modal.selectedEntity.PREFERREDCONTACT || undefined,
                  preferredTime: modal.selectedEntity.PREFERREDTIME || undefined,
                  preferredDelivery: modal.selectedEntity.PREFERREDDELIVERY || "",
                  source: modal.selectedEntity.SOURCE || "",
                  sales_type: modal.selectedEntity.SALESTYPE || "",
                  tradeInMake: modal.selectedEntity.TRADEINMAKE || "",
                  tradeInModel: modal.selectedEntity.TRADEINMODEL || "",
                  tradeInYear: modal.selectedEntity.TRADEINYEAR || "",
                  tradeInKms: modal.selectedEntity.TRADEINKMS || "",
                  tradeInExpectedPrice: modal.selectedEntity.TRADEINEXPECTEDPRICE || "",
                  salesperson: modal.selectedEntity.SALESPERSON || "",
                  slpCode: modal.selectedEntity.SLPCODE || "",
                  notes: modal.selectedEntity.NOTES || "",
                }
              : undefined
          }
        />
      </CrudDialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={modal.isDeleteMode}
        onOpenChange={(open) => !open && modal.close()}
        onConfirm={async () => {
          if (modal.deleteId) {
            await deleteEnquiryMutation(modal.deleteId);
            modal.close();
          }
        }}
        entityName="sales enquiry"
        isDeleting={false}
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
