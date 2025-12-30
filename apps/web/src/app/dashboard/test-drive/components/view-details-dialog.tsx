"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { BookTestDrive } from "@/services/bookTestDrive";
import { formatDate, formatDateTime } from "@/lib/formatters";

interface ViewDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    booking: BookTestDrive | null;
}

export function ViewDetailsDialog({
    open,
    onOpenChange,
    booking,
}: ViewDetailsDialogProps) {
    if (!booking) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Booking Details - #{booking.SLNO}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Customer Information */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                            Customer Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Customer ID
                                </label>
                                <p className="text-sm mt-1">{booking.CUSTOMERID || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Customer Name
                                </label>
                                <p className="text-sm mt-1">{booking.CUSTOMERNAME || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Postcode
                                </label>
                                <p className="text-sm mt-1">{booking.POSTCODE || "-"}</p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Address
                                </label>
                                <p className="text-sm mt-1">{booking.ADDRESS || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Phone Number
                                </label>
                                <p className="text-sm mt-1">{booking.PHONENUMBER || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Email
                                </label>
                                <p className="text-sm mt-1">{booking.EMAIL || "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                            Vehicle Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Registration Number
                                </label>
                                <p className="text-sm mt-1">{booking.REGISTRATIONNUM || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Manufacturer
                                </label>
                                <p className="text-sm mt-1">{booking.MANUFACTURER || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Model
                                </label>
                                <p className="text-sm mt-1">{booking.MODEL || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Variant
                                </label>
                                <p className="text-sm mt-1">{booking.VARIANT || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Body Style
                                </label>
                                <p className="text-sm mt-1">{booking.BODYSTYLE || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    New/Used
                                </label>
                                <p className="text-sm mt-1">
                                    {booking.NEWORUSED === "N"
                                        ? "New"
                                        : booking.NEWORUSED === "U"
                                            ? "Used"
                                            : "-"}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Description
                                </label>
                                <p className="text-sm mt-1">{booking.DESCRIPTION || "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                            Booking Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Date Out
                                </label>
                                <p className="text-sm mt-1">
                                    {formatDateTime(booking.DATEOUT, booking.TIMEOUT)}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Date In
                                </label>
                                <p className="text-sm mt-1">
                                    {formatDateTime(booking.DATEIN, booking.TIMEIN)}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Out Branch
                                </label>
                                <p className="text-sm mt-1">{booking.OUTBRANCHNAME || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    In Branch
                                </label>
                                <p className="text-sm mt-1">{booking.INBRANCHNAME || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Sales Executive
                                </label>
                                <p className="text-sm mt-1">{booking.SALESEXECUTIVE || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Approved By
                                </label>
                                <p className="text-sm mt-1">{booking.APPROVEDBY || "-"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Quick Booking
                                </label>
                                <p className="text-sm mt-1">
                                    {booking.QUICKBOOKING === "true" ? (
                                        <Badge variant="default" className="bg-green-500">
                                            Yes
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">No</Badge>
                                    )}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Status
                                </label>
                                <p className="text-sm mt-1">
                                    <Badge
                                        variant={
                                            booking.STATUS === "active" ? "default" : "secondary"
                                        }
                                        className={
                                            booking.STATUS === "active"
                                                ? "bg-green-500 hover:bg-green-600"
                                                : "bg-gray-500 hover:bg-gray-600"
                                        }
                                    >
                                        {booking.STATUS === "active" ? "Active" : "Inactive"}
                                    </Badge>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {booking.NOTES && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                                Notes
                            </h3>
                            <p className="text-sm text-muted-foreground">{booking.NOTES}</p>
                        </div>
                    )}

                    {/* Audit Information */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                            Audit Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Created Date
                                </label>
                                <p className="text-sm mt-1">{formatDate(booking.CREATEDDATE)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    Created By
                                </label>
                                <p className="text-sm mt-1">{booking.CREATEDBY || "-"}</p>
                            </div>
                            {booking.UPDATEDDATE && (
                                <>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Updated Date
                                        </label>
                                        <p className="text-sm mt-1">
                                            {formatDate(booking.UPDATEDDATE)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Updated By
                                        </label>
                                        <p className="text-sm mt-1">{booking.UPDATEDBY || "-"}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

