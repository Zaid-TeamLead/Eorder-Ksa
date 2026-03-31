"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VinDetailsCardProps {
    vin: any;
    vinValue: string;
    quantity: number;
    onQuantityChange: (quantity: number) => void;
    onRemove: () => void;
}

export function VinDetailsCard({
    vin,
    vinValue,
    quantity,
    onQuantityChange,
    onRemove,
}: VinDetailsCardProps) {
    const getValue = (keys: string[]) => {
        for (const key of keys) {
            const value = vin?.[key];
            if (value !== undefined && value !== null && String(value).trim() !== "") {
                return String(value).trim();
            }
        }
        return "";
    };

    const formatMoney = (raw: string) => {
        if (!raw) return "N/A";
        const parsed = Number(String(raw).replace(/,/g, "").replace(/[^0-9.-]/g, ""));
        if (!Number.isFinite(parsed)) return "N/A";
        return `${currency} ${parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const make = getValue(["U_Veh_Brand", "U_VEH_BRAND", "Brand", "BRAND"]) || "N/A";
    const model = getValue(["U_Veh_ModelDescr", "U_Veh_ModelFull", "U_Veh_Model", "U_VEH_MODEL", "Model Description", "MODEL"]) || "N/A";
    const variant = getValue(["ItemCode", "ITEMCODE", "ProductCode", "PRODUCTCODE"]) || "N/A";
    const year = getValue(["U_Veh_MY", "U_VEH_MY", "Model Year", "MODELYEAR", "YEAR", "Year"]) || "N/A";
    const color = getValue(["U_Veh_Color", "U_VEH_COLOR", "COLOR", "Color"]) || "N/A";
    const modelCode = getValue(["U_Vehicle_MC", "U_VEHICLE_MC", "Model Code", "MODELCODE"]) || "N/A";
    const suppCatNum = getValue(["SuppCatNum", "SUPPCATNUM"]) || modelCode;
    const warehouse = getValue(["WhsName", "WHSNAME", "WhsCode", "WHSCODE"]) || "N/A";
    const location = getValue(["Location", "LOCATION"]) || "N/A";
    const currency = getValue(["Currency", "CURRENCY", "Curr", "CURR"]) || "SAR";
    const price = formatMoney(getValue(["Price", "PRICE", "Amount", "AMOUNT", "UnitPrice", "UNITPRICE"]));
    const discPrice = formatMoney(getValue(["Discprice", "DISCPRICE", "DiscountPrice", "DISCOUNTPRICE", "NetPrice", "NETPRICE"]));
    const discountRaw = getValue(["Discount", "DISCOUNT", "DiscPrcnt", "DISCPRCNT", "DiscPercent", "DISCPERCENT"]);
    const discount = discountRaw ? (discountRaw.includes("%") ? discountRaw : formatMoney(discountRaw)) : "N/A";

    const availableRaw = vin?.Available ?? vin?.available ?? vin?.["Total Stock"] ?? vin?.TotalStock;
    const available = Number.isFinite(Number(availableRaw)) && Number(availableRaw) > 0
        ? Number(availableRaw)
        : undefined;

    return (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground">VIN: {vinValue}</h4>
                <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
                    Remove
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <div>
                    <span className="text-muted-foreground">Make</span>
                    <Input readOnly value={make} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">Model</span>
                    <Input readOnly value={model} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">Variant</span>
                    <Input readOnly value={variant} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">Model Year</span>
                    <Input readOnly value={year} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">Color</span>
                    <Input readOnly value={color} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">Supp Cat Num</span>
                    <Input readOnly value={suppCatNum} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">Model Code</span>
                    <Input readOnly value={modelCode} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">Location</span>
                    <Input readOnly value={location} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">Warehouse</span>
                    <Input readOnly value={warehouse} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">Price</span>
                    <Input readOnly value={price} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">Discount</span>
                    <Input readOnly value={discount} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">Discprice</span>
                    <Input readOnly value={discPrice} className="h-7 mt-1 text-xs bg-muted/40" />
                </div>
                <div>
                    <span className="text-muted-foreground">
                        Quantity{available ? ` (Available: ${available})` : ""}
                    </span>
                    <Input
                        type="number"
                        min={1}
                        max={available}
                        value={quantity || 1}
                        onChange={(e) => {
                            const parsed = Number(e.target.value || 1);
                            const normalized = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
                            const bounded = available ? Math.min(normalized, available) : normalized;
                            onQuantityChange(bounded);
                        }}
                        className="h-7 mt-1 text-xs"
                    />
                </div>
            </div>
        </div>
    );
}
