"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, UserPlus } from "lucide-react";

interface CustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  onNewCustomer: () => void;
  resultCount?: number;
}

export function CustomerSearch({
  value,
  onChange,
  onSearch,
  onNewCustomer,
  resultCount,
}: CustomerSearchProps) {
  return (
    <div className="rounded-lg p-4 border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative w-[280px]">
            <Input
              id="customer-search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Search customer by name, phone, or email"
              className={cn(
                "h-8 text-sm pr-8",
                value && "border-primary ring-primary/20 ring-1"
              )}
            />
            {value && resultCount !== undefined && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                {resultCount}
              </span>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => onSearch(value)}
            className="h-8 shrink-0"
          >
            <Search className="w-3.5 h-3.5 mr-1.5" />
            Search
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
            onClick={onNewCustomer}
          >
            <UserPlus className="w-3 h-3 mr-1" />
            New Customer
          </Button>
        </div>
      </div>
    </div>
  );
}
