"use client";

import React from "react";

export default function DatabasePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Database</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Configure database connections and settings
                </p>
            </div>
            <div className="rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">
                    Database settings content will go here.
                </p>
            </div>
        </div>
    );
}

