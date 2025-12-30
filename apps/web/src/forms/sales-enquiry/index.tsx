"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerSearch } from "./components/customer-search";
import { CustomerInformation } from "./components/customer-information";
import { VehicleDetails } from "./components/vehicle-details";
import { EnquiryDetails } from "./components/enquiry-details";
import { AdditionalInfo } from "./components/additional-info";
import { salesEnquirySchema, type SalesEnquiryFormData } from "./schema";
import { useSession } from "@/lib/auth-client";
import { useCart, type CartItem } from "@/lib/cart-context";
import { toast } from "sonner";
import { useCallback } from "react";

// Type definitions for customer data
interface Customer {
  CardCode?: string;
  CardName?: string;
  Street?: string;
  Block?: string;
  StreetNo?: string;
  Address2?: string;
  Address3?: string;
  City?: string;
  County?: string;
  ZipCode?: string;
  Phone1?: string;
  Phone2?: string;
  Cellular?: string;
  E_Mail?: string;
}

interface CustomerSearchResult {
  success: boolean;
  data: Customer[];
}

const TABS = [
  { id: "customer-information", label: "Customer Information" },
  { id: "vehicle-details", label: "Vehicle Details" },
  { id: "enquiry-details", label: "Enquiry Details" },
  { id: "additional", label: "Additional Info" },
] as const;

const TAB_CONTENT_CLASSES = "flex flex-col gap-4 mt-0";

type TabId = (typeof TABS)[number]["id"];

const getInitialFormValues = () => ({
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
  salesperson: "",
  slpCode: "",
  notes: "",
});

export type SalesEnquiryFormSubmission = SalesEnquiryFormData & {
  cartItems: CartItem[];
};

interface SalesEnquiryFormProps {
  currentTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  onCustomerSearch?: (query: string) => Promise<CustomerSearchResult | undefined>;
  onNewCustomer?: () => void;
  onSubmit?: (data: SalesEnquiryFormSubmission) => void | Promise<void>;
  onSelectFromInventory?: () => void;
  defaultValues?: Partial<SalesEnquiryFormData>;
}

export const SalesEnquiryForm = forwardRef<
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
        ...getInitialFormValues(),
        salesperson: session?.data?.user.name || "",
        slpCode: session?.data?.user.SlpCode || "",
        ...defaultValues,
      },
    });

    const [customerSearch, setCustomerSearch] = useState("");

    const handleSubmit = form.handleSubmit(async (data) => {
      if (onSubmit) {
        await onSubmit({
          ...data,
          cartItems: [...cartItems],
        });
      }
    });

    useImperativeHandle(
      ref,
      () => ({
        submit: async () => {
          // Trigger validation
          const isValid = await form.trigger();

          if (!isValid) {
            const errors = form.formState.errors;
            const errorCount = Object.keys(errors).length;

            // Get first error message from schema validation
            const firstError = Object.values(errors)[0];
            const errorMessage = firstError?.message || "Please fill in all required fields";

            toast.error(errorMessage, {
              description: errorCount > 1
                ? `${errorCount - 1} more field(s) require attention`
                : undefined,
            });

            return;
          }

          // If valid, submit the form
          handleSubmit();
        },
      }),
      [handleSubmit, form]
    );

    const handleCustomerSearch = useCallback(async (query: string) => {
      if (onCustomerSearch) {
        return await onCustomerSearch(query);
      }
      return undefined;
    }, [onCustomerSearch]);

    const handleCustomerSelect = useCallback(async (customer: Customer) => {
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
      form.setValue("customerId", customer.CardCode || "", { shouldDirty: true });
      form.setValue("customerName", customer.CardName || "", { shouldDirty: true });
      form.setValue("address", fullAddress || "", { shouldDirty: true });
      form.setValue("postcode", customer.ZipCode || "", { shouldDirty: true });
      form.setValue("homePhone", customer.Phone1 || "", { shouldDirty: true });
      form.setValue("workPhone", customer.Phone2 || "", { shouldDirty: true });
      form.setValue("mobile", customer.Cellular || "", { shouldDirty: true });
      form.setValue("homeEmail", customer.E_Mail || "", { shouldDirty: true });
    }, [form]);

    const handleNewCustomer = useCallback(() => {
      setCustomerSearch("");
      form.reset(getInitialFormValues());
      if (onNewCustomer) {
        onNewCustomer();
      }
    }, [form, onNewCustomer]);

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
              <TabsContent value="customer-information" className={TAB_CONTENT_CLASSES}>
                <CustomerSearch
                  value={customerSearch}
                  onChange={setCustomerSearch}
                  onSearch={handleCustomerSearch}
                  onNewCustomer={handleNewCustomer}
                  onCustomerSelect={handleCustomerSelect}
                />
                <CustomerInformation />
              </TabsContent>

              <TabsContent value="vehicle-details" className={TAB_CONTENT_CLASSES}>
                <VehicleDetails />
              </TabsContent>

              <TabsContent value="enquiry-details" className={TAB_CONTENT_CLASSES}>
                <EnquiryDetails />
              </TabsContent>

              <TabsContent value="additional" className={TAB_CONTENT_CLASSES}>
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
export type { Customer, CustomerSearchResult };
