"use client";

import { Sidebar } from "@/components/Sidebar";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, token, isLoading } = useAuthStore();
    const hydrate = useAuthStore((s) => s.hydrate);
    const router = useRouter();
    const didHydrate = useRef(false);

    useEffect(() => {
        if (!didHydrate.current) {
            didHydrate.current = true;
            hydrate();
        }
    }, []);

    useEffect(() => {
        if (!isLoading && !token) {
            router.push("/login");
        }
    }, [token, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-sm">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return null; // Will redirect via useEffect above
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
