"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AssetsPage() {
    const { token, user } = useAuthStore();
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAssets = async () => {
            if (!token) return;
            try {
                const res = await fetch("http://localhost:5000/api/assets", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setAssets(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch assets", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssets();
    }, [token]);

    if (isLoading) return <div className="p-8">Loading inventory...</div>;

    const getStateColor = (state: string) => {
        switch (state) {
            case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200';
            case 'IN_USE': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'MAINTENANCE_CLEANING': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'OUT_OF_SERVICE': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory & Assets</h1>
                    <p className="text-muted-foreground mt-1">Track mascots, costumes, and equipment.</p>
                </div>
                {user?.role === 'ADMIN' && (
                    <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium">
                        + Add Asset
                    </button>
                )}
            </div>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th scope="col" className="px-6 py-4">Item Name</th>
                            <th scope="col" className="px-6 py-4">SKU / ID</th>
                            <th scope="col" className="px-6 py-4">Category</th>
                            <th scope="col" className="px-6 py-4">Location</th>
                            <th scope="col" className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No assets found in inventory.
                                </td>
                            </tr>
                        ) : (
                            assets.map((asset) => (
                                <tr key={asset.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {asset.name}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{asset.sku}</td>
                                    <td className="px-6 py-4">{asset.category}</td>
                                    <td className="px-6 py-4">{asset.location?.name || "Unassigned"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStateColor(asset.state)}`}>
                                            {asset.state.replace('_', ' ')}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
