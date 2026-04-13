"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import {
    searchCustomers,
    getCustomerAddress,
    getCustomerfinancialInformation,
    getVehicleHistory
} from "@/services/customer";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, MapPin, DollarSign, Car, Building2, Phone, Mail, User, Calendar, CreditCard, TrendingUp } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { DataTable } from "./components/data-table";
import { columns, type VehicleHistory } from "./components/columns";
import { logger } from '@/lib/logger';
import type { AxiosError } from "axios";

interface Customer {
    CardCode: string;
    CardName: string;
    Phone1?: string | null;
    Phone2?: string | null;
    Cellular?: string | null;
    E_Mail?: string | null;
}

const isCustomer = (value: unknown): value is Customer => {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const customer = value as Partial<Customer>;
    return typeof customer.CardCode === "string" && typeof customer.CardName === "string";
};

const normalizeCustomers = (rows: unknown[]): Customer[] => {
    const seen = new Set<string>();
    const uniqueCustomers: Customer[] = [];

    for (const row of rows) {
        if (!isCustomer(row)) {
            continue;
        }

        const customerKey = `${row.CardCode.trim().toUpperCase()}::${row.CardName.trim().toUpperCase()}`;
        if (seen.has(customerKey)) {
            continue;
        }

        seen.add(customerKey);
        uniqueCustomers.push(row);
    }

    return uniqueCustomers;
};

