"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, Edit2, Trash2, MapPin, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API = API_BASE_URL;

interface Location {
    id: string;
    name: string;
    address: string;
    _count?: {
        gigs: number;
        assets: number;
    };
}

export default function LocationsPage() {
    const { token, user } = useAuthStore();
    const router = useRouter();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    // Form states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [form, setForm] = useState({
        name: "",
        address: "",
    });

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const fetchLocations = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await fetch(`${API}/locations`, { headers });
            const data = await res.json();
            if (res.ok) {
                setLocations(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch locations", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        fetchLocations();
    }, [fetchLocations, user, router]);

    const handleCreate = async () => {
        setError("");
        try {
            const res = await fetch(`${API}/locations`, {
                method: "POST",
                headers,
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create location");
            setIsCreateOpen(false);
            setForm({ name: "", address: "" });
            fetchLocations();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEdit = async () => {
        if (!selectedLocation) return;
        setError("");
        try {
            const res = await fetch(`${API}/locations/${selectedLocation.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update location");
            setIsEditOpen(false);
            setSelectedLocation(null);
            setForm({ name: "", address: "" });
            fetchLocations();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this location?")) return;
        try {
            const res = await fetch(`${API}/locations/${id}`, {
                method: "DELETE",
                headers,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete location");
            fetchLocations();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const openEdit = (loc: Location) => {
        setSelectedLocation(loc);
        setForm({
            name: loc.name,
            address: loc.address,
        });
        setIsEditOpen(true);
    };

    if (user?.role !== 'ADMIN') return null;

    const filteredLocations = locations.filter(
        (l) =>
            l.name.toLowerCase().includes(search.toLowerCase()) ||
            l.address.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
                    <p className="text-muted-foreground">Venues and storage facilities.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Location
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Location</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Venue Name *</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Blue Sky Theater"
                                />
                            </div>
                            <div>
                                <Label>Full Address *</Label>
                                <Textarea
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    placeholder="123 Venue St, Los Angeles, CA 90210"
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <DialogFooter>
                            <Button onClick={handleCreate}>Create Location</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search locations..."
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
                                        <TableHead>Venue Name</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead className="text-center">Usage</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLocations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No locations found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLocations.map((loc) => (
                                            <TableRow key={loc.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-primary" />
                                                        {loc.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-md truncate">
                                                    {loc.address}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col gap-1 items-center justify-center">
                                                        <Badge variant="secondary" className="w-fit">
                                                            {loc._count?.gigs || 0} Gigs
                                                        </Badge>
                                                        <Badge variant="outline" className="w-fit">
                                                            {loc._count?.assets || 0} Assets
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEdit(loc)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(loc.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
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
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Location</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Venue Name *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Full Address *</Label>
                            <Textarea
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button onClick={handleEdit}>Update Location</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}



