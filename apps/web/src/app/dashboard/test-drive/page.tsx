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

import { useEntityModal } from "@/hooks/crud/useEntityModal";
import { useTestDrives } from "@/hooks/entities/useTestDrives";
import { useTestDriveMutations } from "@/hooks/entities/useTestDriveMutations";
import type {
  BookTestDrive,
  CreateBookTestDriveData,
  UpdateBookTestDriveData,
} from "@/services/bookTestDrive";
import {
  getAllTestVehicles,
  getTestVehicleById,
  type TestVehicle,
} from "@/services/vehicles";
import { getEnquiryById } from "@/services/enquiry";
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

const extractEnquiryVin = (enquiry: any): string => {
  const direct =
    enquiry?.VINNUMBER ||
    enquiry?.VIN ||
    enquiry?.vinNumber ||
    enquiry?.vin;
  if (direct) return String(direct).trim();

  const details = enquiry?.VINDETAILS;
  if (details && typeof details === "object") {
    const record = details as Record<string, unknown>;
    const directKeys = [
      "VINNUMBER",
      "VIN",
      "vinNumber",
      "vin",
      "U_Veh_StockID",
      "u_veh_stockid",
    ];
    for (const key of directKeys) {
      const value = record[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
    const dynamicMatch = Object.entries(record).find(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (String(value).trim() === "") return false;
      const lower = key.toLowerCase();
      return lower.includes("vin") || lower.includes("stockid");
    });
    if (dynamicMatch) return String(dynamicMatch[1]).trim();
  }

  return "";
};

const sanitizeEmail = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : "";
};

const parseImmediateEnquiryDefaults = (
  value?: string,
  vehicleVin?: string
): Partial<BookTestDriveFormData> | undefined => {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const manufacturer =
      typeof parsed.manufacturer === "string" ? parsed.manufacturer : "";
    const model = typeof parsed.model === "string" ? parsed.model : "";
    const variant = typeof parsed.variant === "string" ? parsed.variant : "";

    return {
      customerId: typeof parsed.customerId === "string" ? parsed.customerId : "",
      customerName: typeof parsed.customerName === "string" ? parsed.customerName : "",
      postcode: typeof parsed.postcode === "string" ? parsed.postcode : "",
      address: typeof parsed.address === "string" ? parsed.address : "",
      phoneNumber: typeof parsed.phoneNumber === "string" ? parsed.phoneNumber : "",
      email: sanitizeEmail(typeof parsed.email === "string" ? parsed.email : ""),
      registrationNumber:
        vehicleVin ||
        (typeof parsed.registrationNumber === "string" ? parsed.registrationNumber : ""),
      manufacturer,
      model,
      variant,
      description: [manufacturer, model, variant].filter(Boolean).join(" "),
    };
  } catch (error) {
    logger.warn("Failed to parse immediate enquiry defaults from URL:", error);
    return undefined;
  }
};

// Get immediate booking defaults from URL params (vehicleVin)
const getImmediateBookingDefaults = (
  vehicleVin?: string,
  userName?: string,
  enquiryDefaults?: Partial<BookTestDriveFormData>
): Partial<BookTestDriveFormData> => {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  // Default end time: 2 hours from now
  const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const endDate = endTime.toISOString().split('T')[0];
  const endTimeStr = endTime.toTimeString().slice(0, 5);

  return {
    ...enquiryDefaults,
    registrationNumber: vehicleVin || enquiryDefaults?.registrationNumber || "",
    dateOut: currentDate,
    timeOut: currentTime,
    dateIn: endDate,
    timeIn: endTimeStr,
    quickBooking: true,
    newOrUsed: "N",
    newOrUsedLabel: "New",
    salesExecutive: userName || enquiryDefaults?.salesExecutive || "",
  };
};

