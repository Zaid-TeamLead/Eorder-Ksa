"use client";

import React from "react";

export default function ProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Profile</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your profile information and preferences
                </p>
            </div>
            <div className="rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">
                    Profile settings content will go here.
                </p>
            </div>
        </div>
    );
}

