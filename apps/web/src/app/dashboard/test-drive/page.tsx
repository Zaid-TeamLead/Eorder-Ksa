"use client";
import React, { use, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CrudDialog } from "@/components/shared/crud-dialog";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import BookTestDriveForm, {
  type BookTestDriveFormData,
} from "@/forms/book-test-drive";
import axios from "axios";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { GenericDataTable } from "@/components/shared/generic-data-table";
import { createColumns } from "./components/columns";
import { ViewDetailsDialog } from "./components/view-details-dialog";
import { TestDriveCalendar } from "./components/test-drive-calendar";
import { getAllBookTestDrives, updateBookTestDrive, type BookTestDrive } from "@/services/bookTestDrive";
import { useMutation } from "@tanstack/react-query";
import { IconTable, IconCalendar } from "@tabler/icons-react";
import type { SlotInfo } from "react-big-calendar";

// Helper function to extract date from date string
const extractDate = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

// Get immediate booking defaults from URL params (vehicleVin)
const getImmediateBookingDefaults = (vehicleVin?: string, userName?: string): Partial<BookTestDriveFormData> | undefined => {
  if (!vehicleVin) return undefined;

  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  // Default end time: 2 hours from now
  const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const endDate = endTime.toISOString().split('T')[0];
  const endTimeStr = endTime.toTimeString().slice(0, 5);

  return {
    registrationNumber: vehicleVin,
    dateOut: currentDate,
    timeOut: currentTime,
    dateIn: endDate,
    timeIn: endTimeStr,
    quickBooking: true,
    newOrUsed: "N",
    newOrUsedLabel: "New",
    salesExecutive: userName || "",
  };
};

// Convert booking to form default values
const getFormDefaultValues = (
  booking: BookTestDrive | null,
  isImmediateBooking: boolean,
  vehicleVin?: string,
  userName?: string
): Partial<BookTestDriveFormData> | undefined => {
  // If immediate booking, use immediate defaults
  if (isImmediateBooking && !booking) {
    return getImmediateBookingDefaults(vehicleVin, userName);
  }

  if (!booking) return undefined;

  return {
    customerId: booking.CUSTOMERID || "",
    customerName: booking.CUSTOMERNAME || "",
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
    fuelOut: booking.FUELOUT || "",
    fuelIn: booking.FUELIN || "",
    mileageOut: booking.MILEAGEOUT || "",
    mileageIn: booking.MILEAGEIN || "",
  };
};

