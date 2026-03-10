"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
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
import { Plus, Search, Trash2, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const API = API_BASE_URL;

interface Invoice {
    id: string;
    amount: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    dueDate: string;
    paidAt: string | null;
    gigId: string;
    clientId: string;
    client: { name: string; email: string };
    gig: { title: string };
}

export default function InvoicesPage() {
    const { token, user } = useAuthStore();
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [gigs, setGigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    // Form states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [form, setForm] = useState({
        gigId: "",
        amount: "",
        dueDate: "",
    });

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const fetchData = useCallback(async () => {
        if (!token || user?.role !== 'ADMIN') return;
        try {
            setLoading(true);
            const [invRes, gigRes] = await Promise.all([
                fetch(`${API}/invoices`, { headers }),
                fetch(`${API}/gigs`, { headers }),
            ]);

            if (invRes.ok) {
                const data = await invRes.json();
                setInvoices(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch invoices", err);
        } finally {
            setLoading(false);
        }
    }, [token, user]);

    // Independent fetch for gigs to avoid double await json error above
    const fetchGigs = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/gigs`, { headers });
            if (res.ok) {
                const data = await res.json();
                setGigs(data.data || []);
            }
        } catch (err) { }
    }, [token]);

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        fetchData();
        fetchGigs();
    }, [fetchData, fetchGigs, user, router]);

    const handleCreate = async () => {
        setError("");
        try {
            const res = await fetch(`${API}/invoices`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    gigId: form.gigId,
                    amount: parseFloat(form.amount),
                    dueDate: new Date(`${form.dueDate}T00:00:00`).toISOString()
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create invoice");
            setIsCreateOpen(false);
            setForm({ gigId: "", amount: "", dueDate: "" });
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`${API}/invoices/${id}/status`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;
        try {
            const res = await fetch(`${API}/invoices/${id}`, {
                method: "DELETE",
                headers,
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to delete invoice");
            }
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PAID': return <CheckCircle className="h-3 w-3" />;
            case 'PENDING': return <Clock className="h-3 w-3" />;
            case 'OVERDUE': return <AlertCircle className="h-3 w-3" />;
            default: return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-500 hover:bg-green-600';
            case 'PENDING': return 'bg-amber-500 hover:bg-amber-600';
            case 'OVERDUE': return 'bg-red-500 hover:bg-red-600';
            default: return '';
        }
    };

    const filteredInvoices = invoices.filter(
        (i) =>
            i.client.name.toLowerCase().includes(search.toLowerCase()) ||
            i.gig.title.toLowerCase().includes(search.toLowerCase())
    );

    // Gigs that don't have an invoice yet
    const uninvoicedGigs = gigs.filter(g => !invoices.some(inv => inv.gigId === g.id));

    if (user?.role !== 'ADMIN') return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
                    <p className="text-muted-foreground">Manage client billing and track payments.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Invoice
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate New Invoice</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Select Completed Gig *</Label>
                                <Select value={form.gigId} onValueChange={(v) => setForm({ ...form, gigId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a gig..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uninvoicedGigs.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground">No uninvoiced gigs found.</div>
                                        ) : (
                                            uninvoicedGigs.map(g => (
                                                <SelectItem key={g.id} value={g.id}>
                                                    {g.title} ({format(new Date(g.startTime), "MMM d")})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Amount ($) *</Label>
                                <Input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="250.00"
                                />
                            </div>
                            <div>
                                <Label>Due Date *</Label>
                                <Input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={!form.gigId || !form.amount || !form.dueDate}>Generate Invoice</Button>
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
                                placeholder="Search invoices..."
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
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No invoices found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredInvoices.map((inv) => (
                                            <TableRow key={inv.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{inv.gig.title}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{inv.client.name}</TableCell>
                                                <TableCell className="font-mono font-bold">
                                                    ${parseFloat(inv.amount).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={inv.status} onValueChange={(v) => handleUpdateStatus(inv.id, v)}>
                                                        <SelectTrigger className="w-[120px] h-8 p-0 border-none shadow-none focus:ring-0">
                                                            <Badge className={`${getStatusColor(inv.status)} gap-1 w-full justify-center`}>
                                                                {getStatusIcon(inv.status)} {inv.status}
                                                            </Badge>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="PENDING">Pending</SelectItem>
                                                            <SelectItem value="PAID">Paid</SelectItem>
                                                            <SelectItem value="OVERDUE">Overdue</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(inv.dueDate), "MMM d, yyyy")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(inv.id)}
                                                        disabled={inv.status === 'PAID'}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
        </div>
    );
}
