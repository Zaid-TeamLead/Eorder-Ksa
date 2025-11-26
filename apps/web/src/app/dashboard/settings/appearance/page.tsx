"use client";

import React from "react";

export default function AppearancePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Appearance</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Customize the appearance and theme of the application
                </p>
            </div>
            <div className="rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">
                    Appearance settings content will go here.
                </p>
            </div>
        </div>
    );
}

