import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
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
  { to: "/admin", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/admin/users", label: "Usuários", icon: Users },
  { to: "/admin/workspaces", label: "Workspaces", icon: Building2 },
  { to: "/admin/credits", label: "Créditos", icon: CreditCard },
  { to: "/admin/providers", label: "Providers", icon: Plug },
  { to: "/admin/plans", label: "Planos", icon: CreditCard },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Configurações", icon: Settings },
];

const SECTION_LABELS: Record<string, string> = {
  users: "Usuários",
  workspaces: "Workspaces",
  credits: "Créditos",
  providers: "Providers",
  plans: "Planos",
  analytics: "Analytics",
  settings: "Configurações",
};

function buildCrumbs(pathname: string): Array<{ label: string; to?: string }> {
  const crumbs: Array<{ label: string; to?: string }> = [{ label: "Painel Admin", to: "/admin" }];
  const parts = pathname.split("/").filter(Boolean).slice(1); // remove "admin"
  if (parts.length === 0) return crumbs;
  const [section, id] = parts;
  const sectionLabel = SECTION_LABELS[section] ?? section;
  if (!id) {
    crumbs.push({ label: sectionLabel });
    return crumbs;
  }
  crumbs.push({ label: sectionLabel, to: `/admin/${section}` });
  crumbs.push({ label: id === "new" ? "Novo" : "Detalhes" });
  return crumbs;
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const crumbs = buildCrumbs(location.pathname);

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
        <nav className="flex flex-col gap-0.5 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/70")} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <nav className="flex min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground" aria-label="Breadcrumb">
              {crumbs.map((c, i) => (
                <span key={c.to + c.label} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-muted-foreground/50">/</span>}
                  {i === crumbs.length - 1 || !c.to ? (
                    <span className="truncate font-medium text-foreground">{c.label}</span>
                  ) : (
                    <Link to={c.to} className="truncate hover:text-foreground hover:underline">
                      {c.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
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