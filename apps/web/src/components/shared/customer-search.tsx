"use client";

import { UserPlus } from "lucide-react";
import { SearchCombobox } from "@/components/shared/search-combobox";

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
  /** What to display when customer is selected. Default: 'name' */
  displayField?: 'code' | 'name';
  /** Label for new customer button. Default: 'New Customer' */
  newButtonLabel?: string;
  /** Placeholder text. Default: 'Search customer by BP code, name, phone, or email' */
  placeholder?: string;
  /** Additional className for styling. Default: '' */
  className?: string;
}

export function CustomerSearch({
  value,
  onChange,
  onSearch,
  onNewCustomer,
  onCustomerSelect,
  displayField = 'name',
  newButtonLabel = 'New Customer',
  placeholder = 'Search customer by BP code, name, phone, or email',
  className = '',
}: CustomerSearchProps) {
  return (
    <SearchCombobox<Customer>
      value={value}
      onChange={onChange}
      onSearch={onSearch}
      onSelect={(customer) => onCustomerSelect?.(customer)}
      placeholder={placeholder}
      getKey={(customer) => customer.CardCode}
      getDisplayValue={(customer) =>
        displayField === 'code' ? customer.CardCode || '' : customer.CardName || ''
      }
      renderItem={(customer) => (
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
      )}
      newButton={{
        label: newButtonLabel,
        icon: <UserPlus className="w-2.5 h-2.5 mr-1" />,
        onClick: onNewCustomer,
      }}
      emptyMessage="No customers found."
      className={className}
    />
  );
}

export type { Customer, CustomerSearchProps };
