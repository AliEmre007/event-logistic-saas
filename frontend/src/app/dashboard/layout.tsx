"use client";

import { Sidebar } from "@/components/Sidebar";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, token, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !token) {
            router.push("/login");
        }
    }, [token, isLoading, router]);

    if (isLoading || !token) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
            </div>
        );
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
