"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";

export default function DashboardOverview() {
    const { token } = useAuthStore();
    const [gigs, setGigs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGigs = async () => {
            if (!token) return;
            try {
                const res = await fetch("http://localhost:5000/api/gigs", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setGigs(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch gigs", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGigs();
    }, [token]);

    if (isLoading) return <div className="p-8">Loading schedule...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dispatch Board</h1>
                <p className="text-muted-foreground">Manage upcoming gigs and assignments.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {gigs.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                        No gigs scheduled yet.
                    </div>
                ) : (
                    gigs.map((gig) => (
                        <div key={gig.id} className="rounded-xl border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6 border-b">
                                <h3 className="text-lg font-semibold leading-none tracking-tight">{gig.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(gig.startTime), "MMM d, yyyy • h:mm a")} - {format(new Date(gig.endTime), "h:mm a")}
                                </p>
                            </div>
                            <div className="p-6 pt-4 text-sm space-y-4">
                                <div>
                                    <span className="font-medium text-gray-900">Location:</span>
                                    <p className="text-gray-600">{gig.location?.name || "TBD"}</p>
                                </div>

                                <div>
                                    <span className="font-medium text-gray-900">Performers:</span>
                                    {gig.assignments.length > 0 ? (
                                        <ul className="mt-1 list-inside list-disc text-gray-600">
                                            {gig.assignments.map((a: any) => (
                                                <li key={a.id}>{a.performer.user.firstName} {a.performer.user.lastName}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-amber-600 text-xs mt-1 bg-amber-50 inline-block px-2 py-1 rounded">Unassigned</p>
                                    )}
                                </div>

                                <div>
                                    <span className="font-medium text-gray-900">Assets required:</span>
                                    {gig.assets.length > 0 ? (
                                        <ul className="mt-1 list-inside list-disc text-gray-600 space-y-1">
                                            {gig.assets.map((a: any) => (
                                                <li key={a.id} className="flex justify-between">
                                                    <span>{a.asset.name}</span>
                                                    <span className="text-xs border px-1.5 rounded bg-gray-50">{a.asset.sku}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500 text-xs mt-1">None requested</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