// Convert booking to form default values
const getFormDefaultValues = (
  booking: BookTestDrive | null,
  isImmediateBooking: boolean,
  vehicleVin?: string,
  userName?: string,
  immediateEnquiryDefaults?: Partial<BookTestDriveFormData>
): Partial<BookTestDriveFormData> | undefined => {
  // If immediate booking, use immediate defaults
  if (isImmediateBooking && !booking) {
    return getImmediateBookingDefaults(vehicleVin, userName, immediateEnquiryDefaults);
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

const toBookingPayload = (
  data: BookTestDriveFormData
): CreateBookTestDriveData => ({
  customerId: data.customerId,
  customerName: data.customerName,
  postcode: data.postcode,
  address: data.address,
  phoneNumber: data.phoneNumber,
  email: data.email,
  registrationNumber: data.registrationNumber,
  manufacturer: data.manufacturer,
  model: data.model,
  variant: data.variant,
  description: data.description,
  bodyStyle: data.bodyStyle,
  dateOut: data.dateOut,
  timeOut: data.timeOut,
  dateIn: data.dateIn,
  timeIn: data.timeIn,
  outBranch: data.outBranch,
  outBranchName: data.outBranchName,
  inBranch: data.inBranch,
  inBranchName: data.inBranchName,
  salesExecutive: data.salesExecutive,
  approvedBy: data.approvedBy,
  quickBooking: data.quickBooking,
  newOrUsed: data.newOrUsed === "N" || data.newOrUsed === "U" ? data.newOrUsed : undefined,
  newOrUsedLabel: data.newOrUsedLabel,
  notes: data.notes,
  fuelOut: data.fuelOut,
  fuelIn: data.fuelIn,
  mileageOut: data.mileageOut,
  mileageIn: data.mileageIn,
});

export default function BookTestDrive({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    immediate?: string;
    vehicleVin?: string;
    enquiryId?: string;
    enquiryDefaults?: string;
  }>;
}) {
  const params = use(searchParams);
  const action = params.action;
  const immediate = params.immediate === "true";
  const vehicleVin = params.vehicleVin;
  const enquiryId = params.enquiryId;
  const enquiryDefaultsParam = params.enquiryDefaults;
  const { data: session } = useSession();
  const slpCode = session?.user.SlpCode;
  const formRef = useRef<{ submit: () => void; reset: () => void }>(null);

  // Modal state management using custom hook
  const modal = useEntityModal<BookTestDrive>();
  const [isImmediateBooking, setIsImmediateBooking] = useState(immediate);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [selectedVehicleDetails, setSelectedVehicleDetails] =
    useState<TestVehicle | null>(null);
  const [isVehicleDetailsLoading, setIsVehicleDetailsLoading] = useState(false);
  const [immediateEnquiryDefaults, setImmediateEnquiryDefaults] = useState<
    Partial<BookTestDriveFormData> | undefined
  >(undefined);
  const viewRequestRef = useRef(0);

  // Initialize modal based on URL params
  React.useEffect(() => {
    if (action === "create") {
      modal.openCreate();
    }
  }, [action]);

  React.useEffect(() => {
    let isCancelled = false;

    const loadImmediateEnquiryDefaults = async () => {
      if (!immediate) {
        setImmediateEnquiryDefaults(undefined);
        return;
      }

      const fallbackDefaults: Partial<BookTestDriveFormData> = {
        registrationNumber: vehicleVin || "",
      };

      const parsedDefaults = parseImmediateEnquiryDefaults(enquiryDefaultsParam, vehicleVin);
      if (parsedDefaults) {
        setImmediateEnquiryDefaults(parsedDefaults);
        return;
      }

      if (!enquiryId) {
        setImmediateEnquiryDefaults(undefined);
        return;
      }

      const parsedId = Number.parseInt(enquiryId, 10);
      if (Number.isNaN(parsedId) || parsedId <= 0) {
        setImmediateEnquiryDefaults(undefined);
        return;
      }

      try {
        const enquiry = await getEnquiryById(parsedId);
        if (isCancelled) return;

        const manufacturer = enquiry.MAKENAME || enquiry.MAKE || "";
        const model = enquiry.MODELNAME || enquiry.MODEL || "";
        const variant = enquiry.VARIANTNAME || enquiry.VARIANT || "";
        const description = [manufacturer, model, variant].filter(Boolean).join(" ");

        setImmediateEnquiryDefaults({
          customerId: enquiry.CUSTOMERID || "",
          customerName: enquiry.CUSTOMERNAME || "",
          postcode: enquiry.POSTCODE || "",
          address: enquiry.ADDRESS || "",
          phoneNumber: enquiry.MOBILE || enquiry.HOMEPHONE || enquiry.WORKPHONE || "",
          email: sanitizeEmail(enquiry.HOMEEMAIL),
          registrationNumber: vehicleVin || extractEnquiryVin(enquiry),
          manufacturer,
          model,
          variant,
          description,
        });
      } catch (error) {
        if (!isCancelled) {
          setImmediateEnquiryDefaults(fallbackDefaults);
        }

        if (axios.isAxiosError(error) && error.response?.status === 403) {
          logger.warn(
            "Immediate test drive enquiry defaults are not accessible for this user; using VIN-only defaults.",
            { enquiryId: parsedId }
          );
          return;
        }

        logger.warn("Failed to load enquiry defaults for immediate test drive:", error);
      }
    };

    void loadImmediateEnquiryDefaults();

    return () => {
      isCancelled = true;
    };
  }, [immediate, enquiryDefaultsParam, enquiryId, vehicleVin]);

  // Fetch bookings using custom hook
  const { bookings, isLoading, error } = useTestDrives();

  // CRUD mutations using custom hook
  const {
    createBooking,
    updateBooking,
    deleteBooking,
    isCreating,
    isUpdating,
  } = useTestDriveMutations();

  const handleSubmit = async (data: BookTestDriveFormData) => {
    const payload = toBookingPayload(data);

    try {
      if (modal.isEditMode && modal.selectedEntity) {
        await updateBooking(modal.selectedEntity.SLNO, payload);
        toast.success("Test drive booking updated successfully");
        modal.close();
        setIsImmediateBooking(false);
        formRef.current?.reset();
      } else {
        await createBooking(payload);
        toast.success("Test drive booking created successfully");
        modal.close();
        setIsImmediateBooking(false);
        formRef.current?.reset();
      }
    } catch (error) {
      logger.error("Error saving booking:", error);
      toast.error("Failed to save test drive booking");
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

  const handleView = async (booking: BookTestDrive) => {
    modal.openView(booking);
    setSelectedVehicleDetails(null);

    if (!booking.REGISTRATIONNUM) return;

    const requestId = ++viewRequestRef.current;
    setIsVehicleDetailsLoading(true);

    try {
      const vehicles = await getAllTestVehicles();
      const matchedVehicle = vehicles.find(
        (vehicle) => vehicle.REGISTRATIONNUM === booking.REGISTRATIONNUM
      );

      if (!matchedVehicle?.SLNO) return;

      const vehicleDetails = await getTestVehicleById(matchedVehicle.SLNO);

      if (viewRequestRef.current === requestId) {
        setSelectedVehicleDetails(vehicleDetails);
      }
    } catch (error) {
      logger.error("Error fetching vehicle details for booking view:", error);
    } finally {
      if (viewRequestRef.current === requestId) {
        setIsVehicleDetailsLoading(false);
      }
    }
  };

  const handleEdit = (booking: BookTestDrive) => {
    modal.openEdit(booking);
  };

  const handleDelete = (id: number) => {
    modal.openDelete(id);
  };

  const handleSlotSelect = () => {
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
    const updateData: UpdateBookTestDriveData = {
      dateOut: startDate,
      timeOut: startTime,
      dateIn: endDate,
      timeIn: endTime,
    };

    try {
      await updateBooking(event.id, updateData);
      toast.success("Test drive booking rescheduled successfully");
    } catch (error) {
      logger.error("Error rescheduling booking:", error);
      toast.error("Failed to reschedule test drive booking");
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
          isSubmitting={isCreating || isUpdating}
        >
          <BookTestDriveForm
            ref={formRef}
            onSubmit={handleSubmit}
            onCustomerSearch={handleCustomerSearch}
            defaultValues={getFormDefaultValues(
              modal.selectedEntity,
              isImmediateBooking,
              vehicleVin,
              session?.user.name,
              immediateEnquiryDefaults
            )}
          />
        </CrudDialog>

        <ViewDetailsDialog
          open={modal.isViewMode}
          onOpenChange={(open) => {
            if (!open) {
              modal.close();
              setSelectedVehicleDetails(null);
              setIsVehicleDetailsLoading(false);
            }
          }}
          booking={modal.selectedEntity}
          vehicleDetails={selectedVehicleDetails}
          isVehicleDetailsLoading={isVehicleDetailsLoading}
        />

        <DeleteConfirmationDialog
          open={modal.isDeleteMode}
          onOpenChange={(open) => !open && modal.close()}
          onConfirm={async () => {
            if (modal.deleteId) {
              await deleteBooking(modal.deleteId);
              toast.success("Test drive booking deleted successfully");
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
