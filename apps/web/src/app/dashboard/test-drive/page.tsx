"use client";
import React, { use, useState, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import BookTestDriveForm, {
  type BookTestDriveFormData,
} from "@/forms/book-test-drive";
import axios from "axios";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { DataTable } from "./components/data-table";
import { createColumns } from "./components/columns";
import { ViewDetailsDialog } from "./components/view-details-dialog";
import { getAllBookTestDrives, updateBookTestDrive, type BookTestDrive } from "@/services/bookTestDrive";
import { useMutation } from "@tanstack/react-query";

export default function BookTestDrive({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const params = use(searchParams);
  const action = params.action;
  const { data: session } = useSession();
  const slpCode = session?.user.SlpCode;
  const [isCreate, setIsCreate] = useState(action === "create");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookTestDrive | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookTestDrive | null>(null);
  const formRef = useRef<{ submit: () => void; reset: () => void }>(null);
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ["book-test-drives"],
    queryFn: getAllBookTestDrives,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BookTestDriveFormData }) =>
      updateBookTestDrive(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-test-drives"] });
      toast.success("Test drive booking updated successfully");
      setIsCreate(false);
      setEditingBooking(null);
      formRef.current?.reset();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to update test drive booking";
      toast.error(errorMessage);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please log in again.");
      }
    },
  });

  const handleSubmit = async (data: BookTestDriveFormData) => {
    if (editingBooking) {
      updateMutation.mutate({ id: editingBooking.SLNO, data });
    } else {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/book-test-drive`,
          data,
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          toast.success("Test drive booking created successfully");
          setIsCreate(false);
          queryClient.invalidateQueries({ queryKey: ["book-test-drives"] });
        }
      } catch (error: any) {
        console.error("Error creating test drive booking:", error);
        const errorMessage =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Failed to create test drive booking";
        toast.error(errorMessage);
        if (error.response?.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        }
      }
    }
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

  const handleNewEnquiry = () => {
    setEditingBooking(null);
    setIsCreate(true);
  };

  const handleView = (booking: BookTestDrive) => {
    setSelectedBooking(booking);
    setIsViewOpen(true);
  };

  const handleEdit = (booking: BookTestDrive) => {
    setEditingBooking(booking);
    setIsCreate(true);
  };

  const columns = useMemo(
    () => createColumns(handleView, handleEdit),
    [handleView, handleEdit]
  );

  // Convert booking to form default values
  const getFormDefaultValues = (booking: BookTestDrive | null): Partial<BookTestDriveFormData> | undefined => {
    if (!booking) return undefined;

    // Extract date and time from DATEOUT and DATEIN
    const extractDate = (dateString?: string) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      } catch {
        return "";
      }
    };

    return {
      customerId: booking.CUSTOMERID || "",
      customerName: booking.CUSTOMERNAME || "",
      companyName: booking.COMPANYNAME || "",
      postcode: booking.POSTCODE || "",
      address: booking.ADDRESS || "",
      phoneNumber: booking.PHONENUMBER || "",
      email: booking.EMAIL || "",
      registrationNumber: booking.REGISTRATIONNUM || "",
      manufacturer: booking.MANUFACTURER || "",
      model: booking.MODEL || "",
      variant: booking.VARIANT || "",
      description: booking.DESCRIPTION || "",
      bodyStyle: booking.BODYSTYLE || "",
      dateOut: extractDate(booking.DATEOUT),
      timeOut: booking.TIMEOUT || "",
      dateIn: extractDate(booking.DATEIN),
      timeIn: booking.TIMEIN || "",
      outBranch: booking.OUTBRANCH || "",
      outBranchName: booking.OUTBRANCHNAME || "",
      inBranch: booking.INBRANCH || "",
      inBranchName: booking.INBRANCHNAME || "",
      salesExecutive: booking.SALESEXECUTIVE || "",
      approvedBy: booking.APPROVEDBY || "",
      quickBooking: booking.QUICKBOOKING === "true",
      newOrUsed: booking.NEWORUSED as "N" | "U" | undefined,
      newOrUsedLabel: booking.NEWORUSEDLABEL || "",
      notes: booking.NOTES || "",
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-destructive">
          Error loading bookings. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <DataTable
          columns={columns}
          data={bookings}
          onAdd={handleNewEnquiry}
          buttonName="Book Test Drive"
        />
        <Dialog
          open={isCreate}
          onOpenChange={(open) => {
            if (!open) {
              setEditingBooking(null);
              formRef.current?.reset();
            }
            setIsCreate(open);
          }}
        >
          <DialogContent className="max-h-[calc(100vh-2rem)] w-full h-full flex flex-col sm:max-w-7xl p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-xl font-semibold">
                {editingBooking ? "Edit Booking" : "Booking"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <BookTestDriveForm
                ref={formRef}
                onSubmit={handleSubmit}
                onCustomerSearch={handleCustomerSearch}
                defaultValues={getFormDefaultValues(editingBooking)}
              />
            </div>
            <DialogFooter className="px-6 py-4 border-t">
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  onClick={() => formRef.current?.submit()}
                >
                  {editingBooking ? "Update" : "OK"}
                </Button>
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
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ViewDetailsDialog
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          booking={selectedBooking}
        />
      </div>
    </div>

  );
}
