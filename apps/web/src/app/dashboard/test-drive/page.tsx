"use client";
import React, { use, useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { CrudDialog } from "@/components/shared/crud-dialog";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import BookTestDriveForm, {
  type BookTestDriveFormData,
} from "@/forms/book-test-drive";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { GenericDataTable } from "@/components/shared/generic-data-table";
import { createColumns } from "./components/columns";
import { ViewDetailsDialog } from "./components/view-details-dialog";
import { TestDriveCalendar } from "./components/test-drive-calendar";
import { IconTable, IconCalendar } from "@tabler/icons-react";
import type { SlotInfo } from "react-big-calendar";

import { useEntityModal } from "@/hooks/crud/useEntityModal";
import { useTestDrives } from "@/hooks/entities/useTestDrives";
import { useTestDriveMutations } from "@/hooks/entities/useTestDriveMutations";
import type { BookTestDrive } from "@/services/bookTestDrive";
import { logger } from '@/lib/logger';

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
  const formRef = useRef<{ submit: () => void; reset: () => void }>(null);

  // Modal state management using custom hook
  const modal = useEntityModal<BookTestDrive>();
  const [isImmediateBooking, setIsImmediateBooking] = useState(immediate);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  // Initialize modal based on URL params
  React.useEffect(() => {
    if (action === "create") {
      modal.openCreate();
    }
  }, [action]);

  // Fetch bookings using custom hook
  const { bookings, isLoading, error } = useTestDrives();

  // CRUD mutations using custom hook
  const { createBooking, updateBooking, deleteBooking } = useTestDriveMutations();

  const handleSubmit = async (data: BookTestDriveFormData) => {
    try {
      if (modal.isEditMode && modal.selectedEntity) {
        await updateBooking(modal.selectedEntity.SLNO, data);
        modal.close();
        setIsImmediateBooking(false);
        formRef.current?.reset();
      } else {
        await createBooking(data);
        modal.close();
        setIsImmediateBooking(false);
        formRef.current?.reset();
      }
    } catch (error) {
      logger.error("Error saving booking:", error);
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
      logger.error("Error searching customers:", error);
      if (error.response?.status === 401) {
        logger.error("Authentication failed. Please log in again.");
      }
      throw error;
    }
  };

  const handleNewEnquiry = () => {
    modal.openCreate();
  };

  const handleImmediateBooking = () => {
    setIsImmediateBooking(true);
    modal.openCreate();
  };

  const handleView = (booking: BookTestDrive) => {
    modal.openView(booking);
  };

  const handleEdit = (booking: BookTestDrive) => {
    modal.openEdit(booking);
  };

  const handleDelete = (id: number) => {
    modal.openDelete(id);
  };

  const handleSlotSelect = (slotInfo: SlotInfo) => {
    // Create a new booking with the selected time slot
    modal.openCreate();
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

    // Extract time components
    const startTime = start.toTimeString().slice(0, 5);
    const endTime = end.toTimeString().slice(0, 5);
    const startDate = start.toISOString().split("T")[0];
    const endDate = end.toISOString().split("T")[0];

    // Update the booking with new dates/times using mutation hook
    const updateData: Partial<BookTestDriveFormData> = {
      dateOut: startDate,
      timeOut: startTime,
      dateIn: endDate,
      timeIn: endTime,
    };

    await updateBooking(event.id, updateData as BookTestDriveFormData);
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
          open={modal.isCreateMode || modal.isEditMode}
          onOpenChange={(open) => {
            if (!open) {
              modal.close();
              setIsImmediateBooking(false);
              formRef.current?.reset();
            }
          }}
          mode={modal.isEditMode ? "edit" : "create"}
          entityName="Test Drive Booking"
          description={isImmediateBooking ? "Quick booking starting now - Vehicle and time pre-filled" : "Fill in the booking details below"}
          customTitle={isImmediateBooking ? "Immediate Test Drive Booking" : undefined}
          onSubmit={() => formRef.current?.submit()}
          isSubmitting={false}
        >
          <BookTestDriveForm
            ref={formRef}
            onSubmit={handleSubmit}
            onCustomerSearch={handleCustomerSearch}
            defaultValues={getFormDefaultValues(modal.selectedEntity, isImmediateBooking, vehicleVin, session?.data?.user.name)}
          />
        </CrudDialog>

        <ViewDetailsDialog
          open={modal.isViewMode}
          onOpenChange={(open) => !open && modal.close()}
          booking={modal.selectedEntity}
        />

        <DeleteConfirmationDialog
          open={modal.isDeleteMode}
          onOpenChange={(open) => !open && modal.close()}
          onConfirm={async () => {
            if (modal.deleteId) {
              await deleteBooking(modal.deleteId);
              modal.close();
            }
          }}
          entityName="test drive booking"
          isDeleting={false}
        />
      </div>
    </div>

  );
}
