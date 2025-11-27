import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const [quickCreateModal, setQuickCreateModal] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                onClick={() => setQuickCreateModal(true)}
              >
                <IconCirclePlusFilled />
                <span>Quick Create</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {items.map((item) => {
              // For /dashboard, only match exactly. For other routes, match exactly or sub-routes
              const isActive = item.url === "/dashboard"
                ? pathname === item.url
                : pathname === item.url || pathname?.startsWith(item.url + "/");
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    isActive={isActive}
                  >
                    <Link href={item.url as any}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <CommandDialog open={quickCreateModal} onOpenChange={setQuickCreateModal}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => setQuickCreateModal(false)}>
              Sales Order
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setQuickCreateModal(false);
              }}
            >
              <Link href="/dashboard/sales-enquiry?action=create">
                Sales Enquiry
              </Link>
            </CommandItem>
            <CommandItem onSelect={() => setQuickCreateModal(false)}>
              <Link href="/dashboard/test-drive?action=create">
                Book Test Drive
              </Link>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Customers">
            <CommandItem onSelect={() => setQuickCreateModal(false)}>
              Vehicle Quotation
            </CommandItem>
            <CommandItem onSelect={() => setQuickCreateModal(false)}>
              Payment Form
            </CommandItem>
            <CommandItem onSelect={() => setQuickCreateModal(false)}>
              Vehicle Delivery
            </CommandItem>
            <CommandItem onSelect={() => setQuickCreateModal(false)}>
              After Sales Service
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