export default function BookTestDrive({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; immediate?: string; vehicleVin?: string }>;
}) {
  const params = use(searchParams);
  const action = params.action;
  const immediate = params.immediate === "true";
  const vehicleVin = params.vehicleVin;
  const { data: session } = useSession();
  const slpCode = session?.user.SlpCode;
  const [isCreate, setIsCreate] = useState(action === "create");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookTestDrive | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookTestDrive | null>(null);
  const [isImmediateBooking, setIsImmediateBooking] = useState(immediate);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [deleteId, setDeleteId] = useState<number | null>(null);
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      axios.delete(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/book-test-drive/${id}`, {
        withCredentials: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-test-drives"] });
      toast.success("Test drive booking deleted successfully");
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete booking");
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

  const handleImmediateBooking = () => {
    setEditingBooking(null);
    setIsImmediateBooking(true);
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

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleSlotSelect = (slotInfo: SlotInfo) => {
    // Create a new booking with the selected time slot
    setEditingBooking(null);
    setIsCreate(true);
    // Could potentially pre-fill date/time from slotInfo if needed
  };

  // Check for booking conflicts
  const checkConflict = (
    start: Date,
    end: Date,
    excludeId?: number,
    registrationNum?: string
  ): boolean => {
    return bookings.some((booking) => {
      // Skip if it's the same booking being edited
      if (excludeId && booking.SLNO === excludeId) return false;

      // Only check conflicts for the same vehicle
      if (registrationNum && booking.REGISTRATIONNUM !== registrationNum) return false;

      const bookingStart = new Date(booking.DATEOUT);
      const bookingEnd = new Date(booking.DATEIN);

      // Add time if available
      if (booking.TIMEOUT) {
        const [hours, minutes] = booking.TIMEOUT.split(":");
        bookingStart.setHours(parseInt(hours), parseInt(minutes));
      }
      if (booking.TIMEIN) {
        const [hours, minutes] = booking.TIMEIN.split(":");
        bookingEnd.setHours(parseInt(hours), parseInt(minutes));
      }

      // Check for overlap
      return (
        (start >= bookingStart && start < bookingEnd) ||
        (end > bookingStart && end <= bookingEnd) ||
        (start <= bookingStart && end >= bookingEnd)
      );
    });
  };

  const handleEventDrop = async (
    event: { id: number; resource: BookTestDrive },
    start: Date,
    end: Date
  ) => {
    // Check for conflicts
    const hasConflict = checkConflict(
      start,
      end,
      event.id,
      event.resource.REGISTRATIONNUM
    );

    if (hasConflict) {
      toast.error(
        "Cannot reschedule: This time slot conflicts with another booking for the same vehicle"
      );
      return;
    }

    try {
      // Extract time components
      const startTime = start.toTimeString().slice(0, 5);
      const endTime = end.toTimeString().slice(0, 5);
      const startDate = start.toISOString().split("T")[0];
      const endDate = end.toISOString().split("T")[0];

      // Update the booking with new dates/times
      const updateData: Partial<BookTestDriveFormData> = {
        dateOut: startDate,
        timeOut: startTime,
        dateIn: endDate,
        timeIn: endTime,
      };

      await updateBookTestDrive(event.id, updateData as BookTestDriveFormData);
      queryClient.invalidateQueries({ queryKey: ["book-test-drives"] });
      toast.success("Test drive rescheduled successfully");
    } catch (error: any) {
      console.error("Error rescheduling test drive:", error);
      toast.error("Failed to reschedule test drive");
    }
  };

  const columns = createColumns(handleView, handleEdit, handleDelete);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* View Toggle */}
        <div className="flex items-center justify-end">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <IconTable className="mr-2 h-4 w-4" />
              Table View
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <IconCalendar className="mr-2 h-4 w-4" />
              Calendar View
            </Button>
            <Button size="sm" onClick={handleNewEnquiry} variant="outline">
              Book Test Drive
            </Button>
            <Button size="sm" onClick={handleImmediateBooking}>
              Book Immediately
            </Button>
          </div>
        </div>

        {/* Table or Calendar View */}
        {viewMode === "table" ? (
          <GenericDataTable
            columns={columns}
            data={bookings}
            isLoading={isLoading}
            error={error as Error}
            filterConfig={{
              columnId: "CUSTOMERNAME",
              placeholder: "Filter by customer name...",
            }}
            paginationConfig={{
              initialPageSize: 10,
              pageSizeOptions: [10, 20, 30, 50],
              showPageSizeSelector: true,
            }}
            emptyStateConfig={{
              message: "No test drive bookings found.",
            }}
          />
        ) : (
          <TestDriveCalendar
            bookings={bookings}
            onEventClick={handleView}
            onSlotSelect={handleSlotSelect}
            onEventDrop={handleEventDrop}
          />
        )}
        <CrudDialog
          open={isCreate}
          onOpenChange={(open) => {
            if (!open) {
              setEditingBooking(null);
              setIsImmediateBooking(false);
              formRef.current?.reset();
            }
            setIsCreate(open);
          }}
          mode={editingBooking ? "edit" : "create"}
          entityName="Test Drive Booking"
          description={isImmediateBooking ? "Quick booking starting now - Vehicle and time pre-filled" : "Fill in the booking details below"}
          customTitle={isImmediateBooking ? "Immediate Test Drive Booking" : undefined}
          onSubmit={() => formRef.current?.submit()}
          isSubmitting={updateMutation.isPending}
        >
          <BookTestDriveForm
            ref={formRef}
            onSubmit={handleSubmit}
            onCustomerSearch={handleCustomerSearch}
            defaultValues={getFormDefaultValues(editingBooking, isImmediateBooking, vehicleVin, session?.data?.user.name)}
          />
        </CrudDialog>

        <ViewDetailsDialog
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          booking={selectedBooking}
        />

        <DeleteConfirmationDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          onConfirm={confirmDelete}
          entityName="test drive booking"
          isDeleting={deleteMutation.isPending}
        />
      </div>
    </div>

  );
}