const CustomerMaster = () => {
    const { data: session } = useSession();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const debouncedSearch = useDebounce(searchQuery, 300);

    // Search customers
    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedSearch.trim()) {
                setCustomers([]);
                setShowResults(false);
                setSearchError(null);
                return;
            }

            setIsSearching(true);
            setSearchError(null);
            try {
                const result = await searchCustomers(
                    debouncedSearch.toString(),
                    "68"
                );
                if (Array.isArray(result)) {
                    setCustomers(normalizeCustomers(result));
                    setShowResults(true);
                } else {
                    setCustomers([]);
                    setShowResults(true);
                }
            } catch (error) {
                const axiosError = error as AxiosError<{ message?: string }>;
                const errorMessage =
                    axiosError.response?.data?.message ||
                    "Customer search is temporarily unavailable. Please try again.";

                logger.error("Search error:", error);
                setCustomers([]);
                setShowResults(true);
                setSearchError(errorMessage);
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [debouncedSearch]);

    // Fetch customer details when selected
    const { data: addressData, isLoading: isLoadingAddress } = useQuery({
        queryKey: ["customer-address", selectedCustomer?.CardCode],
        queryFn: () => getCustomerAddress(selectedCustomer!.CardCode),
        enabled: !!selectedCustomer?.CardCode,
    });

    const { data: financialData, isLoading: isLoadingFinancial } = useQuery({
        queryKey: ["customer-financial", selectedCustomer?.CardCode],
        queryFn: () => getCustomerfinancialInformation(selectedCustomer!.CardCode),
        enabled: !!selectedCustomer?.CardCode,
    });

    const { data: vehicleHistoryData, isLoading: isLoadingVehicleHistory } = useQuery({
        queryKey: ["customer-vehicle-history", selectedCustomer?.CardCode],
        queryFn: () => getVehicleHistory(selectedCustomer!.CardCode),
        enabled: !!selectedCustomer?.CardCode,
    });

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setSearchQuery(`${customer.CardCode} - ${customer.CardName}`);
        setShowResults(false);
        setSearchError(null);
        setCustomers([]);
    };

    const handleClear = () => {
        setSearchQuery("");
        setSelectedCustomer(null);
        setCustomers([]);
        setShowResults(false);
        setSearchError(null);
    };

    return (
        <div className="space-y-4 p-4">
            <div className="flex flex-col gap-3">
                <div>
                    <h1 className="text-xl font-bold mb-3 text-primary font-sans">Customer Master</h1>

                    {/* Search Box */}
                    <div className="relative mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSelectedCustomer(null);
                                    if (e.target.value.trim()) {
                                        setShowResults(true);
                                    } else {
                                        setShowResults(false);
                                        setCustomers([]);
                                    }
                                }}
                                onFocus={() => {
                                    if (customers.length > 0 && !selectedCustomer) {
                                        setShowResults(true);
                                    }
                                }}
                                onBlur={() => {
                                    // Delay hiding to allow click events to fire
                                    setTimeout(() => {
                                        if (selectedCustomer) {
                                            setShowResults(false);
                                        }
                                    }, 200);
                                }}
                                placeholder="Search by Customer ID, Name, Phone, or Email..."
                                className="pl-9 h-10"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && !selectedCustomer && (
                            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {isSearching ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                                    </div>
                                ) : searchError ? (
                                    <div className="p-4 text-sm text-center text-destructive">
                                        {searchError}
                                    </div>
                                ) : customers.length > 0 ? (
                                    <div className="p-1">
                                        {customers.map((customer) => (
                                            <button
                                                type="button"
                                                key={`${customer.CardCode}-${customer.CardName}`}
                                                onClick={() => handleSelectCustomer(customer)}
                                                className="w-full text-left px-3 py-2 rounded-sm hover:bg-muted cursor-pointer transition-colors"
                                            >
                                                <div className="font-medium text-sm">
                                                    {customer.CardCode} - {customer.CardName}
                                                </div>
                                                {(customer.Cellular || customer.Phone1 || customer.E_Mail) && (
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {customer.Cellular && `📱 ${customer.Cellular}`}
                                                        {customer.Phone1 && ` • 📞 ${customer.Phone1}`}
                                                        {customer.E_Mail && ` • ✉️ ${customer.E_Mail}`}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : searchQuery.trim() ? (
                                    <div className="p-4 text-sm text-center text-muted-foreground">
                                        No customers found
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Customer Details - Scrollable Sections */}
                    {selectedCustomer && (
                        <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                            {/* Selected Customer Header */}
                            <Card className="border-2 border-primary/20 bg-card">
                                <CardHeader className="">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base font-bold text-card-foreground font-sans">{selectedCustomer.CardName}</CardTitle>
                                            <CardDescription className="text-xs mt-1 font-mono text-muted-foreground">Customer Id: {selectedCustomer.CardCode}</CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                            <User className="h-3 w-3 mr-1" />
                                            Active
                                        </Badge>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Address Section */}
                            <Card className="border-l-4 border-l-chart-1">
                                <CardHeader className="pb-0">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-chart-1/10">
                                            <MapPin className="h-3.5 w-3.5 text-chart-1" />
                                        </div>
                                        <CardTitle className="text-sm font-semibold font-sans">Address Information</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {isLoadingAddress ? (
                                        <div className="flex items-center justify-center py-3">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : Array.isArray(addressData) ? (
                                        addressData.length > 0 ? (
                                            <div className="space-y-2.5">
                                                {addressData.map((address: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className={cn(
                                                            "border rounded-md p-2.5 bg-muted/30",
                                                            address.AddressType === "ShippingAddress"
                                                                ? "border-chart-1/30"
                                                                : "border-chart-2/30"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "text-xs font-sans",
                                                                    address.AddressType === "ShippingAddress"
                                                                        ? "bg-chart-1/10 text-chart-1 border-chart-1/30"
                                                                        : "bg-chart-2/10 text-chart-2 border-chart-2/30"
                                                                )}
                                                            >
                                                                {address.AddressType || `Address ${index + 1}`}
                                                            </Badge>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-sans">
                                                            {Object.entries(address)
                                                                .filter(([key, value]) =>
                                                                    key !== "AddressType" &&
                                                                    value !== null &&
                                                                    value !== undefined &&
                                                                    value !== ""
                                                                )
                                                                .map(([key, value]) => (
                                                                    <div key={key} className="flex flex-col">
                                                                        <span className="text-muted-foreground text-[10px] mb-0.5 capitalize">
                                                                            {key.replace(/([A-Z])/g, " $1").trim()}:
                                                                        </span>
                                                                        <p className="font-medium text-xs leading-tight">{String(value)}</p>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2 font-sans">No address information available</p>
                                        )
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-2 font-sans">No address information available</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Financial Information Section */}
                            <Card className="border-l-4 border-l-chart-3">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-chart-3/10">
                                            <DollarSign className="h-3.5 w-3.5 text-chart-3" />
                                        </div>
                                        <CardTitle className="text-sm font-semibold font-sans">Financial Information</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    {isLoadingFinancial ? (
                                        <div className="flex items-center justify-center py-3">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : Array.isArray(financialData) ? (
                                        financialData.length > 0 ? (
                                            <div className="space-y-3">
                                                {financialData.map((financial: any, index: number) => (
                                                    <div key={index} className="space-y-2.5">
                                                        {/* Key Financial Metrics */}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                            {financial["KSA Status"] && (
                                                                <div className="bg-chart-1/10 border border-chart-1/30 rounded-md p-2">
                                                                    <div className="text-[10px] text-chart-1 mb-1 font-sans">Status</div>
                                                                    <Badge variant="outline" className="bg-chart-1/20 text-chart-1 border-chart-1/40 text-xs font-sans">
                                                                        {financial["KSA Status"]}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                            {financial["ThisYearSales"] && (
                                                                <div className="bg-chart-2/10 border border-chart-2/30 rounded-md p-2">
                                                                    <div className="text-[10px] text-chart-2 mb-1 font-sans">This Year Sales</div>
                                                                    <div className="font-bold text-xs text-chart-2 font-sans">
                                                                        {parseFloat(financial["ThisYearSales"]).toLocaleString()} SAR
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {financial["CreditLimit"] && (
                                                                <div className="bg-chart-3/10 border border-chart-3/30 rounded-md p-2">
                                                                    <div className="text-[10px] text-chart-3 mb-1 font-sans">Credit Limit</div>
                                                                    <div className="font-bold text-xs text-chart-3 font-sans">
                                                                        {parseFloat(financial["CreditLimit"]).toLocaleString()} SAR
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {financial["Currency"] && (
                                                                <div className="bg-chart-4/10 border border-chart-4/30 rounded-md p-2">
                                                                    <div className="text-[10px] text-chart-4 mb-1 font-sans">Currency</div>
                                                                    <div className="font-bold text-xs text-chart-4 font-sans">{financial["Currency"]}</div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Company Information */}
                                                        <div className="bg-muted/30 rounded-md p-2.5">
                                                            <div className="flex items-center gap-1.5 mb-2">
                                                                <Building2 className="h-3 w-3 text-chart-3" />
                                                                <h4 className="text-xs font-semibold font-sans">Company Details</h4>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-sans">
                                                                {Object.entries(financial)
                                                                    .filter(([key, value]) => {
                                                                        const excludedKeys = ["CardCode", "CardName", "KSA Status", "ThisYearSales", "CreditLimit", "Currency"];
                                                                        return !excludedKeys.includes(key) &&
                                                                            value !== null &&
                                                                            value !== undefined &&
                                                                            value !== "" &&
                                                                            !key.includes("Contact") &&
                                                                            !key.includes("Address") &&
                                                                            !key.includes("Street") &&
                                                                            !key.includes("Block") &&
                                                                            !key.includes("ZipCode") &&
                                                                            !key.includes("City") &&
                                                                            !key.includes("County") &&
                                                                            !key.includes("State") &&
                                                                            !key.includes("Country") &&
                                                                            !key.includes("TaxOffice");
                                                                    })
                                                                    .slice(0, 12)
                                                                    .map(([key, value]) => (
                                                                        <div key={key} className="flex flex-col">
                                                                            <span className="text-muted-foreground text-[10px] mb-0.5">
                                                                                {key}:
                                                                            </span>
                                                                            <p className="font-medium text-xs leading-tight">
                                                                                {typeof value === "number"
                                                                                    ? value.toLocaleString()
                                                                                    : String(value)}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </div>

                                                        {/* Contact Information */}
                                                        {(financial.CntctPrsn || financial.Name || financial["Company Email"] || financial.Cellular) && (
                                                            <div className="bg-muted/30 rounded-md p-2.5">
                                                                <div className="flex items-center gap-1.5 mb-2">
                                                                    <Phone className="h-3 w-3 text-chart-1" />
                                                                    <h4 className="text-xs font-semibold font-sans">Contact</h4>
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-sans">
                                                                    {Object.entries(financial)
                                                                        .filter(([key, value]) => {
                                                                            const contactKeys = [
                                                                                "CntctPrsn", "Name", "Position", "Tel1", "Tel2",
                                                                                "Cellolar", "Company Email", "E_Mail", "Cellular",
                                                                                "Contact Active Status", "FirstName", "MiddleName",
                                                                                "LastName", "Title"
                                                                            ];
                                                                            return contactKeys.includes(key) &&
                                                                                value !== null &&
                                                                                value !== undefined &&
                                                                                value !== "";
                                                                        })
                                                                        .map(([key, value]) => (
                                                                            <div key={key} className="flex flex-col">
                                                                                <span className="text-muted-foreground text-[10px] mb-0.5">
                                                                                    {key}:
                                                                                </span>
                                                                                <p className="font-medium text-xs leading-tight">{String(value)}</p>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2 font-sans">No financial information available</p>
                                        )
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-2 font-sans">No financial information available</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Vehicle History Section */}
                            <Card className="border-l-4 border-l-chart-5">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-chart-5/10">
                                            <Car className="h-3.5 w-3.5 text-chart-5" />
                                        </div>
                                        <CardTitle className="text-sm font-semibold font-sans">Vehicle Purchase History</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    {isLoadingVehicleHistory ? (
                                        <div className="flex items-center justify-center py-3">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : Array.isArray(vehicleHistoryData) ? (
                                        vehicleHistoryData.length > 0 ? (
                                            <DataTable
                                                columns={columns}
                                                data={vehicleHistoryData as unknown as VehicleHistory[]}
                                            />
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2">No vehicle purchase history available</p>
                                        )
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-2">No vehicle purchase history available</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Empty State */}
                    {!selectedCustomer && !isSearching && !showResults && (
                        <div className="flex items-center justify-center py-12 text-center">
                            <div>
                                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <p className="text-sm text-muted-foreground">
                                    Search for a customer to view their details
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerMaster;
