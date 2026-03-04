"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Package, X, UserPlus, BoxIcon, Trash2, Edit2, MinusCircle, AlertTriangle } from "lucide-react";

const API = "http://localhost:5000/api";

export default function DispatchBoard() {
    const { token, user } = useAuthStore();
    const [gigs, setGigs] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [performers, setPerformers] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedGig, setSelectedGig] = useState<any>(null);
    const [showCreateGig, setShowCreateGig] = useState(false);
    const [showCreateClient, setShowCreateClient] = useState(false);
    const [showCreateLocation, setShowCreateLocation] = useState(false);
    const [showEditGig, setShowEditGig] = useState(false);
    const [error, setError] = useState("");

    // Create Gig form state
    const [gigForm, setGigForm] = useState({
        title: "", description: "", date: "", startTime: "", endTime: "", clientId: "", locationId: "",
    });
    // Create Client form state
    const [clientForm, setClientForm] = useState({
        name: "", companyName: "", email: "", phone: "", billingAddress: "",
    });
    // Create Location form state
    const [locationForm, setLocationForm] = useState({ name: "", address: "" });

    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const openEditGig = (gig: any) => {
        setGigForm({
            title: gig.title,
            description: gig.description || "",
            date: format(new Date(gig.startTime), "yyyy-MM-dd"),
            startTime: format(new Date(gig.startTime), "HH:mm"),
            endTime: format(new Date(gig.endTime), "HH:mm"),
            clientId: gig.clientId,
            locationId: gig.locationId,
        });
        setShowEditGig(true);
    };

    const fetchAll = useCallback(async () => {
        if (!token) return;
        try {
            setIsLoading(true);
            const [gigsRes, clientsRes, locationsRes, assetsRes] = await Promise.all([
                fetch(`${API}/gigs`, { headers }),
                fetch(`${API}/clients`, { headers }),
                fetch(`${API}/locations`, { headers }),
                fetch(`${API}/assets`, { headers }),
            ]);

            if (gigsRes.ok) { const d = await gigsRes.json(); setGigs(d.data || []); }
            if (clientsRes.ok) { const d = await clientsRes.json(); setClients(d.data || []); }
            if (locationsRes.ok) { const d = await locationsRes.json(); setLocations(d.data || []); }
            if (assetsRes.ok) { const d = await assetsRes.json(); setAssets(d.data || []); }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Calendar helpers
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    // Pad beginning
    const startPadding = monthStart.getDay();
    const paddedDays: (Date | null)[] = [...Array(startPadding).fill(null), ...daysInMonth];

    const gigsOnDay = (day: Date) => gigs.filter((g) => isSameDay(new Date(g.startTime), day));

    // --- Create Gig ---
    const handleCreateGig = async () => {
        setError("");
        try {
            const payload = {
                title: gigForm.title,
                description: gigForm.description,
                startTime: new Date(`${gigForm.date}T${gigForm.startTime}`).toISOString(),
                endTime: new Date(`${gigForm.date}T${gigForm.endTime}`).toISOString(),
                clientId: gigForm.clientId,
                locationId: gigForm.locationId,
            };
            const res = await fetch(`${API}/gigs`, {
                method: "POST", headers, body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create gig");
            setShowCreateGig(false);
            setGigForm({ title: "", description: "", date: "", startTime: "", endTime: "", clientId: "", locationId: "" });
            await fetchAll();
        } catch (err: any) { setError(err.message); }
    };

    // --- Create Client ---
    const handleCreateClient = async () => {
        setError("");
        try {
            const res = await fetch(`${API}/clients`, {
                method: "POST", headers, body: JSON.stringify(clientForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create client");
            setShowCreateClient(false);
            setClientForm({ name: "", companyName: "", email: "", phone: "", billingAddress: "" });
            await fetchAll();
        } catch (err: any) { setError(err.message); }
    };

    // --- Create Location ---
    const handleCreateLocation = async () => {
        setError("");
        try {
            const res = await fetch(`${API}/locations`, {
                method: "POST", headers, body: JSON.stringify(locationForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create location");
            setShowCreateLocation(false);
            setLocationForm({ name: "", address: "" });
            await fetchAll();
        } catch (err: any) { setError(err.message); }
    };

    // --- Assign Performer ---
    const handleAssignPerformer = async (gigId: string, performerProfileId: string) => {
        setError("");
        try {
            const res = await fetch(`${API}/gigs/${gigId}/assign-performer`, {
                method: "POST", headers, body: JSON.stringify({ performerProfileId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to assign performer");
            await fetchAll();
            // Refresh selected gig
            const updatedGig = gigs.find((g) => g.id === gigId);
            if (updatedGig) setSelectedGig(updatedGig);
        } catch (err: any) { setError(err.message); }
    };

    // --- Assign Asset ---
    const handleAssignAsset = async (gigId: string, assetId: string) => {
        setError("");
        try {
            const res = await fetch(`${API}/gigs/${gigId}/assign-asset`, {
                method: "POST", headers, body: JSON.stringify({ assetId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to assign asset");
            await fetchAll();
            // Refresh selected gig
            const updatedGig = gigs.find((g) => g.id === gigId);
            if (updatedGig) setSelectedGig(updatedGig);
        } catch (err: any) { setError(err.message); }
    };

    // --- Update Gig ---
    const handleUpdateGig = async () => {
        if (!selectedGig) return;
        setError("");
        try {
            const payload = {
                title: gigForm.title,
                description: gigForm.description,
                startTime: new Date(`${gigForm.date}T${gigForm.startTime}`).toISOString(),
                endTime: new Date(`${gigForm.date}T${gigForm.endTime}`).toISOString(),
                clientId: gigForm.clientId,
                locationId: gigForm.locationId,
            };
            const res = await fetch(`${API}/gigs/${selectedGig.id}`, {
                method: "PUT", headers, body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update gig");
            setShowEditGig(false);
            await fetchAll();
            setSelectedGig(data.data);
        } catch (err: any) { setError(err.message); }
    };

    // --- Delete Gig ---
    const handleDeleteGig = async () => {
        if (!selectedGig || !confirm("Are you sure you want to delete this gig? This will also remove all assignments.")) return;
        setError("");
        try {
            const res = await fetch(`${API}/gigs/${selectedGig.id}`, {
                method: "DELETE", headers,
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to delete gig");
            }
            setSelectedGig(null);
            await fetchAll();
        } catch (err: any) { setError(err.message); }
    };

    // --- Remove Performer ---
    const handleRemovePerformer = async (gigId: string, assignmentId: string) => {
        try {
            const res = await fetch(`${API}/gigs/${gigId}/assignments/${assignmentId}`, {
                method: "DELETE", headers,
            });
            if (!res.ok) throw new Error("Failed to remove performer");
            await fetchAll();
            // Refresh selected gig
            const updatedGig = gigs.find((g) => g.id === gigId);
            if (updatedGig) setSelectedGig(updatedGig);
        } catch (err: any) { alert(err.message); }
    };

    // --- Remove Asset ---
    const handleRemoveAsset = async (gigId: string, gigAssetId: string) => {
        try {
            const res = await fetch(`${API}/gigs/${gigId}/assets/${gigAssetId}`, {
                method: "DELETE", headers,
            });
            if (!res.ok) throw new Error("Failed to remove equipment");
            await fetchAll();
            // Refresh selected gig
            const updatedGig = gigs.find((g) => g.id === gigId);
            if (updatedGig) setSelectedGig(updatedGig);
        } catch (err: any) { alert(err.message); }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dispatch Board</h1>
                    <p className="text-muted-foreground">Schedule gigs and assign talent & equipment.</p>
                </div>
                {user?.role === "ADMIN" && (
                    <div className="flex gap-2">
                        <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" /> New Client</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
                                <div className="space-y-3 py-4">
                                    <div><Label>Contact Name *</Label><Input value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} placeholder="John Smith" /></div>
                                    <div><Label>Company Name</Label><Input value={clientForm.companyName} onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })} placeholder="ABC Events Inc." /></div>
                                    <div><Label>Email *</Label><Input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} placeholder="john@abc.com" /></div>
                                    <div><Label>Phone</Label><Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="555-0123" /></div>
                                    <div><Label>Billing Address</Label><Textarea value={clientForm.billingAddress} onChange={(e) => setClientForm({ ...clientForm, billingAddress: e.target.value })} placeholder="123 Main St" /></div>
                                </div>
                                {error && <p className="text-sm text-destructive">{error}</p>}
                                <DialogFooter><Button onClick={handleCreateClient}>Save Client</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showCreateLocation} onOpenChange={setShowCreateLocation}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm"><MapPin className="mr-1 h-4 w-4" /> New Location</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add New Location</DialogTitle></DialogHeader>
                                <div className="space-y-3 py-4">
                                    <div><Label>Venue Name *</Label><Input value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} placeholder="Community Center Hall" /></div>
                                    <div><Label>Address *</Label><Textarea value={locationForm.address} onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })} placeholder="456 Oak Ave, Suite 100" /></div>
                                </div>
                                {error && <p className="text-sm text-destructive">{error}</p>}
                                <DialogFooter><Button onClick={handleCreateLocation}>Save Location</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showCreateGig} onOpenChange={(open) => {
                            setShowCreateGig(open);
                            if (open && selectedDate) {
                                setGigForm((prev) => ({ ...prev, date: format(selectedDate, "yyyy-MM-dd") }));
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-1 h-4 w-4" /> Schedule Gig</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader><DialogTitle>Schedule a New Gig</DialogTitle></DialogHeader>
                                <div className="space-y-3 py-4">
                                    <div><Label>Gig Title *</Label><Input value={gigForm.title} onChange={(e) => setGigForm({ ...gigForm, title: e.target.value })} placeholder="Birthday Party - Elsa Character" /></div>
                                    <div><Label>Description</Label><Textarea value={gigForm.description} onChange={(e) => setGigForm({ ...gigForm, description: e.target.value })} placeholder="Details about the event..." /></div>
                                    <div>
                                        <Label>Event Date *</Label>
                                        <Input type="date" value={gigForm.date} onChange={(e) => setGigForm({ ...gigForm, date: e.target.value })} className="mt-1" />
                                        {gigForm.date && (
                                            <p className="text-xs text-primary mt-1 font-medium">
                                                📅 Selected: {format(new Date(gigForm.date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Start Time *</Label>
                                            <Input type="time" value={gigForm.startTime} onChange={(e) => {
                                                const start = e.target.value;
                                                // Auto-set end time to 2 hours later
                                                const [h, m] = start.split(":").map(Number);
                                                const endH = Math.min(h + 2, 23);
                                                const autoEnd = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                                                setGigForm({ ...gigForm, startTime: start, endTime: gigForm.endTime || autoEnd });
                                            }} className="mt-1" />
                                        </div>
                                        <div>
                                            <Label>End Time *</Label>
                                            <Input type="time" value={gigForm.endTime} onChange={(e) => setGigForm({ ...gigForm, endTime: e.target.value })} className="mt-1" />
                                        </div>
                                    </div>
                                    {gigForm.startTime && gigForm.endTime && (
                                        <p className="text-xs text-muted-foreground">
                                            ⏱ Duration: {(() => {
                                                const [sh, sm] = gigForm.startTime.split(":").map(Number);
                                                const [eh, em] = gigForm.endTime.split(":").map(Number);
                                                const mins = (eh * 60 + em) - (sh * 60 + sm);
                                                if (mins <= 0) return "⚠️ End time must be after start time";
                                                const hours = Math.floor(mins / 60);
                                                const remMins = mins % 60;
                                                return `${hours > 0 ? `${hours}h ` : ""}${remMins > 0 ? `${remMins}m` : ""}`;
                                            })()}
                                        </p>
                                    )}
                                    <div>
                                        <Label>Client *</Label>
                                        {clients.length === 0 ? (
                                            <p className="text-sm text-amber-600 mt-1">No clients yet. Create one first using the "New Client" button.</p>
                                        ) : (
                                            <Select value={gigForm.clientId} onValueChange={(v) => setGigForm({ ...gigForm, clientId: v })}>
                                                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                                                <SelectContent>
                                                    {clients.map((c: any) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}{c.companyName ? ` (${c.companyName})` : ""}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                    <div>
                                        <Label>Location *</Label>
                                        {locations.length === 0 ? (
                                            <p className="text-sm text-amber-600 mt-1">No locations yet. Create one first using the "New Location" button.</p>
                                        ) : (
                                            <Select value={gigForm.locationId} onValueChange={(v) => setGigForm({ ...gigForm, locationId: v })}>
                                                <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((l: any) => (
                                                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </div>
                                {error && <p className="text-sm text-destructive">{error}</p>}
                                <DialogFooter><Button onClick={handleCreateGig} disabled={!gigForm.title || !gigForm.clientId || !gigForm.locationId || !gigForm.date || !gigForm.startTime || !gigForm.endTime}>Create Gig</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Gigs</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{gigs.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{gigs.filter((g) => isSameMonth(new Date(g.startTime), currentMonth)).length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{clients.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Locations</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{locations.length}</div></CardContent>
                </Card>
            </div>

            {/* Calendar + Detail Panel */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Calendar */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {format(currentMonth, "MMMM yyyy")}
                            </CardTitle>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-px rounded-lg border bg-muted overflow-hidden">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                <div key={d} className="bg-muted py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
                            ))}
                            {paddedDays.map((day, i) => {
                                if (!day) return <div key={`pad-${i}`} className="bg-background min-h-[80px]" />;
                                const dayGigs = gigsOnDay(day);
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                return (
                                    <div
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={`bg-background min-h-[80px] p-1.5 cursor-pointer transition-colors hover:bg-accent/50 ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
                                    >
                                        <div className={`text-xs font-medium mb-1 ${isToday(day) ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" : "text-foreground"}`}>
                                            {format(day, "d")}
                                        </div>
                                        {dayGigs.slice(0, 2).map((g) => (
                                            <div
                                                key={g.id}
                                                onClick={(e) => { e.stopPropagation(); setSelectedGig(g); setSelectedDate(new Date(g.startTime)); }}
                                                className="text-xs truncate rounded bg-primary/10 text-primary px-1 py-0.5 mb-0.5 cursor-pointer hover:bg-primary/20 transition-colors"
                                            >
                                                {g.title}
                                            </div>
                                        ))}
                                        {dayGigs.length > 2 && (
                                            <div className="text-xs text-muted-foreground">+{dayGigs.length - 2} more</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Detail Panel */}
                <div className="space-y-4">
                    {selectedGig ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{selectedGig.title}</CardTitle>
                                    <div className="flex gap-1">
                                        {user?.role === "ADMIN" && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => openEditGig(selectedGig)}><Edit2 className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDeleteGig} title="Delete Gig"><Trash2 className="h-4 w-4" /></Button>
                                            </>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedGig(null)}><X className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                                {selectedGig.description && <p className="text-sm text-muted-foreground">{selectedGig.description}</p>}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{format(new Date(selectedGig.startTime), "MMM d, yyyy • h:mm a")} – {format(new Date(selectedGig.endTime), "h:mm a")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedGig.location?.name || "TBD"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>Client: {selectedGig.client?.name || "Unknown"}</span>
                                </div>

                                {/* Assigned Performers */}
                                <div className="border-t pt-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-1"><UserPlus className="h-4 w-4" />Performers</h4>
                                    </div>
                                    {selectedGig.assignments?.length > 0 ? (
                                        <div className="space-y-1">
                                            {selectedGig.assignments.map((a: any) => (
                                                <div key={a.id} className="flex items-center justify-between bg-secondary/30 rounded-md px-2 py-1 mb-1">
                                                    <span className="text-xs font-medium">{a.performer.user.firstName} {a.performer.user.lastName}</span>
                                                    {user?.role === "ADMIN" && (
                                                        <button onClick={() => handleRemovePerformer(selectedGig.id, a.id)} className="text-muted-foreground hover:text-destructive">
                                                            <MinusCircle className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">No performers assigned</p>
                                    )}
                                </div>

                                {/* Assigned Assets */}
                                <div className="border-t pt-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-1"><BoxIcon className="h-4 w-4" />Equipment</h4>
                                    </div>
                                    {selectedGig.assets?.length > 0 ? (
                                        <div className="space-y-1">
                                            {selectedGig.assets.map((a: any) => (
                                                <div key={a.id} className="flex items-center justify-between border rounded-md px-2 py-1 mb-1">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-medium">{a.asset.name}</span>
                                                        <span className="text-[8px] text-muted-foreground uppercase">{a.asset.sku}</span>
                                                    </div>
                                                    {user?.role === "ADMIN" && (
                                                        <button onClick={() => handleRemoveAsset(selectedGig.id, a.id)} className="text-muted-foreground hover:text-destructive">
                                                            <MinusCircle className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">No equipment assigned</p>
                                    )}
                                </div>

                                {/* Assign Buttons (Admin Only) */}
                                {user?.role === "ADMIN" && assets.filter((a) => a.state === "AVAILABLE").length > 0 && (
                                    <div className="border-t pt-3">
                                        <Label className="text-xs">Quick Assign Asset</Label>
                                        <Select onValueChange={(v) => handleAssignAsset(selectedGig.id, v)}>
                                            <SelectTrigger className="mt-1"><SelectValue placeholder="Pick equipment..." /></SelectTrigger>
                                            <SelectContent>
                                                {assets.filter((a) => a.state === "AVAILABLE").map((a) => (
                                                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.sku})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {error && <p className="text-xs text-destructive mt-2">{error}</p>}
                            </CardContent>
                        </Card>
                    ) : selectedDate ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{format(selectedDate, "EEEE, MMMM d")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {gigsOnDay(selectedDate).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No gigs on this day.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {gigsOnDay(selectedDate).map((g) => (
                                            <div
                                                key={g.id}
                                                onClick={() => setSelectedGig(g)}
                                                className="rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                                            >
                                                <h4 className="font-medium text-sm">{g.title}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {format(new Date(g.startTime), "h:mm a")} – {format(new Date(g.endTime), "h:mm a")}
                                                </p>
                                                <div className="flex gap-1 mt-2">
                                                    <Badge variant="outline" className="text-xs">{g.location?.name}</Badge>
                                                    <Badge variant="secondary" className="text-xs">{g.assignments?.length || 0} performers</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Getting Started</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground space-y-2">
                                <p>Click on a calendar date to see gigs scheduled for that day.</p>
                                <p>Use the <strong>"Schedule Gig"</strong> button to create a new booking.</p>
                                <p className="text-xs">💡 You'll need at least one <strong>Client</strong> and one <strong>Location</strong> before scheduling a gig.</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Upcoming Gigs List */}
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium">Upcoming Gigs</CardTitle></CardHeader>
                        <CardContent>
                            {gigs.filter((g) => new Date(g.startTime) >= new Date()).length === 0 ? (
                                <p className="text-sm text-muted-foreground">No upcoming gigs.</p>
                            ) : (
                                <div className="space-y-2">
                                    {gigs
                                        .filter((g) => new Date(g.startTime) >= new Date())
                                        .slice(0, 5)
                                        .map((g) => (
                                            <div
                                                key={g.id}
                                                onClick={() => { setSelectedGig(g); setSelectedDate(new Date(g.startTime)); }}
                                                className="flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">{g.title}</p>
                                                    <p className="text-xs text-muted-foreground">{format(new Date(g.startTime), "MMM d • h:mm a")}</p>
                                                </div>
                                                <Badge variant={g.assignments?.length > 0 ? "secondary" : "destructive"} className="text-xs">
                                                    {g.assignments?.length > 0 ? `${g.assignments.length} assigned` : "Unassigned"}
                                                </Badge>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Edit Gig Dialog */}
            <Dialog open={showEditGig} onOpenChange={setShowEditGig}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Gig Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Event Title *</Label>
                            <Input value={gigForm.title} onChange={(e) => setGigForm({ ...gigForm, title: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label>Date *</Label>
                                <Input type="date" value={gigForm.date} onChange={(e) => setGigForm({ ...gigForm, date: e.target.value })} />
                            </div>
                            <div>
                                <Label>Start Time *</Label>
                                <Input type="time" value={gigForm.startTime} onChange={(e) => setGigForm({ ...gigForm, startTime: e.target.value })} />
                            </div>
                            <div>
                                <Label>End Time *</Label>
                                <Input type="time" value={gigForm.endTime} onChange={(e) => setGigForm({ ...gigForm, endTime: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <Label>Client *</Label>
                            <Select value={gigForm.clientId} onValueChange={(v) => setGigForm({ ...gigForm, clientId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.companyName || 'Individual'})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Location *</Label>
                            <Select value={gigForm.locationId} onValueChange={(v) => setGigForm({ ...gigForm, locationId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                                <SelectContent>
                                    {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={gigForm.description} onChange={(e) => setGigForm({ ...gigForm, description: e.target.value })} />
                        </div>
                    </div>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button onClick={handleUpdateGig}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
