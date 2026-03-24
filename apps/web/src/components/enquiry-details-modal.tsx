"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { SalesEnquiry } from "@/services/enquiry";

interface EnquiryDetailsModalProps {
  enquiry: SalesEnquiry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnquiryDetailsModal({
  enquiry,
  open,
  onOpenChange,
}: EnquiryDetailsModalProps) {
  if (!enquiry) return null;

  const statusColors: Record<string, string> = {
    Active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Contacted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    Qualified: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    Converted: "bg-green-500/10 text-green-600 border-green-500/20",
    Lost: "bg-red-500/10 text-red-600 border-red-500/20",
    Closed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  };

  const priorityColors: Record<string, string> = {
    Low: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    Medium: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    High: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">

        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Enquiry #{enquiry.SLNO}</DialogTitle>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={statusColors[enquiry.STATUS || "Active"]}
              >
                {enquiry.STATUS || "Active"}
              </Badge>
              <Badge
                variant="outline"
                className={priorityColors[enquiry.PRIORITY || "Medium"]}
              >
                {enquiry.PRIORITY || "Medium"}
              </Badge>
            </div>
          </div>
        </DialogHeader>


        <div className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{enquiry.CUSTOMERNAME || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Mobile:</span>
                <p className="font-medium">{enquiry.MOBILE || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Home Phone:</span>
                <p className="font-medium">{enquiry.HOMEPHONE || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Work Phone:</span>
                <p className="font-medium">{enquiry.WORKPHONE || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{enquiry.HOMEEMAIL || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Postcode:</span>
                <p className="font-medium">{enquiry.POSTCODE || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Address:</span>
                <p className="font-medium">{enquiry.ADDRESS || "N/A"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vehicle Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Make:</span>
                <p className="font-medium">
                  {enquiry.MAKENAME || enquiry.MAKE || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Model:</span>
                <p className="font-medium">
                  {enquiry.MODELNAME || enquiry.MODEL || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Variant:</span>
                <p className="font-medium">
                  {enquiry.VARIANTNAME || enquiry.VARIANT || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Year:</span>
                <p className="font-medium">{enquiry.YEAR || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Color:</span>
                <p className="font-medium">{enquiry.COLOR || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">VIN Number:</span>
                <p className="font-medium">{enquiry.VINNUMBER || "N/A"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Enquiry Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Enquiry Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Budget:</span>
                <p className="font-medium">{enquiry.BUDGET || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Financing:</span>
                <p className="font-medium capitalize">
                  {enquiry.FINANCING || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Preferred Contact:</span>
                <p className="font-medium capitalize">
                  {enquiry.PREFERREDCONTACT || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Preferred Time:</span>
                <p className="font-medium capitalize">
                  {enquiry.PREFERREDTIME || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Source:</span>
                <p className="font-medium">{enquiry.SOURCE || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sales Type:</span>
                <p className="font-medium">{enquiry.SALESTYPE || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Trade-in Information */}
          {(enquiry.TRADEINMAKE || enquiry.TRADEINMODEL) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Trade-in Vehicle</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Make:</span>
                    <p className="font-medium">{enquiry.TRADEINMAKE || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <p className="font-medium">{enquiry.TRADEINMODEL || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Year:</span>
                    <p className="font-medium">{enquiry.TRADEINYEAR || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kilometers:</span>
                    <p className="font-medium">{enquiry.TRADEINKMS || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected Price:</span>
                    <p className="font-medium">
                      {enquiry.TRADEINEXPECTEDPRICE || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Salesperson:</span>
                <p className="font-medium">{enquiry.SALESPERSON || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Follow-up Date:</span>
                <p className="font-medium">{enquiry.FOLLOWUPDATE || "N/A"}</p>
              </div>
              {enquiry.NOTES && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="font-medium whitespace-pre-wrap">{enquiry.NOTES}</p>
                </div>
              )}
              {enquiry.FOLLOWUPNOTES && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Follow-up Notes:</span>
                  <p className="font-medium whitespace-pre-wrap">
                    {enquiry.FOLLOWUPNOTES}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Audit Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Audit Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created By:</span>
                <p className="font-medium">{enquiry.CREATEDBY || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created Date:</span>
                <p className="font-medium">
                  {enquiry.CREATEDDATE
                    ? new Date(enquiry.CREATEDDATE).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              {enquiry.UPDATEDBY && (
                <>
                  <div>
                    <span className="text-muted-foreground">Updated By:</span>
                    <p className="font-medium">{enquiry.UPDATEDBY}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated Date:</span>
                    <p className="font-medium">
                      {enquiry.UPDATEDDATE
                        ? new Date(enquiry.UPDATEDDATE).toLocaleString()
                        : "N/A"}
                    </p>
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
