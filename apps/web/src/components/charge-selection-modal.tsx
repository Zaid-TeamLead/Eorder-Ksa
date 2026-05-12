"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconSearch } from "@tabler/icons-react";
import { ButtonLoading } from "@/components/shared/button-loading";
import type { VehicleChargeItem } from "@/services/vehicles";
import { toSafeText } from "@/lib/value-normalizers";
import { getVehicleChargePrice } from "@/lib/vehicle-charge";

interface ChargeSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCharge: (charge: VehicleChargeItem) => void;
  charges: VehicleChargeItem[];
  isLoading?: boolean;
  hasError?: boolean;
}

interface IndexedCharge {
  id: string;
  code: string;
  name: string;
  price: string;
  raw: VehicleChargeItem;
}

export function ChargeSelectionModal({
  open,
  onOpenChange,
  onSelectCharge,
  charges,
  isLoading = false,
  hasError = false,
}: ChargeSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChargeId, setSelectedChargeId] = useState<string>("");
  const deferredSearch = useDeferredValue(searchQuery);

  const indexedCharges = useMemo<IndexedCharge[]>(() => {
    return (charges || []).map((charge, index) => {
      const code = toSafeText(charge.ITEMCODE) || "N/A";
      const name = toSafeText(charge.FRGNANME || charge.ITEMNAME) || "N/A";
      const price = getVehicleChargePrice(charge) || "N/A";
      const id = `${code}-${name}-${index}`;

      return {
        id,
        code,
        name,
        price,
        raw: charge,
      };
    });
  }, [charges]);

  const filteredCharges = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return indexedCharges;

    return indexedCharges.filter((charge) =>
      [charge.code, charge.name, charge.price]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [deferredSearch, indexedCharges]);

  const selectedCharge = useMemo(
    () => filteredCharges.find((charge) => charge.id === selectedChargeId) ?? null,
    [filteredCharges, selectedChargeId]
  );

  const handleConfirm = () => {
    if (!selectedCharge) return;
    onSelectCharge(selectedCharge.raw);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setSearchQuery("");
          setSelectedChargeId("");
        }
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] w-full h-full flex flex-col sm:max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Charge</DialogTitle>
          <DialogDescription>
            Browse and select a sales charge item.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full md:max-w-sm">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-9 text-sm"
            placeholder="Search charge code or name"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <ButtonLoading text="Loading charges..." size="sm" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px] text-xs">Code</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="w-[180px] text-xs">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasError ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-xs text-destructive py-8">
                      Failed to load charge items. Please check server logs.
                    </TableCell>
                  </TableRow>
                ) : filteredCharges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-8">
                      No charge items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCharges.map((charge) => {
                    const isSelected = selectedChargeId === charge.id;
                    return (
                      <TableRow
                        key={charge.id}
                        className={isSelected ? "bg-muted/50" : "cursor-pointer"}
                        onClick={() => setSelectedChargeId(charge.id)}
                      >
                        <TableCell className="text-xs font-medium">{charge.code}</TableCell>
                        <TableCell className="text-xs">{charge.name}</TableCell>
                        <TableCell className="text-xs">{charge.price}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selectedCharge}>
            Select Charge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
