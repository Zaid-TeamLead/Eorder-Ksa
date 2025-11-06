"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerSearch } from "./components/customer-search";
import { CustomerInformation } from "./components/customer-information";
import { VehicleDetails } from "./components/vehicle-details";
import { EnquiryDetails } from "./components/enquiry-details";
import { TradeIn } from "./components/trade-in";
import { AdditionalInfo } from "./components/additional-info";
import { salesEnquirySchema, type SalesEnquiryFormData } from "./schema";

const TABS = [
  { id: "customer-information", label: "Customer Information" },
  { id: "vehicle-details", label: "Vehicle Details" },
  { id: "enquiry-details", label: "Enquiry Details" },
  { id: "trade-in", label: "Trade-in Vehicle" },
  { id: "additional", label: "Additional Info" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SalesEnquiryFormProps {
  currentTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  onCustomerSearch?: (query: string) => void;
  onNewCustomer?: () => void;
  onSubmit?: (data: SalesEnquiryFormData) => void | Promise<void>;
  defaultValues?: Partial<SalesEnquiryFormData>;
}

export const SalesEnquiryForm = React.forwardRef<
  { submit: () => void },
  SalesEnquiryFormProps
>(
  (
    {
      currentTab = "customer-information",
      onTabChange,
      onCustomerSearch,
      onNewCustomer,
      onSubmit,
      defaultValues,
    },
    ref
  ) => {
    const form = useForm<SalesEnquiryFormData>({
      resolver: zodResolver(salesEnquirySchema),
      defaultValues: {
        ...defaultValues,
      },
    });

    const [customerSearch, setCustomerSearch] = React.useState("");

    const handleSubmit = form.handleSubmit(async (data) => {
      if (onSubmit) {
        await onSubmit(data);
      }
    });

    React.useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          handleSubmit();
        },
      }),
      [handleSubmit]
    );

    const handleCustomerSearch = (query: string) => {
      if (onCustomerSearch) {
        onCustomerSearch(query);
      }
    };

    const handleNewCustomer = () => {
      setCustomerSearch("");
      if (onNewCustomer) {
        onNewCustomer();
      }
    };

    return (
      <Form {...form}>
        <form
          onSubmit={handleSubmit}
          className="w-full flex-1 flex flex-col overflow-hidden"
        >
          <Tabs
            value={currentTab}
            onValueChange={(value) => onTabChange?.(value as TabId)}
            className="w-full flex-1 flex flex-col overflow-hidden"
          >
            <div className="border-b">
              <TabsList className="w-full justify-start h-9 rounded-none ">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="text-xs px-4"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TabsContent
                value="customer-information"
                className="flex flex-col gap-4 mt-0"
              >
                <CustomerSearch
                  value={customerSearch}
                  onChange={setCustomerSearch}
                  onSearch={handleCustomerSearch}
                  onNewCustomer={handleNewCustomer}
                  resultCount={customerSearch ? 2 : undefined}
                />
                <CustomerInformation />
              </TabsContent>

              <TabsContent
                value="vehicle-details"
                className="flex flex-col gap-4 mt-0"
              >
                <VehicleDetails />
              </TabsContent>

              <TabsContent
                value="enquiry-details"
                className="flex flex-col gap-4 mt-0"
              >
                <EnquiryDetails />
              </TabsContent>

              <TabsContent
                value="trade-in"
                className="flex flex-col gap-4 mt-0"
              >
                <TradeIn />
              </TabsContent>

              <TabsContent
                value="additional"
                className="flex flex-col gap-4 mt-0"
              >
                <AdditionalInfo />
              </TabsContent>
            </div>
          </Tabs>
        </form>
      </Form>
    );
  }
);

SalesEnquiryForm.displayName = "SalesEnquiryForm";

// Export form methods for external use
export { useFormContext } from "react-hook-form";
export type { SalesEnquiryFormData } from "./schema";
