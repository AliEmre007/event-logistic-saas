"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function InvoicesPage() {
    const { token, user } = useAuthStore();
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Security barrier
    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [user, router]);

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!token || user?.role !== 'ADMIN') return;
            try {
                const res = await fetch("http://localhost:5000/api/invoices", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setInvoices(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch invoices", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoices();
    }, [token, user]);

    if (isLoading) return <div className="p-8">Loading invoices...</div>;
    if (user?.role !== 'ADMIN') return null;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Billing & Invoices</h1>
                <p className="text-muted-foreground mt-1">Manage client billing and track payments.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {invoices.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-muted-foreground bg-white">
                        No invoices generated yet.
                    </div>
                ) : (
                    invoices.map((inv) => (
                        <div key={inv.id} className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col">
                            <div className={`h-2 w-full ${inv.status === 'PAID' ? 'bg-green-500' : inv.status === 'OVERDUE' ? 'bg-red-500' : 'bg-amber-500'}`} />
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{inv.client.name}</h3>
                                        <p className="text-sm text-gray-500">{inv.gig.title}</p>
                                    </div>
                                    <span className="font-mono font-bold text-lg">${parseFloat(inv.amount).toFixed(2)}</span>
                                </div>

                                <div className="space-y-2 text-sm mt-6">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">Status</span>
                                        <span className={`font-medium ${inv.status === 'PAID' ? 'text-green-600' : inv.status === 'OVERDUE' ? 'text-red-600' : 'text-amber-600'}`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pb-2">
                                        <span className="text-gray-500">Due Date</span>
                                        <span className="text-gray-900">{new Date(inv.dueDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 border-t flex justify-end">
                                <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                                    View PDF &rarr;
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
