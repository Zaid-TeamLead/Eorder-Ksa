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
    <div className="rounded-lg p-4 border space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-[280px]">
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
              placeholder="Search customer by name, phone, or email"
              className={cn(
                "h-8 text-sm pr-8",
                value && "border-primary ring-primary/20 ring-1"
              )}
            />
            {selectedCustomer && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                <Check className="w-3 h-3" />
              </span>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleSearch}
            disabled={isSearching || !value.trim()}
            className="h-8 shrink-0"
          >
            <Search className="w-3.5 h-3.5 mr-1.5" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
            onClick={() => {
              setSelectedCustomer(null);
              onChange("");
              onNewCustomer();
            }}
          >
            <UserPlus className="w-3 h-3 mr-1" />
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
                    <div className="flex flex-col gap-1 flex-1 py-2">
                      <div className="font-medium text-sm">
                        {customer.CardName}
                      </div>
                      <div className="text-xs text-muted-foreground">
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
        <div className="text-sm text-muted-foreground text-center py-2">
          No customers found.
        </div>
      )}
    </div>
  );
}
