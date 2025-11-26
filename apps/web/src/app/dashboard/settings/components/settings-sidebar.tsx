"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    IconCar,
    IconUser,
    IconDatabase,
    IconBell,
    IconShield,
    IconPalette,
} from "@tabler/icons-react";

const settingsMenu = [
    {
        title: "Test Vehicle",
        url: "/dashboard/settings/test-vehicle",
        icon: IconCar,
    },
    {
        title: "Profile",
        url: "/dashboard/settings/profile",
        icon: IconUser,
    },
    {
        title: "Database",
        url: "/dashboard/settings/database",
        icon: IconDatabase,
    },
    {
        title: "Notifications",
        url: "/dashboard/settings/notifications",
        icon: IconBell,
    },
    {
        title: "Security",
        url: "/dashboard/settings/security",
        icon: IconShield,
    },
    {
        title: "Appearance",
        url: "/dashboard/settings/appearance",
        icon: IconPalette,
    },
];

export function SettingsSidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 border-r bg-muted/30 flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-sm font-semibold text-foreground">Settings</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Manage your preferences
                </p>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                    {settingsMenu.map((item) => {
                        const isActive = pathname === item.url;
                        return (
                            <Link
                                key={item.url}
                                href={item.url as any}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground font-medium"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

