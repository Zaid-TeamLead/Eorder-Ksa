"use client";

import React from "react";

export default function NotificationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Notifications</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your notification preferences
                </p>
            </div>
            <div className="rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">
                    Notification settings content will go here.
                </p>
            </div>
        </div>
    );
}

