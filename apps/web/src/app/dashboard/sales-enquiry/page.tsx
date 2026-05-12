"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";

import { GenericDataTable } from "@/components/shared/generic-data-table";
import { CrudDialog } from "@/components/shared/crud-dialog";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { createSalesEnquiryColumns } from "./components/columns";
import { EnquiryDetailsModal } from "@/components/enquiry-details-modal";
import { Button } from "@/components/ui/button";
import { SalesEnquiryForm, type SalesEnquiryFormSubmission } from "@/forms/sales-enquiry";

import { useSession } from "@/lib/auth-client";
import { useEnquiries } from "@/hooks/entities/useEnquiries";
import { useEnquiryMutations } from "@/hooks/entities/useEnquiryMutations";
import { useEntityModal } from "@/hooks/crud/useEntityModal";
import { useVehicles } from "@/hooks/entities/useVehicles";
import { useChargeItems } from "@/hooks/entities/useChargeItems";
import { useTabNavigation } from "@/hooks/forms/useTabNavigation";
import { useVehicleSelection } from "@/hooks/forms/useVehicleSelection";
import { useChargeSelection } from "@/hooks/forms/useChargeSelection";
import { useEnquiryFormSubmit } from "@/hooks/enquiry/useEnquiryFormSubmit";
import { useEnquiryActions } from "@/hooks/enquiry/useEnquiryActions";
import type { SalesEnquiry } from "@/services/enquiry";
import { DASHBOARD_LIST_LIMIT } from "@/lib/list-limits";
import { toSafeText } from "@/lib/value-normalizers";
import { logger } from '@/lib/logger';

const VehicleSelectionModal = dynamic(
  () => import("@/components/vehicle-selection-modal").then((mod) => mod.VehicleSelectionModal),
  { ssr: false }
);

const ChargeSelectionModal = dynamic(
  () => import("@/components/charge-selection-modal").then((mod) => mod.ChargeSelectionModal),
  { ssr: false }
);

