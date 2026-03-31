"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { CustomerDetails } from "./components/customer-details";
import { VehicleBookingDetails } from "./components/vehicle-booking-details";
import { BookingDetails } from "./components/booking-details";
import { bookTestDriveSchema, type BookTestDriveFormData } from "./schema";
import { useSession } from "@/lib/auth-client";
import axios from "axios";
import { getBookTestDriveDefaultValues, getResetCustomerFieldsValues } from "./utils/getDefaultValues";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

interface BookTestDriveFormProps {
  onSubmit?: (data: BookTestDriveFormData) => void | Promise<void>;
  onCustomerSearch?: (query: string) => Promise<{ success: boolean; data: any[] } | undefined>;
  defaultValues?: Partial<BookTestDriveFormData>;
}

function sanitizeEmail(value?: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : "";
}

const BookTestDriveForm = React.forwardRef<
  { submit: () => void; reset: () => void },
  BookTestDriveFormProps
>(({ onSubmit, onCustomerSearch, defaultValues }, ref) => {
  const session = useSession();
  const [customerSearch, setCustomerSearch] = useState("");

  // Memoize default values to prevent unnecessary recalculations
  const initialDefaultValues = useMemo(
    () => getBookTestDriveDefaultValues(session?.data?.user.name, defaultValues),
    [session?.data?.user.name, defaultValues]
  );

  const form = useForm<BookTestDriveFormData>({
    resolver: zodResolver(bookTestDriveSchema),
    defaultValues: initialDefaultValues,
  });

  // Reset form when defaultValues change
  // Using useCallback to prevent infinite loop warnings
  const resetFormWithDefaults = useCallback(
    (overrides?: Partial<BookTestDriveFormData>) => {
      const newDefaults = getBookTestDriveDefaultValues(
        session?.data?.user.name,
        overrides
      );
      form.reset(newDefaults);
    },
    [form, session?.data?.user.name]
  );

  React.useEffect(() => {
    if (defaultValues) {
      resetFormWithDefaults(defaultValues);
    }
  }, [defaultValues, resetFormWithDefaults]);

  const handleSubmit = useCallback(
    form.handleSubmit(
      async (data) => {
        if (onSubmit) {
          await onSubmit(data);
        }
      },
      (errors) => {
        const firstError = Object.values(errors)[0];
        const message =
          typeof firstError?.message === "string"
            ? firstError.message
            : "Please complete the required test drive fields";
        toast.error(message);
      }
    ),
    [form, onSubmit]
  );

  React.useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        handleSubmit();
      },
      reset: () => {
        resetFormWithDefaults();
        setCustomerSearch("");
      },
    }),
    [handleSubmit, resetFormWithDefaults]
  );

  const handleCustomerSearch = useCallback(
    async (query: string) => {
      if (onCustomerSearch) {
        return await onCustomerSearch(query);
      }
      // Default implementation
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/customers/search`,
          {
            search: query,
            slpCode: session?.data?.user.SlpCode?.toString() || "",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
        return response.data as { success: boolean; data: any[] };
      } catch (error) {
        logger.error("Error searching customers:", error);
        return undefined;
      }
    },
    [onCustomerSearch, session?.data?.user.SlpCode]
  );

  const handleCustomerSelect = useCallback(
    (customer: any) => {
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

      form.setValue("customerId", customer.CardCode || "");
      form.setValue("customerName", customer.CardName || "");
      form.setValue("postcode", customer.ZipCode || "");
      form.setValue("address", fullAddress || "");
      form.setValue("phoneNumber", customer.Cellular || customer.Phone1 || "");
      form.setValue("email", sanitizeEmail(customer.E_Mail), {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [form]
  );

  const handleNewCustomer = useCallback(() => {
    setCustomerSearch("");
    const resetValues = getResetCustomerFieldsValues(form.getValues());
    form.reset(resetValues);
  }, [form]);

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className="w-full flex-1 flex flex-col overflow-hidden"
      >
        <div
          className="w-full flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-3">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Customer Details
                  </h3>
                </div>
                <CustomerDetails
                  customerSearch={customerSearch}
                  onCustomerSearchChange={setCustomerSearch}
                  onCustomerSearch={handleCustomerSearch}
                  onNewCustomer={handleNewCustomer}
                  onCustomerSelect={handleCustomerSelect}
                />
              </div>

              <div className="space-y-3">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Vehicle Booking Details
                  </h3>
                </div>
                <VehicleBookingDetails />
              </div>
            </div>
            <div className="space-y-3 mt-5">
              <div className="border-b pb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Booking Details
                </h3>
              </div>
              <BookingDetails />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
});

BookTestDriveForm.displayName = "BookTestDriveForm";

export default BookTestDriveForm;
export type { BookTestDriveFormData } from "./schema";
