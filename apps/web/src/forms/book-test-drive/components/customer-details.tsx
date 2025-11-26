"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { CustomerSearch } from "./customer-search";
import { cn } from "@/lib/utils";
import type { BookTestDriveFormData } from "../schema";

interface CustomerDetailsProps {
    customerSearch: string;
    onCustomerSearchChange: (value: string) => void;
    onCustomerSearch: (query: string) => Promise<{ success: boolean; data: any[] } | undefined>;
    onNewCustomer: () => void;
    onCustomerSelect?: (customer: any) => void;
}

export function CustomerDetails({
    customerSearch,
    onCustomerSearchChange,
    onCustomerSearch,
    onNewCustomer,
    onCustomerSelect,
}: CustomerDetailsProps) {
    const form = useFormContext<BookTestDriveFormData>();

    return (
        <div className="space-y-3">
            <CustomerSearch
                value={customerSearch}
                onChange={onCustomerSearchChange}
                onSearch={onCustomerSearch}
                onNewCustomer={onNewCustomer}
                onCustomerSelect={onCustomerSelect}
            />

            <div className="grid grid-cols-2 gap-3">
                <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Customer ID</FormLabel>
                            <FormControl>
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Auto-filled"
                                    {...field}
                                    readOnly
                                />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Customer Name</FormLabel>
                            <FormControl>
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Enter name"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">

                <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Postcode</FormLabel>
                            <FormControl>
                                <Input className="h-8 text-xs" placeholder="Enter postcode" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-medium text-muted-foreground">Address</FormLabel>
                        <FormControl>
                            <textarea
                                rows={2}
                                className={cn(
                                    "text-xs resize-none",
                                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-2.5 py-1.5 shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2",
                                    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                                )}
                                placeholder="Enter address"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                    </FormItem>
                )}
            />
        </div>
    );
}

