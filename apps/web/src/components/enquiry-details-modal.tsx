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

  const normalizeKey = (key: string) =>
    key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  const normalizeValue = (value: unknown): string => {
    if (value === undefined || value === null) return "";
    const normalized = String(value).trim();
    if (!normalized || normalized === "?") return "";
    return normalized;
  };

  const getObjectValue = (
    source: Record<string, unknown> | null,
    keys: string[]
  ): string => {
    if (!source) return "";

    const normalizedKeys = new Set(keys.map(normalizeKey));
    for (const [rawKey, rawValue] of Object.entries(source)) {
      const value = normalizeValue(rawValue);
      if (!value) continue;

      if (normalizedKeys.has(normalizeKey(rawKey))) {
        return value;
      }
    }

    return "";
  };

  const vinDetails =
    enquiry.VINDETAILS && typeof enquiry.VINDETAILS === "object"
      ? (enquiry.VINDETAILS as Record<string, unknown>)
      : null;
  const selectedLines = Array.isArray(vinDetails?.SELECTED_VEHICLE_LINES)
    ? (vinDetails.SELECTED_VEHICLE_LINES as Array<Record<string, unknown>>)
    : [];

  const getChargeDetails = () => {
    const fromColumns = {
      code: normalizeValue(enquiry.CHARGECODE),
      name: normalizeValue(enquiry.CHARGENAME),
      price: normalizeValue(enquiry.CHARGEPRICE),
    };

    if (fromColumns.code || fromColumns.name || fromColumns.price) {
      return fromColumns;
    }

    const charge =
      vinDetails?.CHARGE && typeof vinDetails.CHARGE === "object"
        ? (vinDetails.CHARGE as Record<string, unknown>)
        : null;

    return {
      code: normalizeValue(charge?.code),
      name: normalizeValue(charge?.name),
      price: normalizeValue(charge?.price),
    };
  };

  const getVehicleFallbackValue = (keys: string[]): string => {
    const firstLineVin =
      selectedLines[0]?.vin && typeof selectedLines[0].vin === "object"
        ? (selectedLines[0].vin as Record<string, unknown>)
        : null;

    const sources = [firstLineVin, vinDetails];
    for (const source of sources) {
      const value = getObjectValue(source, keys);
      if (value) {
        return value;
      }
    }

    return "";
  };

  const formatVehiclePrice = (value: string, currency: string): string => {
    if (!value) return "N/A";
    const parsed = Number(value.replace(/,/g, "").replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(parsed)) return value;

    return `${currency || "SAR"} ${parsed.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const vehicles =
    selectedLines.length > 0
      ? selectedLines.map((line, index) => {
          const lineVin =
            line.vin && typeof line.vin === "object"
              ? (line.vin as Record<string, unknown>)
              : null;
          const currency =
            getObjectValue(lineVin, ["Currency", "CURRENCY", "Curr", "CURR"]) || "SAR";
          const modelCode =
            getObjectValue(lineVin, [
              "U_Vehicle_MC",
              "U_VEHICLE_MC",
              "Model Code",
              "MODELCODE",
            ]) || "N/A";

          return {
            id:
              normalizeValue(line.selectionKey) ||
              normalizeValue(line.vinValue) ||
              `${enquiry.SLNO}-${index + 1}`,
            label: `Vehicle ${index + 1}`,
            quantity: normalizeValue(line.quantity) || "1",
            make:
              getObjectValue(lineVin, [
                "U_Veh_Brand",
                "U_VEH_BRAND",
                "Brand",
                "BRAND",
                "ItmsGrpNam",
                "MAKE",
                "Make",
              ]) || "N/A",
            model:
              getObjectValue(lineVin, [
                "U_Veh_ModelDescr",
                "U_Veh_ModelFull",
                "U_Veh_Model",
                "U_VEH_MODEL",
                "Model Description",
                "MODEL",
                "Model",
              ]) || "N/A",
            variant:
              getObjectValue(lineVin, [
                "ItemCode",
                "ITEMCODE",
                "ProductCode",
                "PRODUCTCODE",
              ]) || "N/A",
            year:
              getObjectValue(lineVin, [
                "U_Veh_MY",
                "U_VEH_MY",
                "Model Year",
                "MODELYEAR",
                "YEAR",
                "Year",
              ]) || "N/A",
            color:
              getObjectValue(lineVin, [
                "U_Veh_Color",
                "U_VEH_COLOR",
                "COLOR",
                "Color",
              ]) || "N/A",
            vin:
              normalizeValue(line.vinValue) ||
              getObjectValue(lineVin, [
                "VIN",
                "VINNUMBER",
                "vin",
                "vinNumber",
                "U_Veh_StockID",
                "U_VEH_STOCKID",
              ]) ||
              "N/A",
            modelCode,
            suppCatNum:
              getObjectValue(lineVin, ["SuppCatNum", "SUPPCATNUM"]) || modelCode,
            warehouse:
              getObjectValue(lineVin, ["WhsName", "WHSNAME", "WhsCode", "WHSCODE"]) || "N/A",
            location:
              getObjectValue(lineVin, ["Location", "LOCATION"]) || "N/A",
            price: formatVehiclePrice(
              getObjectValue(lineVin, [
                "Price",
                "PRICE",
                "Amount",
                "AMOUNT",
                "UnitPrice",
                "UNITPRICE",
              ]),
              currency
            ),
          };
        })
      : [
          {
            id: String(enquiry.SLNO),
            label: "Vehicle 1",
            quantity: normalizeValue(enquiry.QUANTITY) || "1",
            make:
              enquiry.MAKENAME ||
              enquiry.MAKE ||
              getVehicleFallbackValue([
                "U_Veh_Brand",
                "U_VEH_BRAND",
                "Brand",
                "BRAND",
                "ItmsGrpNam",
                "MAKE",
                "Make",
              ]) ||
              "N/A",
            model:
              enquiry.MODELNAME ||
              enquiry.MODEL ||
              getVehicleFallbackValue([
                "U_Veh_ModelDescr",
                "U_Veh_ModelFull",
                "U_Veh_Model",
                "U_VEH_MODEL",
                "Model Description",
                "MODEL",
                "Model",
              ]) ||
              "N/A",
            variant:
              enquiry.VARIANTNAME ||
              enquiry.VARIANT ||
              getVehicleFallbackValue([
                "ItemCode",
                "ITEMCODE",
                "ProductCode",
                "PRODUCTCODE",
              ]) ||
              "N/A",
            year:
              enquiry.YEAR ||
              getVehicleFallbackValue([
                "U_Veh_MY",
                "U_VEH_MY",
                "Model Year",
                "MODELYEAR",
                "YEAR",
                "Year",
              ]) ||
              "N/A",
            color:
              enquiry.COLOR ||
              getVehicleFallbackValue([
                "U_Veh_Color",
                "U_VEH_COLOR",
                "COLOR",
                "Color",
              ]) ||
              "N/A",
            vin:
              enquiry.VINNUMBER ||
              getVehicleFallbackValue([
                "VIN",
                "VINNUMBER",
                "vin",
                "vinNumber",
                "U_Veh_StockID",
                "U_VEH_STOCKID",
              ]) ||
              "N/A",
            modelCode:
              enquiry.MODELCODE ||
              getVehicleFallbackValue([
                "U_Vehicle_MC",
                "U_VEHICLE_MC",
                "Model Code",
                "MODELCODE",
              ]) ||
              "N/A",
            suppCatNum:
              enquiry.SUPPCATNUM ||
              getVehicleFallbackValue(["SuppCatNum", "SUPPCATNUM"]) ||
              "N/A",
            warehouse:
              getVehicleFallbackValue(["WhsName", "WHSNAME", "WhsCode", "WHSCODE"]) || "N/A",
            location: getVehicleFallbackValue(["Location", "LOCATION"]) || "N/A",
            price: formatVehiclePrice(
              getVehicleFallbackValue([
                "Price",
                "PRICE",
                "Amount",
                "AMOUNT",
                "UnitPrice",
                "UNITPRICE",
              ]),
              getVehicleFallbackValue(["Currency", "CURRENCY", "Curr", "CURR"]) || "SAR"
            ),
          },
        ];

  const charge = getChargeDetails();

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
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium">{vehicle.label}</h4>
                    <Badge variant="outline">Qty {vehicle.quantity}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Make:</span>
                      <p className="font-medium">{vehicle.make}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Model:</span>
                      <p className="font-medium">{vehicle.model}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Variant:</span>
                      <p className="font-medium">{vehicle.variant}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Year:</span>
                      <p className="font-medium">{vehicle.year}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Color:</span>
                      <p className="font-medium">{vehicle.color}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">VIN Number:</span>
                      <p className="font-medium">{vehicle.vin}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Model Code:</span>
                      <p className="font-medium">{vehicle.modelCode}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Supp Cat Num:</span>
                      <p className="font-medium">{vehicle.suppCatNum}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Warehouse:</span>
                      <p className="font-medium">{vehicle.warehouse}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="font-medium">{vehicle.location}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="font-medium">{vehicle.price}</p>
                    </div>
                  </div>
                </div>
              ))}
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
              <div>
                <span className="text-muted-foreground">Charge Code:</span>
                <p className="font-medium">{charge.code || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Charge Name:</span>
                <p className="font-medium">{charge.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Charge Price:</span>
                <p className="font-medium">{charge.price || "N/A"}</p>
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
