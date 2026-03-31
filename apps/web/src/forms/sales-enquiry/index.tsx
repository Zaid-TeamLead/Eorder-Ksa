"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm, type FieldErrors, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerSearch } from "./components/customer-search";
import { CustomerInformation } from "./components/customer-information";
import { VehicleDetails } from "./components/vehicle-details";
import { EnquiryDetails } from "./components/enquiry-details";
import { AdditionalInfoClean } from "./components/additional-info-clean";
import { salesEnquirySchema, type SalesEnquiryFormData } from "./schema";
import { useSession } from "@/lib/auth-client";
import { useCart, type CartItem } from "@/lib/cart-context";
import { toast } from "sonner";
import { useCallback } from "react";
import type { Customer } from "@/components/shared/customer-search";

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

const sanitizeEmail = (value?: string | null) => {
  const email = String(value || "").trim();
  if (!email) return "";
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return isValid ? email : "";
};

const getErrorMessages = (
  errors: FieldErrors<FieldValues>,
  parentPath = ""
): Array<{ path: string; message: string }> => {
  const result: Array<{ path: string; message: string }> = [];

  for (const [key, value] of Object.entries(errors || {})) {
    if (!value) continue;
    const currentPath = parentPath ? `${parentPath}.${key}` : key;

    if (typeof value === "object" && "message" in value && typeof value.message === "string") {
      result.push({ path: currentPath, message: value.message });
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (!item || typeof item !== "object") return;
        result.push(...getErrorMessages(item as FieldErrors<FieldValues>, `${currentPath}.${index}`));
      });
      continue;
    }

    if (typeof value === "object") {
      result.push(...getErrorMessages(value as FieldErrors<FieldValues>, currentPath));
    }
  }

  return result;
};

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
  selectedVehicleLines: [],
  // Enquiry Details
  branch: "",
  budget: "",
  financing: undefined,
  chargeCode: "",
  chargeName: "",
  chargePrice: "",
  chargeDetails: undefined,
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
      resolver: zodResolver(salesEnquirySchema) as any,
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
            const allMessages = getErrorMessages(errors as unknown as FieldErrors<FieldValues>);
            const errorCount = allMessages.length || Object.keys(errors).length;
            const firstError = allMessages[0];
            const errorMessage = firstError?.message || "Please fill in all required fields";

            toast.error(errorMessage, {
              description: errorCount > 1
                ? `${errorCount - 1} more field(s) require attention`
                : firstError?.path
                  ? `Field: ${firstError.path}`
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

    const handleCustomerSelect = useCallback((customer: Customer) => {
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
      form.setValue("homeEmail", sanitizeEmail(customer.E_Mail), { shouldDirty: true });
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
                <AdditionalInfoClean />
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
