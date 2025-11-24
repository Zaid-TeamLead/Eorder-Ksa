"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VinSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vinNumbers: any[];
    loading: boolean;
    selectedVins: Set<string>;
    onSelectedVinsChange: (vins: Set<string>) => void;
    onConfirm: (selectedVins: Set<string>) => void;
}

export function VinSelectionDialog({
    open,
    onOpenChange,
    vinNumbers,
    loading,
    selectedVins,
    onSelectedVinsChange,
    onConfirm,
}: VinSelectionDialogProps) {
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allVins = new Set(vinNumbers.map((vin: any) => vin.VIN || vin.vin || vin.vinNumber));
            onSelectedVinsChange(allVins);
        } else {
            onSelectedVinsChange(new Set());
        }
    };

    const handleVinToggle = (vinValue: string) => {
        const newSelected = new Set(selectedVins);
        if (newSelected.has(vinValue)) {
            newSelected.delete(vinValue);
        } else {
            newSelected.add(vinValue);
        }
        onSelectedVinsChange(newSelected);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-2rem)] w-full h-full flex flex-col sm:max-w-7xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Select VIN Numbers</DialogTitle>
                    <DialogDescription>
                        Select one or more VIN numbers from the available inventory. You can select multiple VINs at once.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        Loading VIN numbers...
                    </div>
                ) : vinNumbers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        No VIN numbers available for this vehicle.
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-y-scroll flex-1">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedVins.size === vinNumbers.length && vinNumbers.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="text-xs">VIN</TableHead>
                                    <TableHead className="text-xs">Location</TableHead>
                                    <TableHead className="text-xs">Warehouse</TableHead>
                                    <TableHead className="text-xs">Color</TableHead>
                                    <TableHead className="text-xs">Model Description</TableHead>
                                    <TableHead className="text-xs">Model Year</TableHead>
                                    <TableHead className="text-xs">Price</TableHead>
                                    <TableHead className="text-xs">Discounted Price</TableHead>
                                    <TableHead className="text-xs">Currency</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vinNumbers.map((vin: any) => {
                                    const vinValue = vin.VIN || vin.vin || vin.vinNumber;
                                    const isSelected = selectedVins.has(vinValue);
                                    return (
                                        <TableRow
                                            key={vinValue}
                                            className={isSelected ? "bg-muted/50" : ""}
                                            onClick={() => handleVinToggle(vinValue)}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleVinToggle(vinValue)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </TableCell>
                                            <TableCell className="text-xs font-medium">{vinValue}</TableCell>
                                            <TableCell className="text-xs">{vin.Location || "-"}</TableCell>
                                            <TableCell className="text-xs">{vin.WhsName || "-"}</TableCell>
                                            <TableCell className="text-xs">{vin.U_Veh_Color || "-"}</TableCell>
                                            <TableCell className="text-xs">{vin.U_Veh_ModelDescr || "-"}</TableCell>
                                            <TableCell className="text-xs">{vin.U_Veh_MY || "-"}</TableCell>
                                            <TableCell className="text-xs">
                                                {vin.Price ? `${parseFloat(vin.Price).toLocaleString()} ${vin.Currency || "SAR"}` : "-"}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {vin.Discprice ? `${parseFloat(vin.Discprice).toLocaleString()} ${vin.Currency || "SAR"}` : "-"}
                                            </TableCell>
                                            <TableCell className="text-xs">{vin.Currency || "SAR"}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false);
                            onSelectedVinsChange(new Set());
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            onConfirm(selectedVins);
                            onOpenChange(false);
                        }}
                        disabled={selectedVins.size === 0}
                    >
                        Select {selectedVins.size > 0 ? `${selectedVins.size} ` : ""}VIN{selectedVins.size !== 1 ? "s" : ""}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

