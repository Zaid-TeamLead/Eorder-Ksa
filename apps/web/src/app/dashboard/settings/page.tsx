"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to first settings page by default
        router.replace("/dashboard/settings/test-vehicle");
    }, [router]);

    return null;
}

