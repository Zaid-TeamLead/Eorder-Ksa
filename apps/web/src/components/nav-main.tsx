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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  title: string;
  url: string;
  icon?: Icon;
  external?: boolean;
  externalApp?: "pdi";
  items?: NavItem[];
};

function getSessionUserId(session: ReturnType<typeof useSession>["data"]) {
  const user = session?.user;
  return (
    user?.userId ||
    user?.id ||
    user?.email?.split("@")[0] ||
    user?.SlpCode ||
    ""
  );
}

function getConfiguredPdiLoTp() {
  return process.env.NEXT_PUBLIC_PDI_LOTP || "90629";
}

function buildPdiUrl(userId: string, pdiLoTp: string) {
  const url = new URL(process.env.NEXT_PUBLIC_PDI_URL || "https://pp.neweast.cloud/pdis");
  url.searchParams.set("uSrId", userId);
  url.searchParams.set("LoTp", pdiLoTp);
  url.searchParams.set("co", process.env.NEXT_PUBLIC_PDI_COMPANY || "BI_NEGT_KSAISUZU");
  return url.toString();
}

function getNavHref(item: NavItem, userId: string, pdiLoTp: string) {
  return item.externalApp === "pdi" ? buildPdiUrl(userId, pdiLoTp) : item.url;
}

function isNavItemActive(item: NavItem, pathname: string | null) {
  if (item.external || item.url === "#") {
    return false;
  }

  return item.url === "/dashboard"
    ? pathname === item.url
    : pathname === item.url || pathname?.startsWith(item.url + "/");
}

export function NavMain({
  items,
}: {
  items: NavItem[];
}) {
  const [quickCreateModal, setQuickCreateModal] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const sessionUserId = getSessionUserId(session);
  const pdiLoTp = getConfiguredPdiLoTp();
  const renderSubItems = (subItems: NavItem[], depth = 0) => (
    <SidebarMenuSub className={depth > 0 ? "mx-0 ml-3 py-1" : undefined}>
      {subItems.map((item) => {
        const href = getNavHref(item, sessionUserId, pdiLoTp);
        const hasChildren = Boolean(item.items?.length);
        const content = (
          <>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </>
        );

        return (
          <SidebarMenuSubItem key={item.title}>
            {item.external ? (
              <SidebarMenuSubButton
                asChild
                isActive={isNavItemActive(item, pathname)}
              >
                <a href={href}>{content}</a>
              </SidebarMenuSubButton>
            ) : (
              <SidebarMenuSubButton
                asChild
                isActive={isNavItemActive(item, pathname)}
                className={hasChildren ? "font-medium" : undefined}
              >
                {item.url === "#" ? (
                  <span>{content}</span>
                ) : (
                  <Link href={href as any}>{content}</Link>
                )}
              </SidebarMenuSubButton>
            )}
            {hasChildren && renderSubItems(item.items!, depth + 1)}
          </SidebarMenuSubItem>
        );
      })}
    </SidebarMenuSub>
  );

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
              const href = getNavHref(item, sessionUserId, pdiLoTp);
              const isActive = isNavItemActive(item, pathname);
              const content = (
                <>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </>
              );

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    isActive={isActive}
                  >
                    {item.external ? (
                      <a href={href}>{content}</a>
                    ) : item.url === "#" ? (
                      <span>{content}</span>
                    ) : (
                      <Link href={href as any}>{content}</Link>
                    )}
                  </SidebarMenuButton>
                  {item.items?.length ? renderSubItems(item.items) : null}
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
