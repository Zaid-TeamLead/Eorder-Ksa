"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Check } from "lucide-react";
import { logger } from "@/lib/logger";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ButtonLoading } from "@/components/shared/button-loading";

/**
 * Generic Search Combobox Component
 *
 * A reusable search component with type-safe results display.
 * Eliminates duplicate search component implementations across forms.
 *
 * @template T - The type of items being searched
 *
 * @example
 * ```tsx
 * <SearchCombobox<Customer>
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   onSearch={searchCustomers}
 *   onSelect={handleCustomerSelect}
 *   placeholder="Search customer..."
 *   getKey={(customer) => customer.CardCode}
 *   getDisplayValue={(customer) => customer.CardName}
 *   renderItem={(customer) => (
 *     <div>
 *       <div>{customer.CardName}</div>
 *       <div className="text-xs">{customer.CardCode}</div>
 *     </div>
 *   )}
 * />
 * ```
 */

export interface SearchComboboxProps<T> {
  /** Current search input value */
  value: string;

  /** Callback when search input changes */
  onChange: (value: string) => void;

  /** Search function that returns results */
  onSearch: (query: string) => Promise<{ success: boolean; data: T[] } | undefined>;

  /** Callback when an item is selected */
  onSelect: (item: T) => void;

  /** Placeholder text for search input */
  placeholder?: string;

  /** Function to extract unique key from item */
  getKey: (item: T, index?: number) => string | number;

  /** Function to get display value for selected item */
  getDisplayValue: (item: T) => string;

  /** Custom render function for each search result item */
  renderItem: (item: T) => ReactNode;

  /** Optional "New" button configuration */
  newButton?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };

  /** Optional className for container */
  className?: string;

  /** Empty state message */
  emptyMessage?: string;

  /** Whether to show check icon on selected item */
  showCheckIcon?: boolean;
}

export function SearchCombobox<T>({
  value,
  onChange,
  onSearch,
  onSelect,
  placeholder = "Search...",
  getKey,
  getDisplayValue,
  renderItem,
  newButton,
  className,
  emptyMessage = "No results found.",
  showCheckIcon = true,
}: SearchComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const handleSearch = async () => {
    if (!value.trim()) return;

    setIsSearching(true);
    try {
      const result = await onSearch(value);
      if (result?.success && result.data) {
        setResults(result.data);
        setOpen(true);
      }
    } catch (error) {
      logger.error("Search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (item: T) => {
    setSelectedItem(item);
    setOpen(false);
    onChange(getDisplayValue(item));
    onSelect(item);
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setSelectedItem(null);
  };

  const handleNewButtonClick = () => {
    setSelectedItem(null);
    onChange("");
    newButton?.onClick();
  };

  return (
    <div className={cn("rounded-lg p-2.5 border space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <div className="relative flex-1 max-w-[240px]">
            <Input
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder={placeholder}
              className={cn(
                "h-7 text-xs pr-7",
                value && "border-primary ring-primary/20 ring-1"
              )}
            />
            {showCheckIcon && selectedItem && (
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
            {isSearching ? (
              <ButtonLoading text="Searching..." size="sm" />
            ) : (
              <>
                <Search className="w-3 h-3 mr-1" />
                Search
              </>
            )}
          </Button>
        </div>

        {newButton && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
              onClick={handleNewButtonClick}
            >
              {newButton.icon}
              {newButton.label}
            </Button>
          </div>
        )}
      </div>

      {/* Search Results */}
      {open && results.length > 0 && (
        <div className="border rounded-lg max-h-60 overflow-y-auto">
          <Command>
            <CommandList>
              <CommandGroup>
                {results.map((item, index) => (
                  <CommandItem
                    key={`${getKey(item, index)}-${index}`}
                    value={getDisplayValue(item)}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    {renderItem(item)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

      {open && results.length === 0 && !isSearching && (
        <div className="text-xs text-muted-foreground text-center py-1.5">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
