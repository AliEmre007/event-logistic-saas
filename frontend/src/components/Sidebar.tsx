import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Calendar, Package, FileText, LogOut, Users, MapPin, Mic2 } from "lucide-react";

import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export function Sidebar() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-14 items-center border-b px-4">
                <h1 className="text-lg font-semibold tracking-tight">EventLogistics SaaS</h1>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-2 text-sm font-medium">
                    <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <Calendar className="h-4 w-4" />
                        Dispatch Board
                    </Link>
                    <Link href="/dashboard/assets" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <Package className="h-4 w-4" />
                        Inventory & Assets
                    </Link>
                    <Link href="/dashboard/clients" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <Users className="h-4 w-4" />
                        Clients
                    </Link>
                    <Link href="/dashboard/locations" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <MapPin className="h-4 w-4" />
                        Locations
                    </Link>
                    <Link href="/dashboard/performers" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <Mic2 className="h-4 w-4" />
                        Performers
                    </Link>
                    <Link href="/dashboard/invoices" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <FileText className="h-4 w-4" />
                        Invoicing
                    </Link>

                </nav>
            </div>
            <div className="border-t p-4">
                <div className="mb-4">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {user?.role}
                    </span>
                </div>
                <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </Button>
            </div>
        </div>
    );
}
