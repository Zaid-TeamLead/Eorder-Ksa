"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { SIDEBAR_MENU } from "@/lib/constants";

const getPageTitle = (pathname: string | null): string => {
  if (!pathname) return "Dashboard";

  // Check all menu items to find matching route
  const allMenuItems = [
    ...SIDEBAR_MENU.navMain,
    ...SIDEBAR_MENU.navSecondary.map(item => ({ title: item.title, url: item.url })),
    ...SIDEBAR_MENU.documents.map(item => ({ title: item.name, url: item.url })),
  ];

  // Find exact match first
  const exactMatch = allMenuItems.find(item => item.url === pathname);
  if (exactMatch) return exactMatch.title;

  // Find route that pathname starts with (for nested routes)
  const routeMatch = allMenuItems
    .filter(item => item.url !== "#" && item.url !== "/dashboard")
    .find(item => pathname.startsWith(item.url + "/"));
  if (routeMatch) return routeMatch.title;

  // Handle nested settings routes
  if (pathname.startsWith("/dashboard/settings/")) {
    const settingsPath = pathname.split("/dashboard/settings/")[1];
    if (settingsPath) {
      // Capitalize and format the settings sub-route
      return settingsPath
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    return "Settings";
  }

  // Default to Dashboard for /dashboard
  if (pathname === "/dashboard") return "Dashboard";

  // Fallback: try to format the pathname
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 1) {
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return "Dashboard";
};

export function SiteHeader() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
          Current Branch - KSA | Riyadh
        </div>
      </div>
    </header>
  );
}
