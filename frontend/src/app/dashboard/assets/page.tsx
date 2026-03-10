"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2, Package, MapPin, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = API_BASE_URL;

interface Asset {
    id: string;
    name: string;
    sku: string;
    category: string;
    state: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE_CLEANING' | 'OUT_OF_SERVICE';
    locationId: string | null;
    location?: {
        name: string;
    } | null;
}

export default function AssetsPage() {
    const { token, user } = useAuthStore();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    // Form states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [form, setForm] = useState({
        name: "",
        sku: "",
        category: "",
        locationId: "",
        state: "AVAILABLE",
    });

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const [assetRes, locRes] = await Promise.all([
                fetch(`${API}/assets`, { headers }),
                fetch(`${API}/locations`, { headers }),
            ]);

            if (assetRes.ok) {
                const data = await assetRes.json();
                setAssets(data.data || []);
            }
            if (locRes.ok) {
                const data = await locRes.json();
                setLocations(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch assets", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async () => {
        setError("");
        try {
            const res = await fetch(`${API}/assets`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name: form.name,
                    sku: form.sku,
                    category: form.category,
                    locationId: form.locationId || null
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create asset");
            setIsCreateOpen(false);
            resetForm();
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEdit = async () => {
        if (!selectedAsset) return;
        setError("");
        try {
            const res = await fetch(`${API}/assets/${selectedAsset.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({
                    name: form.name,
                    sku: form.sku,
                    category: form.category,
                    locationId: form.locationId || null,
                    state: form.state
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to update asset");
            }
            setIsEditOpen(false);
            setSelectedAsset(null);
            resetForm();
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this asset?")) return;
        try {
            const res = await fetch(`${API}/assets/${id}`, {
                method: "DELETE",
                headers,
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to delete asset");
            }
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const resetForm = () => {
        setForm({
            name: "",
            sku: "",
            category: "",
            locationId: "",
            state: "AVAILABLE",
        });
    };

    const openEdit = (asset: Asset) => {
        setSelectedAsset(asset);
        setForm({
            name: asset.name,
            sku: asset.sku,
            category: asset.category,
            locationId: asset.locationId || "",
            state: asset.state,
        });
        setIsEditOpen(true);
    };

    const getStateColor = (state: string) => {
        switch (state) {
            case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200';
            case 'IN_USE': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'MAINTENANCE_CLEANING': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'OUT_OF_SERVICE': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const filteredAssets = assets.filter(
        (a) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.sku.toLowerCase().includes(search.toLowerCase()) ||
            a.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory & Assets</h1>
                    <p className="text-muted-foreground">Track mascots, costumes, and equipment.</p>
                </div>
                {user?.role === 'ADMIN' && (
                    <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Asset
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Asset</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label>Item Name *</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Classic Mickey Costume"
                                    />
                                </div>
                                <div>
                                    <Label>SKU / ID *</Label>
                                    <Input
                                        value={form.sku}
                                        onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                        placeholder="MC-001"
                                    />
                                </div>
                                <div>
                                    <Label>Category *</Label>
                                    <Input
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        placeholder="Costume"
                                    />
                                </div>
                                <div>
                                    <Label>Location</Label>
                                    <Select value={form.locationId || "unassigned"} onValueChange={(v) => setForm({ ...form, locationId: v === "unassigned" ? "" : v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Storage Location..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">None / Unassigned</SelectItem>
                                            {locations.map(l => (
                                                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <DialogFooter>
                                <Button onClick={handleCreate} disabled={!form.name || !form.sku || !form.category}>Save Asset</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search inventory..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        {user?.role === 'ADMIN' && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAssets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={user?.role === 'ADMIN' ? 5 : 4} className="h-24 text-center">
                                                No assets found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredAssets.map((asset) => (
                                            <TableRow key={asset.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{asset.name}</span>
                                                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{asset.sku}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-3 w-3 text-muted-foreground" />
                                                        {asset.category}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        {asset.location?.name || <span className="text-muted-foreground italic">Unassigned</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={`${getStateColor(asset.state)} whitespace-nowrap`}>
                                                        {asset.state.replace(/_/g, ' ')}
                                                    </Badge>
                                                </TableCell>
                                                {user?.role === 'ADMIN' && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEdit(asset)}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleDelete(asset.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setSelectedAsset(null); resetForm(); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Asset</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Item Name *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>SKU / ID *</Label>
                                <Input
                                    value={form.sku}
                                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Category *</Label>
                                <Input
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Location</Label>
                            <Select value={form.locationId || "unassigned"} onValueChange={(v) => setForm({ ...form, locationId: v === "unassigned" ? "" : v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Storage Location..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {locations.map(l => (
                                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Asset Status</Label>
                            <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AVAILABLE">Available</SelectItem>
                                    <SelectItem value="IN_USE">In Use</SelectItem>
                                    <SelectItem value="MAINTENANCE_CLEANING">Maintenance / Cleaning</SelectItem>
                                    <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button onClick={handleEdit}>Update Asset</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