const TABS = [
  { id: "customer-information", label: "Customer Information" },
  { id: "vehicle-details", label: "Vehicle Details" },
  { id: "enquiry-details", label: "Enquiry Details" },
  { id: "additional", label: "Additional Info" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const sanitizeEmail = (value?: string | null) => {
  const email = String(value || "").trim();
  if (!email) return "";
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return isValid ? email : "";
};

const getChargeFromEnquiry = (enquiry?: SalesEnquiry | null) => {
  const fromColumns = {
    chargeCode: toSafeText(enquiry?.CHARGECODE),
    chargeName: toSafeText(enquiry?.CHARGENAME),
    chargePrice: toSafeText(enquiry?.CHARGEPRICE),
    chargeDetails:
      enquiry?.CHARGEDETAILS && typeof enquiry.CHARGEDETAILS === "object"
        ? (enquiry.CHARGEDETAILS as Record<string, unknown>)
        : undefined,
  };

  if (fromColumns.chargeCode || fromColumns.chargeName || fromColumns.chargePrice) {
    return fromColumns;
  }

  const vinDetails = enquiry?.VINDETAILS;
  if (!vinDetails || typeof vinDetails !== "object") {
    return {
      chargeCode: "",
      chargeName: "",
      chargePrice: "",
      chargeDetails: undefined as Record<string, unknown> | undefined,
    };
  }

  const source = vinDetails as Record<string, unknown>;
  const chargeObject =
    source.CHARGE && typeof source.CHARGE === "object"
      ? (source.CHARGE as Record<string, unknown>)
      : undefined;

  return {
    chargeCode: toSafeText(chargeObject?.code),
    chargeName: toSafeText(chargeObject?.name),
    chargePrice: toSafeText(chargeObject?.price),
    chargeDetails: chargeObject?.details as Record<string, unknown> | undefined,
  };
};

const getSelectedVehicleLinesFromEnquiry = (enquiry?: SalesEnquiry | null) => {
  const vinDetails =
    enquiry?.VINDETAILS && typeof enquiry.VINDETAILS === "object"
      ? (enquiry.VINDETAILS as Record<string, unknown>)
      : null;

  const lines = vinDetails?.SELECTED_VEHICLE_LINES;
  if (!Array.isArray(lines)) {
    return [];
  }

  return lines
    .map((line, index) => {
      if (!line || typeof line !== "object") return null;

      const record = line as Record<string, unknown>;
      const vin = record.vin && typeof record.vin === "object"
        ? (record.vin as Record<string, unknown>)
        : undefined;
      const selectionKey = String(record.selectionKey || "").trim();
      const vinValue = String(record.vinValue || "").trim();
      const quantity = Number(record.quantity);

      if (!selectionKey || !vin) {
        return null;
      }

      return {
        selectionKey: selectionKey || `vehicle-line-${index + 1}`,
        vinValue,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        vin,
      };
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));
};

export default function SalesEnquiry() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const { data: session } = useSession();
  const slpCode = session?.user.SlpCode;
  const formRef = useRef<{ submit: () => void }>(null);

  // Modal state management using custom hook
  const modal = useEntityModal<SalesEnquiry>();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [inventoryCustomerCode, setInventoryCustomerCode] = useState("");
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [chargeCustomerCode, setChargeCustomerCode] = useState("");

  // Fetch enquiries using custom hook
  const { enquiries, isLoading } = useEnquiries({ limit: DASHBOARD_LIST_LIMIT });

  // Fetch vehicle inventory only when the selection modal is opened.
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles(
    inventoryCustomerCode,
    vehicleModalOpen
  );
  const { chargeItems, isLoading: isLoadingCharges, error: chargeItemsError } = useChargeItems(
    chargeCustomerCode,
    chargeModalOpen
  );

  // CRUD mutations using custom hook
  const { deleteEnquiry: deleteEnquiryMutation, updateStatus } = useEnquiryMutations();

  // Tab navigation using custom hook
  const {
    currentTab,
    setCurrentTab,
    handleNext,
    handlePrevious,
  } = useTabNavigation({ tabs: TABS, initialTab: "customer-information" });

  // Vehicle selection using custom hook
  const { handleVehicleSelect, handleVehiclesSelect } = useVehicleSelection();
  const { handleChargeSelect } = useChargeSelection();

  // Form submission using custom hook
  const { handleSubmit, isSubmitting } = useEnquiryFormSubmit({
    isEditMode: modal.isEditMode,
    selectedEntity: modal.selectedEntity,
    onSuccess: () => {
      modal.close();
      setCurrentTab("customer-information");
    },
  });

  // Enquiry actions using custom hook
  const {
    handleTradeInAppraisal,
    handleBankFunding,
    handleGenerateQuotation,
    handleBookTestDriveNow,
  } = useEnquiryActions();

  useEffect(() => {
    if (action === "create") {
      modal.openCreate();
      setCurrentTab("customer-information");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run only on mount to handle URL parameter

  // Listen for vehicle inventory modal trigger
  useEffect(() => {
    const handleOpenModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ customerCode?: string }>;
      const customerCode = String(customEvent.detail?.customerCode || "").trim();
      setInventoryCustomerCode(customerCode);
      setVehicleModalOpen(true);
    };

    window.addEventListener('openVehicleInventoryModal', handleOpenModal);
    return () => window.removeEventListener('openVehicleInventoryModal', handleOpenModal);
  }, []);

  useEffect(() => {
    const handleOpenModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ customerCode?: string }>;
      const customerCode = String(customEvent.detail?.customerCode || "").trim();
      setChargeCustomerCode(customerCode);
      setChargeModalOpen(true);
    };

    window.addEventListener("openChargeSelectionModal", handleOpenModal);
    return () => window.removeEventListener("openChargeSelectionModal", handleOpenModal);
  }, []);

  const handleEditEnquiry = (enquiry: SalesEnquiry) => {
    modal.openEdit(enquiry);
    setCurrentTab("customer-information");
  };

  const handleCustomerSearch = async (query: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/customers/search`,
        {
          search: query,
          slpCode: "68",
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
      logger.error("Error searching customers:", error);
      if (error.response?.status === 401) {
        logger.error("Authentication failed. Please log in again.");
      }
      throw error;
    }
  };

  const handleNewCustomer = () => {
    toast.info("New customer creation coming soon");
  };

  const handleNewEnquiry = () => {
    modal.openCreate();
  };

  const handleVehicleSelectWithClose = (vehicle: any) => {
    handleVehicleSelect(vehicle);
    setVehicleModalOpen(false);
  };

  const handleVehiclesSelectWithClose = (selectedVehicles: any[]) => {
    const uniqueVehicles = Array.from(
      new Map(
        (selectedVehicles || []).map((vehicle, index) => {
          const row = vehicle as Record<string, unknown>;
          const key = [
            String(
              row.VIN ||
              row.VINNUMBER ||
              row.U_Veh_StockID ||
              row.ItemCode ||
              row.ProductCode ||
              "NO-VIN"
            ).trim(),
            String(row.ItemCode || row.ProductCode || "NO-ITEM").trim(),
            String(row.WhsCode || row.WhsName || "NO-WHS").trim(),
            String(row.InDate || index).trim(),
          ].join("|");
          return [key, vehicle] as const;
        })
      ).values()
    );

    handleVehiclesSelect(uniqueVehicles);
    setVehicleModalOpen(false);
  };

  const handleChargeSelectWithClose = (charge: any) => {
    handleChargeSelect(charge);
    setChargeModalOpen(false);
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
        onGenerateQuotation: handleGenerateQuotation,
        onBookTestDriveNow: handleBookTestDriveNow,
      }),
    [modal, updateStatus, handleTradeInAppraisal, handleBankFunding, handleGenerateQuotation, handleBookTestDriveNow]
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
        isSubmitting={isSubmitting}
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
                  ...getChargeFromEnquiry(modal.selectedEntity),
                  customerId: modal.selectedEntity.CUSTOMERID || "",
                  customerName: modal.selectedEntity.CUSTOMERNAME || "",
                  address: modal.selectedEntity.ADDRESS || "",
                  postcode: modal.selectedEntity.POSTCODE || "",
                  homePhone: modal.selectedEntity.HOMEPHONE || "",
                  workPhone: modal.selectedEntity.WORKPHONE || "",
                  mobile: modal.selectedEntity.MOBILE || "",
                  homeEmail: sanitizeEmail(modal.selectedEntity.HOMEEMAIL || ""),
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
                  selectedVehicleLines: getSelectedVehicleLinesFromEnquiry(
                    modal.selectedEntity
                  ),
                  branch: modal.selectedEntity.BRANCH || "",
                  budget: modal.selectedEntity.BUDGET || "",
                  financing:
                    modal.selectedEntity.FINANCING === "yes" ||
                    modal.selectedEntity.FINANCING === "no" ||
                    modal.selectedEntity.FINANCING === "maybe"
                      ? modal.selectedEntity.FINANCING
                      : undefined,
                  preferredContact:
                    modal.selectedEntity.PREFERREDCONTACT === "phone" ||
                    modal.selectedEntity.PREFERREDCONTACT === "email" ||
                    modal.selectedEntity.PREFERREDCONTACT === "whatsapp" ||
                    modal.selectedEntity.PREFERREDCONTACT === "sms"
                      ? modal.selectedEntity.PREFERREDCONTACT
                      : undefined,
                  preferredTime:
                    modal.selectedEntity.PREFERREDTIME === "morning" ||
                    modal.selectedEntity.PREFERREDTIME === "afternoon" ||
                    modal.selectedEntity.PREFERREDTIME === "evening" ||
                    modal.selectedEntity.PREFERREDTIME === "anytime"
                      ? modal.selectedEntity.PREFERREDTIME
                      : undefined,
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
            toast.success("Enquiry deleted successfully");
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
        onSelectVehicle={handleVehicleSelectWithClose}
        onSelectVehicles={handleVehiclesSelectWithClose}
        vehicles={vehicles}
        isLoading={isLoadingVehicles}
      />

      <ChargeSelectionModal
        open={chargeModalOpen}
        onOpenChange={setChargeModalOpen}
        onSelectCharge={handleChargeSelectWithClose}
        charges={chargeItems}
        isLoading={isLoadingCharges}
        hasError={Boolean(chargeItemsError)}
      />
    </div>
  );
}
