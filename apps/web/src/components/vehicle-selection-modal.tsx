"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IconSearch, IconCheck } from "@tabler/icons-react";
import type { VehicleInventory } from "@/services/vehicles";
import { ButtonLoading } from "@/components/shared/button-loading";

interface VehicleSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVehicle: (vehicle: VehicleInventory) => void;
  vehicles: VehicleInventory[];
  isLoading?: boolean;
}

export function VehicleSelectionModal({
  open,
  onOpenChange,
  onSelectVehicle,
  vehicles,
  isLoading,
}: VehicleSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleInventory | null>(null);

  // Filter vehicles based on search query
  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = searchQuery.toLowerCase();
    return (
      vehicle.U_Veh_Brand?.toLowerCase().includes(query) ||
      vehicle.U_Veh_Model?.toLowerCase().includes(query) ||
      vehicle.U_Veh_ModelDescr?.toLowerCase().includes(query) ||
      vehicle.VIN?.toLowerCase().includes(query) ||
      vehicle.U_Veh_Color?.toLowerCase().includes(query)
    );
  });

  const handleSelect = () => {
    if (selectedVehicle) {
      onSelectVehicle(selectedVehicle);
      onOpenChange(false);
      setSelectedVehicle(null);
      setSearchQuery("");
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedVehicle(null);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Select Vehicle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by brand, model, VIN, or color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Vehicle List */}
          <div className="border rounded-lg max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <ButtonLoading text="Loading vehicles..." size="sm" />
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-muted-foreground">
                  {searchQuery ? "No vehicles found matching your search" : "No vehicles available"}
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => {
                    const isSelected = selectedVehicle?.VIN === vehicle.VIN;
                    return (
                      <TableRow
                        key={vehicle.VIN}
                        className={`cursor-pointer ${
                          isSelected ? "bg-muted" : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <TableCell>
                          {isSelected && (
                            <IconCheck className="h-4 w-4 text-primary" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{vehicle.VIN}</TableCell>
                        <TableCell>{vehicle.U_Veh_Brand || "N/A"}</TableCell>
                        <TableCell>{vehicle.U_Veh_Model || "N/A"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {vehicle.U_Veh_ModelDescr || "N/A"}
                        </TableCell>
                        <TableCell>{vehicle.U_Veh_Color || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-600 border-green-500/20"
                          >
                            Available
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Selection Info */}
          {selectedVehicle && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Selected Vehicle:</div>
              <div className="text-sm text-muted-foreground">
                {selectedVehicle.U_Veh_Brand} {selectedVehicle.U_Veh_Model} -{" "}
                {selectedVehicle.U_Veh_ModelDescr} (VIN: {selectedVehicle.VIN})
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedVehicle}>
            Select Vehicle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
