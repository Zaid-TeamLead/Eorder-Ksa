"use client";

import React, { useState } from "react";
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
import { useSession } from "@/lib/auth-client";
import { useCart, type CartItem } from "@/lib/cart-context";

const TABS = [
  { id: "customer-information", label: "Customer Information" },
  { id: "vehicle-details", label: "Vehicle Details" },
  { id: "enquiry-details", label: "Enquiry Details" },
  { id: "trade-in", label: "Trade-in Vehicle" },
  { id: "additional", label: "Additional Info" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export type SalesEnquiryFormSubmission = SalesEnquiryFormData & {
  cartItems: CartItem[];
};

interface SalesEnquiryFormProps {
  currentTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  onCustomerSearch?: (query: string) => Promise<{ success: boolean; data: any[] } | undefined>;
  onNewCustomer?: () => void;
  onSubmit?: (data: SalesEnquiryFormSubmission) => void | Promise<void>;
  onSelectFromInventory?: () => void;
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
      onSelectFromInventory,
      defaultValues,
    },
    ref
  ) => {
    const session = useSession();
    const { items: cartItems } = useCart();

    const form = useForm<SalesEnquiryFormData>({
      resolver: zodResolver(salesEnquirySchema),
      defaultValues: {
        // Customer Information
        customerId: "",
        customerName: "",
        address: "",
        postcode: "",
        homePhone: "",
        workPhone: "",
        mobile: "",
        homeEmail: "",
        // Vehicle Details
        make: "",
        model: "",
        variant: "",
        year: "",
        color: "",
        suppCatNum: "",
        modelCode: "",
        quantity: 1,
        vinNumber: "",
        vinDetails: undefined,
        // Enquiry Details
        branch: "",
        budget: "",
        financing: undefined,
        preferredContact: undefined,
        preferredTime: undefined,
        preferredDelivery: "",
        source: "",
        sales_type: "",
        // Trade-in Vehicle
        tradeInMake: "",
        tradeInModel: "",
        tradeInYear: "",
        tradeInKms: "",
        tradeInExpectedPrice: "",
        // Additional Information
        salesperson: session?.data?.user.name || "",
        slpCode: session?.data?.user.SlpCode || "",
        notes: "",
        ...defaultValues,
      },
    });

    const [customerSearch, setCustomerSearch] = React.useState("");

    const handleSubmit = form.handleSubmit(async (data) => {
      if (onSubmit) {
        await onSubmit({
          ...data,
          cartItems: [...cartItems],
        });
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

    const handleCustomerSearch = async (query: string) => {
      if (onCustomerSearch) {
        return await onCustomerSearch(query);
      }
      return undefined;
    };

    const handleCustomerSelect = async (customer: any) => {
      const addressParts = [
        customer.Street,
        customer.Block,
        customer.StreetNo,
        customer.Address2,
        customer.Address3,
      ]
        .filter(Boolean)
        .join(", ");

      const fullAddress = [addressParts, customer.City, customer.County]
        .filter(Boolean)
        .join(", ");

      // Store customer information including CardCode
      form.setValue("customerId", customer.CardCode || "");
      form.setValue("customerName", customer.CardName || "");
      form.setValue("address", fullAddress || "");
      form.setValue("postcode", customer.ZipCode || "");
      form.setValue("homePhone", customer.Phone1 || "");
      form.setValue("workPhone", customer.Phone2 || "");
      form.setValue("mobile", customer.Cellular || "");
      form.setValue("homeEmail", customer.E_Mail || "");
    };

    const handleNewCustomer = () => {
      setCustomerSearch("");
      form.reset({
        // Customer Information
        customerId: "",
        customerName: "",
        address: "",
        postcode: "",
        homePhone: "",
        workPhone: "",
        mobile: "",
        homeEmail: "",
        // Vehicle Details
        make: "",
        model: "",
        variant: "",
        year: "",
        color: "",
        suppCatNum: "",
        modelCode: "",
        quantity: undefined,
        vinNumber: "",
        vinDetails: undefined,
        // Enquiry Details
        budget: "",
        financing: undefined,
        preferredContact: undefined,
        preferredTime: undefined,
        preferredDelivery: "",
        source: "",
        // Trade-in Vehicle
        tradeInMake: "",
        tradeInModel: "",
        tradeInYear: "",
        tradeInKms: "",
        tradeInExpectedPrice: "",
        // Additional Information
        salesperson: "",
        notes: "",
      });
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
                  onCustomerSelect={handleCustomerSelect}
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

export { useFormContext } from "react-hook-form";
export type { SalesEnquiryFormData } from "./schema";
