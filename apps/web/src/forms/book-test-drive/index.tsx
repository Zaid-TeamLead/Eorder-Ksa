"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { CustomerDetails } from "./components/customer-details";
import { VehicleBookingDetails } from "./components/vehicle-booking-details";
import { BookingDetails } from "./components/booking-details";
import { bookTestDriveSchema, type BookTestDriveFormData } from "./schema";
import { useSession } from "@/lib/auth-client";
import axios from "axios";

interface BookTestDriveFormProps {
  onSubmit?: (data: BookTestDriveFormData) => void | Promise<void>;
  onCustomerSearch?: (query: string) => Promise<{ success: boolean; data: any[] } | undefined>;
  defaultValues?: Partial<BookTestDriveFormData>;
}

const BookTestDriveForm = React.forwardRef<
  { submit: () => void; reset: () => void },
  BookTestDriveFormProps
>(({ onSubmit, onCustomerSearch, defaultValues }, ref) => {
  const session = useSession();
  const [customerSearch, setCustomerSearch] = useState("");

  const form = useForm<BookTestDriveFormData>({
    resolver: zodResolver(bookTestDriveSchema),
    defaultValues: {
      customerId: "",
      customerName: "",
      companyName: "",
      postcode: "",
      address: "",
      phoneNumber: "",
      email: "",
      registrationNumber: "",
      manufacturer: "",
      model: "",
      variant: "",
      description: "",
      bodyStyle: "",
      dateOut: "",
      timeOut: "",
      dateIn: "",
      timeIn: "",
      outBranch: "",
      outBranchName: "",
      inBranch: "",
      inBranchName: "",
      salesExecutive: session?.data?.user.name || "",
      approvedBy: "",
      quickBooking: false,
      newOrUsed: undefined,
      newOrUsedLabel: "",
      notes: "",
      fuelOut: "",
      fuelIn: "",
      mileageOut: "",
      mileageIn: "",
      ...defaultValues,
    },
  });

  // Reset form when defaultValues change
  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        customerId: "",
        customerName: "",
        companyName: "",
        postcode: "",
        address: "",
        phoneNumber: "",
        email: "",
        registrationNumber: "",
        manufacturer: "",
        model: "",
        variant: "",
        description: "",
        bodyStyle: "",
        dateOut: "",
        timeOut: "",
        dateIn: "",
        timeIn: "",
        outBranch: "",
        outBranchName: "",
        inBranch: "",
        inBranchName: "",
        salesExecutive: session?.data?.user.name || "",
        approvedBy: "",
        quickBooking: false,
        newOrUsed: undefined,
        newOrUsedLabel: "",
        notes: "",
        fuelOut: "",
        fuelIn: "",
        mileageOut: "",
        mileageIn: "",
        ...defaultValues,
      });
    }
  }, [defaultValues, form, session?.data?.user.name]);

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
      reset: () => {
        form.reset({
          customerId: "",
          customerName: "",
          companyName: "",
          postcode: "",
          address: "",
          phoneNumber: "",
          email: "",
          registrationNumber: "",
          manufacturer: "",
          model: "",
          variant: "",
          description: "",
          bodyStyle: "",
          dateOut: "",
          timeOut: "",
          dateIn: "",
          timeIn: "",
          outBranch: "",
          outBranchName: "",
          inBranch: "",
          inBranchName: "",
          salesExecutive: session?.data?.user.name || "",
          approvedBy: "",
          quickBooking: false,
          newOrUsed: undefined,
          newOrUsedLabel: "",
          notes: "",
          fuelOut: "",
          fuelIn: "",
          mileageOut: "",
          mileageIn: "",
        });
        setCustomerSearch("");
      },
    }),
    [handleSubmit, form, session?.data?.user.name]
  );

  const handleCustomerSearch = async (query: string) => {
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
      console.error("Error searching customers:", error);
      return undefined;
    }
  };

  const handleCustomerSelect = (customer: any) => {
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
    form.setValue("email", customer.E_Mail || "");
  };

  const handleNewCustomer = () => {
    setCustomerSearch("");
    form.reset({
      ...form.getValues(),
      customerId: "",
      customerName: "",
      postcode: "",
      address: "",
      phoneNumber: "",
      email: "",
    });
  };

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
