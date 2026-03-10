"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Plus, Search, Edit2, Trash2, Mail, Phone, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API = API_BASE_URL;

interface Client {
    id: string;
    name: string;
    companyName: string | null;
    email: string;
    phone: string | null;
    billingAddress: string | null;
    _count?: {
        gigs: number;
        invoices: number;
    };
}

export default function ClientsPage() {
    const { token } = useAuthStore();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    // Form states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [form, setForm] = useState({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        billingAddress: "",
    });

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const fetchClients = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await fetch(`${API}/clients`, { headers });
            const data = await res.json();
            if (res.ok) {
                setClients(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch clients", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const handleCreate = async () => {
        setError("");
        try {
            const res = await fetch(`${API}/clients`, {
                method: "POST",
                headers,
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create client");
            setIsCreateOpen(false);
            setForm({ name: "", companyName: "", email: "", phone: "", billingAddress: "" });
            fetchClients();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEdit = async () => {
        if (!selectedClient) return;
        setError("");
        try {
            const res = await fetch(`${API}/clients/${selectedClient.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update client");
            setIsEditOpen(false);
            setSelectedClient(null);
            setForm({ name: "", companyName: "", email: "", phone: "", billingAddress: "" });
            fetchClients();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this client?")) return;
        try {
            const res = await fetch(`${API}/clients/${id}`, {
                method: "DELETE",
                headers,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete client");
            fetchClients();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const openEdit = (client: Client) => {
        setSelectedClient(client);
        setForm({
            name: client.name,
            companyName: client.companyName || "",
            email: client.email,
            phone: client.phone || "",
            billingAddress: client.billingAddress || "",
        });
        setIsEditOpen(true);
    };

    const filteredClients = clients.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.companyName?.toLowerCase() || "").includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">Manage your event organizers and customers.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Client
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Client</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Contact Name *</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Jane Doe"
                                />
                            </div>
                            <div>
                                <Label>Company Name</Label>
                                <Input
                                    value={form.companyName}
                                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                                    placeholder="Acme corporation"
                                />
                            </div>
                            <div>
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="jane@example.com"
                                />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="+1 555-0123"
                                />
                            </div>
                            <div>
                                <Label>Billing Address</Label>
                                <Textarea
                                    value={form.billingAddress}
                                    onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                                    placeholder="123 Business Way, Suite 100"
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <DialogFooter>
                            <Button onClick={handleCreate}>Create Client</Button>
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
                                placeholder="Search clients..."
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
                                        <TableHead>Client</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Contact Info</TableHead>
                                        <TableHead className="text-center">Gigs</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No clients found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredClients.map((client) => (
                                            <TableRow key={client.id}>
                                                <TableCell className="font-medium">{client.name}</TableCell>
                                                <TableCell>
                                                    {client.companyName ? (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                            {client.companyName}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Individual</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                                            {client.email}
                                                        </div>
                                                        {client.phone && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                                {client.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary">
                                                        {client._count?.gigs || 0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEdit(client)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(client.id)}
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
                        <DialogTitle>Edit Client</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Contact Name *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Company Name</Label>
                            <Input
                                value={form.companyName}
                                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Billing Address</Label>
                            <Textarea
                                value={form.billingAddress}
                                onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button onClick={handleEdit}>Update Client</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
