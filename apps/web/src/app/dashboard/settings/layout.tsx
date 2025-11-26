"use client";

import React from "react";
import { SettingsSidebar } from "./components/settings-sidebar";

const SettingsLayout = ({
    children,
}: Readonly<{ children: React.ReactNode }>) => {
    return (
        <div className="flex flex-1 overflow-hidden">
            <SettingsSidebar />
            <div className="flex-1 overflow-y-auto">
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export default SettingsLayout;
