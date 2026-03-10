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
import { Plus, Search, Edit2, Trash2, User, Star, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const API = API_BASE_URL;

interface Performer {
    id: string;
    userId: string;
    skills: string[];
    active: boolean;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: string;
    };
}

interface UserSummary {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    performerProfile: { id: string } | null;
}

export default function PerformersPage() {
    const { token } = useAuthStore();
    const [performers, setPerformers] = useState<Performer[]>([]);
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    // Form states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedPerformer, setSelectedPerformer] = useState<Performer | null>(null);
    const [createForm, setCreateForm] = useState({
        userId: "",
        skillsString: "",
    });
    const [editForm, setEditForm] = useState({
        skillsString: "",
        active: true,
    });

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const [perfRes, userRes] = await Promise.all([
                fetch(`${API}/performers`, { headers }),
                fetch(`${API}/users`, { headers }),
            ]);

            if (perfRes.ok) {
                const data = await perfRes.json();
                setPerformers(data.data || []);
            }
            if (userRes.ok) {
                const data = await userRes.json();
                setUsers(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
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
            const skills = createForm.skillsString.split(",").map(s => s.trim()).filter(s => s !== "");
            const res = await fetch(`${API}/performers`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    userId: createForm.userId,
                    skills
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create performer profile");
            setIsCreateOpen(false);
            setCreateForm({ userId: "", skillsString: "" });
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEdit = async () => {
        if (!selectedPerformer) return;
        setError("");
        try {
            const skills = editForm.skillsString.split(",").map(s => s.trim()).filter(s => s !== "");
            const res = await fetch(`${API}/performers/${selectedPerformer.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({
                    skills,
                    active: editForm.active
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to update performer");
            }
            setIsEditOpen(false);
            setSelectedPerformer(null);
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this performer profile?")) return;
        try {
            const res = await fetch(`${API}/performers/${id}`, {
                method: "DELETE",
                headers,
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to delete performer");
            }
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const openEdit = (perf: Performer) => {
        setSelectedPerformer(perf);
        setEditForm({
            skillsString: perf.skills.join(", "),
            active: perf.active,
        });
        setIsEditOpen(true);
    };

    const filteredPerformers = performers.filter(
        (p) =>
            `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
            p.user.email.toLowerCase().includes(search.toLowerCase()) ||
            p.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
    );

    const eligibleUsers = users.filter(u => !u.performerProfile);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Performers</h1>
                    <p className="text-muted-foreground">Manage talent roster and skill sets.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Performer
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Performer Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Select User *</Label>
                                <Select value={createForm.userId} onValueChange={(v) => setCreateForm({ ...createForm, userId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a user..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eligibleUsers.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground">No eligible users found.</div>
                                        ) : (
                                            eligibleUsers.map(u => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.firstName} {u.lastName} ({u.email})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Skills (comma separated)</Label>
                                <Input
                                    value={createForm.skillsString}
                                    onChange={(e) => setCreateForm({ ...createForm, skillsString: e.target.value })}
                                    placeholder="Face Painting, Balloon Twisting, Magic"
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={!createForm.userId}>Create Profile</Button>
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
                                placeholder="Search performers by name, email or skill..."
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
                                        <TableHead>Performer</TableHead>
                                        <TableHead>Skills</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPerformers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No performers found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPerformers.map((perf) => (
                                            <TableRow key={perf.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{perf.user.firstName} {perf.user.lastName}</div>
                                                            <div className="text-xs text-muted-foreground">{perf.user.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1 max-w-sm">
                                                        {perf.skills.length > 0 ? (
                                                            perf.skills.map((s, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-[10px] py-0">
                                                                    {s}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">No skills listed</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {perf.active ? (
                                                        <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                                                            <CheckCircle className="h-3 w-3" /> Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <XCircle className="h-3 w-3" /> Inactive
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEdit(perf)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(perf.id)}
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
                        <DialogTitle>Edit Performer Profile</DialogTitle>
                    </DialogHeader>
                    {selectedPerformer && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2 px-1">
                                <Star className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-lg">{selectedPerformer.user.firstName} {selectedPerformer.user.lastName}</span>
                            </div>
                            <div>
                                <Label>Skills (comma separated)</Label>
                                <Input
                                    value={editForm.skillsString}
                                    onChange={(e) => setEditForm({ ...editForm, skillsString: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-4 py-2">
                                <Label>Availability</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant={editForm.active ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setEditForm({ ...editForm, active: true })}
                                    >
                                        Active
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={!editForm.active ? "destructive" : "outline"}
                                        size="sm"
                                        onClick={() => setEditForm({ ...editForm, active: false })}
                                    >
                                        Inactive
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button onClick={handleEdit}>Update Profile</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
