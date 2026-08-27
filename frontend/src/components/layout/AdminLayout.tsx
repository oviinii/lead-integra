import { useState } from "react";
import { Link, NavLink, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Plug,
  Settings,
  BarChart3,
  Shield,
  Menu,
  X,
  LogOut,
  UserPlus,
  Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", label: "Visão Geral", icon: LayoutDashboard, color: "text-blue-500", bg: "group-hover:bg-blue-500/10" },
  { to: "/admin/users", label: "Usuários", icon: Users, color: "text-purple-500", bg: "group-hover:bg-purple-500/10" },
  { to: "/admin/workspaces", label: "Workspaces", icon: Building2, color: "text-indigo-500", bg: "group-hover:bg-indigo-500/10" },
  { to: "/admin/credits", label: "Créditos", icon: CreditCard, color: "text-red-500", bg: "group-hover:bg-red-500/10" },
  { to: "/admin/providers", label: "Providers", icon: Plug, color: "text-amber-500", bg: "group-hover:bg-amber-500/10" },
  { to: "/admin/plans", label: "Planos", icon: CreditCard, color: "text-emerald-500", bg: "group-hover:bg-emerald-500/10" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, color: "text-cyan-500", bg: "group-hover:bg-cyan-500/10" },
  { to: "/admin/settings", label: "Configurações", icon: Settings, color: "text-pink-500", bg: "group-hover:bg-pink-500/10" },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-card transition-transform md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/admin" className="flex items-center gap-2 font-semibold">
            <Shield className="h-8 w-8" />
            <span>Admin Panel</span>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )
              }
            >
              <item.icon className={`h-4 w-4 ${item.color}`} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar ao App
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground text-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <span className="hidden sm:inline">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => logout()}>
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}