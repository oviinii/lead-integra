import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Users,
  ListChecks,
  Tag,
  Download,
  Sparkles,
  Plug,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Sun,
  Moon,
  Menu,
  X,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
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

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-blue-500", bg: "group-hover:bg-blue-500/10" },
  { to: "/search", label: "Encontrar empresas", icon: Search, color: "text-purple-500", bg: "group-hover:bg-purple-500/10" },
  { to: "/leads", label: "Leads", icon: Users, color: "text-indigo-500", bg: "group-hover:bg-indigo-500/10" },
  { to: "/lists", label: "Listas", icon: ListChecks, color: "text-emerald-500", bg: "group-hover:bg-emerald-500/10" },
  { to: "/tags", label: "Tags", icon: Tag, color: "text-amber-500", bg: "group-hover:bg-amber-500/10" },
  { to: "/campaigns", label: "E-mail Marketing", icon: Mail, color: "text-blue-600", bg: "group-hover:bg-blue-600/10" },
  { to: "/exports", label: "Exportações", icon: Download, color: "text-red-500", bg: "group-hover:bg-red-500/10" },
  { to: "/enrichment", label: "Enriquecimento", icon: Sparkles, color: "text-pink-500", bg: "group-hover:bg-pink-500/10" },
  { to: "/integrations", label: "Integrações", icon: Plug, adminOnly: true, color: "text-cyan-500", bg: "group-hover:bg-cyan-500/10" },
  { to: "/credits", label: "Plano e créditos", icon: CreditCard, color: "text-orange-500", bg: "group-hover:bg-orange-500/10" },
  { to: "/settings", label: "Configurações", icon: Settings, color: "text-slate-500", bg: "group-hover:bg-slate-500/10" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, workspace, workspaces, logout, switchWorkspace } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = items.filter((item) => !item.adminOnly || user?.isSuperAdmin);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-card transition-transform md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            Lead Generator
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors group",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )
              }
            >
              <item.icon className={`h-4 w-4 ${item.color} ${item.bg}`} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            {workspaces.length > 0 && workspace && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    {workspace.name}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                  {workspaces.map((w) => (
                    <DropdownMenuItem key={w.id} onSelect={() => switchWorkspace(w.id)}>
                      <Building2 className="h-4 w-4" />
                      <span className="flex-1">{w.name}</span>
                      <span className="text-xs text-muted-foreground">{w.plan}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline">{user.name}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate("/settings")}>
                    <Settings className="h-4 w-4" /> Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      await logout();
                      navigate("/login");
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
