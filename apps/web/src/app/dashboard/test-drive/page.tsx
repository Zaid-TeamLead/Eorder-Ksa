"use client";
import { use, useState, useEffect, useRef } from "react";
import { DataTable } from "@/components/data-table";
import data from "../data.json";
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
  SalesEnquiryForm,
  type SalesEnquiryFormData,
} from "@/forms/sales-enquiry";
import { BookTestDriveForm } from "@/forms/book-test-drive";

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
  const [isCreate, setIsCreate] = useState(action === "create");
  const [currentTab, setCurrentTab] = useState<TabId>("customer-information");
  const formRef = useRef<{ submit: () => void }>(null);

  useEffect(() => {
    setIsCreate(action === "create");
    if (!isCreate) {
      setCurrentTab("customer-information");
    }
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

  const handleSubmit = async (data: SalesEnquiryFormData) => {
    console.log("Form data:", data);
    // Handle form submission here
    setIsCreate(false);
  };

  const handleCustomerSearch = (query: string) => {
    console.log("Searching for:", query);
    // Implement customer search logic
  };

  const handleNewCustomer = () => {
    console.log("Creating new customer");
    // Implement new customer logic
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <DataTable data={data} />
      <Dialog
        open={isCreate}
        onOpenChange={(open) => {
          setIsCreate(open);
          if (!open) {
            setCurrentTab("customer-information");
          }
        }}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] w-full h-full flex flex-col sm:max-w-7xl p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
             Book Test Drive
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in all the required information to book a test drive
            </DialogDescription>
          </DialogHeader>
          <BookTestDriveForm
            ref={formRef}
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            onCustomerSearch={handleCustomerSearch}
            onNewCustomer={handleNewCustomer}
            onSubmit={handleSubmit}
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
                  Save changes
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
