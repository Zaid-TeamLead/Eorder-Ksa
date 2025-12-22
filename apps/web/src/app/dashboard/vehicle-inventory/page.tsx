"use client";
import { getAllVehicleInventory, type VehicleInventory } from '@/services/vehicles';
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "./components/data-table";
import { createColumns } from "./components/columns";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const VehicleInventoryPage = () => {
    const router = useRouter();
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleInventory | null>(null);

    const { data: vehicles = [], isLoading, error } = useQuery({
        queryKey: ["vehicle-inventory"],
        queryFn: getAllVehicleInventory,
    });

    const vehiclesOver100Days = useMemo(() => {
        return vehicles.filter((vehicle) => vehicle.AgeinDays > 100).length;
    }, [vehicles]);

    const handleBookTestDrive = (vehicle: VehicleInventory) => {
        // Store vehicle in sessionStorage for the test drive form
        sessionStorage.setItem('selectedVehicle', JSON.stringify(vehicle));
        // Navigate to test drive page with immediate booking flag
        router.push('/dashboard/test-drive?action=create&immediate=true');
    };

    const columns = useMemo(() => createColumns(handleBookTestDrive), []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-sm text-muted-foreground">Loading vehicle inventory...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-sm text-destructive">
                    Error loading vehicle inventory. Please try again.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div>
                    <h1 className="text-2xl font-semibold mb-4">Vehicle Inventory</h1>
                    <DataTable columns={columns} data={vehicles} />
                    <div className="grid gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="@container/card">
                            <CardHeader>
                                <CardDescription>Vehicles Over 100 Days</CardDescription>
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                    {vehiclesOver100Days}
                                </CardTitle>
                                <CardAction>
                                    <Badge variant={vehiclesOver100Days > 0 ? "destructive" : "outline"}>
                                        <IconAlertTriangle className="h-3 w-3 mr-1" />
                                        {vehiclesOver100Days > 0 ? "Attention Required" : "All Clear"}
                                    </Badge>
                                </CardAction>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <div className="line-clamp-1 flex gap-2 font-medium">
                                    {vehiclesOver100Days > 0
                                        ? `${vehiclesOver100Days} vehicle${vehiclesOver100Days !== 1 ? 's' : ''} need attention`
                                        : "No vehicles exceed 100 days"
                                    }
                                </div>
                                <div className="text-muted-foreground">
                                    {vehiclesOver100Days > 0
                                        ? "Consider reviewing inventory management"
                                        : "All vehicles are within acceptable age range"
                                    }
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VehicleInventoryPage;