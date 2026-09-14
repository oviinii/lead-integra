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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavEntry {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavEntry[];
}

const sections: NavSection[] = [
  {
    title: "Principal",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/search", label: "Encontrar empresas", icon: Search },
      { to: "/leads", label: "Leads", icon: Users },
    ],
  },
  {
    title: "Organização",
    items: [
      { to: "/lists", label: "Listas", icon: ListChecks },
      { to: "/tags", label: "Tags", icon: Tag },
    ],
  },
  {
    title: "Marketing",
    items: [
      { to: "/campaigns", label: "E-mail Marketing", icon: Mail },
      { to: "/enrichment", label: "Enriquecimento", icon: Sparkles },
    ],
  },
  {
    title: "Sistema",
    items: [
      { to: "/exports", label: "Exportações", icon: Download },
      { to: "/integrations", label: "Integrações", icon: Plug, adminOnly: true },
      { to: "/credits", label: "Plano e créditos", icon: CreditCard },
      { to: "/settings", label: "Configurações", icon: Settings },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, workspace, workspaces, logout, switchWorkspace } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");

  const submitGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/search", { state: { keyword: globalQuery.trim() } });
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r bg-card transition-transform duration-200 md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-4 w-4" />
            </div>
            Lead Generator
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {sections.map((section) => {
            const visible = section.items.filter((item) => !item.adminOnly || user?.isSuperAdmin);
            if (visible.length === 0) return null;
            return (
              <div key={section.title}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {visible.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/70")} />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        {user?.isSuperAdmin && (
          <div className="shrink-0 border-t p-3">
            <Button variant="outline" size="sm" className="w-full" onClick={() => { setMobileOpen(false); navigate("/admin"); }}>
              Painel Admin
            </Button>
          </div>
        )}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 animate-fade-in bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 md:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
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

          <form onSubmit={submitGlobalSearch} className="mx-auto hidden w-full max-w-md items-center md:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Buscar empresas por segmento, cidade..."
                className="h-9 bg-muted/60 pl-9"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1.5">
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
