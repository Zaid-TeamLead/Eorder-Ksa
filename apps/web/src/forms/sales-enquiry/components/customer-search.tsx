"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, UserPlus, Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Customer {
  SlpCode: number;
  SlpName: string;
  CardCode: string;
  CardName: string;
  Phone1: string | null;
  Phone2: string | null;
  Cellular: string | null;
  E_Mail: string | null;
  Notes: string | null;
  Street: string | null;
  Block: string | null;
  ZipCode: string | null;
  City: string | null;
  County: string | null;
  Country: string | null;
  RegionCode: string | null;
  Region: string | null;
  Address2: string | null;
  Address3: string | null;
  StreetNo: string | null;
}

interface CustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => Promise<{ success: boolean; data: Customer[] } | undefined>;
  onNewCustomer: () => void;
  onCustomerSelect?: (customer: Customer) => void;
}

export function CustomerSearch({
  value,
  onChange,
  onSearch,
  onNewCustomer,
  onCustomerSelect,
}: CustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleSearch = async () => {
    if (!value.trim()) return;

    setIsSearching(true);
    try {
      const result = await onSearch(value);
      if (result?.success && result.data) {
        setCustomers(result.data);
        setOpen(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setCustomers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpen(false);
    onChange(customer.CardName || "");
    if (onCustomerSelect) {
      onCustomerSelect(customer);
    }
  };

  return (
    <div className="rounded-lg p-2.5 border space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <div className="relative flex-1 max-w-[240px]">
            <Input
              id="customer-search"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setSelectedCustomer(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Search customer by BP code, name, phone, or email"
              className={cn(
                "h-7 text-xs pr-7",
                value && "border-primary ring-primary/20 ring-1"
              )}
            />
            {selectedCustomer && (
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-medium">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleSearch}
            disabled={isSearching || !value.trim()}
            className="h-7 shrink-0 text-xs px-2"
          >
            <Search className="w-3 h-3 mr-1" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
            onClick={() => {
              setSelectedCustomer(null);
              onChange("");
              onNewCustomer();
            }}
          >
            <UserPlus className="w-2.5 h-2.5 mr-1" />
            New Customer
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {open && customers.length > 0 && (
        <div className="border rounded-lg max-h-60 overflow-y-auto">
          <Command>
            <CommandList>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.CardCode}
                    value={customer.CardName}
                    onSelect={() => handleSelect(customer)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5 flex-1 py-1.5">
                      <div className="font-medium text-xs">
                        {customer.CardName}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {customer.CardCode}
                        {customer.Cellular && ` • ${customer.Cellular}`}
                        {customer.City && ` • ${customer.City}`}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

      {open && customers.length === 0 && !isSearching && (
        <div className="text-xs text-muted-foreground text-center py-1.5">
          No customers found.
        </div>
      )}
    </div>
  );
}
