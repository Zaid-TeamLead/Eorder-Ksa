"use client";
import { use, useState, useEffect, useRef } from "react";
import { EnquiryTable } from "@/components/enquiry-table";
import { EnquiryDetailsModal } from "@/components/enquiry-details-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  { id: "trade-in", label: "Trade-in Vehicle" },
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

  return (
    <div className="flex flex-col gap-4 p-6 md:gap-6">
      <EnquiryTable
        data={enquiries}
        onNewEnquiry={handleNewEnquiry}
        onViewEnquiry={handleViewEnquiry}
        onEditEnquiry={handleEditEnquiry}
        onDeleteEnquiry={handleDeleteEnquiry}
        onStatusChange={handleStatusChange}
      />

      {/* View Enquiry Modal */}
      <EnquiryDetailsModal
        enquiry={viewEnquiry}
        open={!!viewEnquiry}
        onOpenChange={(open) => !open && setViewEnquiry(null)}
      />

      {/* Create/Edit Enquiry Dialog */}
      <Dialog
        open={isCreate || isEdit}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreate(false);
            setIsEdit(false);
            setSelectedEnquiry(null);
            setCurrentTab("customer-information");
          }
        }}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] w-full h-full flex flex-col sm:max-w-7xl p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              {isEdit ? "Edit Sales Enquiry" : "Create Sales Enquiry"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in all the required information across the tabs below
            </DialogDescription>
          </DialogHeader>
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
          <DialogFooter className="mt-auto border-t px-6 py-3 flex items-center justify-between bg-muted/30">
            <div className="flex gap-2">
              {TABS.findIndex((tab) => tab.id === currentTab) > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  className="h-8"
                >
                  Previous
                </Button>
              )}
              {TABS.findIndex((tab) => tab.id === currentTab) <
                TABS.length - 1 && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleNext}
                    className="h-8"
                  >
                    Next
                  </Button>
                )}
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  Cancel
                </Button>
              </DialogClose>
              {currentTab === TABS[TABS.length - 1].id && (
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  onClick={() => formRef.current?.submit()}
                >
                  {isEdit ? "Update" : "Save changes"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the sales enquiry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
