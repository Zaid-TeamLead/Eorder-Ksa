"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VinDetailsCardProps {
    vin: any;
    vinValue: string;
    onRemove: (vinValue: string) => void;
}

export function VinDetailsCard({
    vin,
    vinValue,
    onRemove,
}: VinDetailsCardProps) {
    return (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground">VIN: {vinValue}</h4>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-1.5 text-xs">
                {vin.Location && (
                    <div>
                        <span className="text-muted-foreground">Location:</span>
                        <p className="font-medium truncate">{vin.Location}</p>
                    </div>
                )}
                {vin.U_Veh_Color && (
                    <div>
                        <span className="text-muted-foreground">Color:</span>
                        <p className="font-medium truncate">{vin.U_Veh_Color}</p>
                    </div>
                )}
                {vin.U_Veh_MY && (
                    <div>
                        <span className="text-muted-foreground">Year:</span>
                        <p className="font-medium">{vin.U_Veh_MY}</p>
                    </div>
                )}
                {vin.Price && (
                    <div>
                        <span className="text-muted-foreground">Price:</span>
                        <p className="font-medium">
                            {parseFloat(vin.Price).toLocaleString()} {vin.Currency || "SAR"}
                        </p>
                    </div>
                )}
                {vin.Discprice && (
                    <div>
                        <span className="text-muted-foreground">Disc. Price:</span>
                        <p className="font-medium">
                            {parseFloat(vin.Discprice).toLocaleString()} {vin.Currency || "SAR"}
                        </p>
                    </div>
                )}
                {vin.WhsName && (
                    <div>
                        <span className="text-muted-foreground">Warehouse:</span>
                        <p className="font-medium truncate text-xs">{vin.WhsName}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

