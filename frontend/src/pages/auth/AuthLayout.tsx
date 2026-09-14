import { Building2, Sun, Moon, Search, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

const HIGHLIGHTS = [
  {
    icon: Search,
    title: "Encontre empresas reais",
    description: "Busque por segmento, cidade e região em todo o Brasil.",
  },
  {
    icon: Users,
    title: "Organize seus leads",
    description: "Listas, tags e status para acompanhar cada negociação.",
  },
  {
    icon: Mail,
    title: "Dispare campanhas",
    description: "E-mail marketing com o seu próprio SMTP e controle de cota.",
  },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Building2 className="h-5 w-5" />
          </div>
          Lead Generator
        </div>
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight tracking-tight">
              Leads B2B validados, prontos para conversar.
            </h1>
            <p className="max-w-md text-white/70">
              Geração e enriquecimento de leads com dados de empresas reais do Brasil.
            </p>
          </div>
          <ul className="space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <h.icon className="h-4 w-4 text-blue-200" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{h.title}</span>
                  <span className="block text-sm text-white/60">{h.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-white/50">© {new Date().getFullYear()} Lead Generator</div>
      </div>

      <div className="relative flex items-center justify-center bg-background p-6">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={toggle}
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <div className="w-full max-w-md animate-fade-up">{children}</div>
      </div>
    </div>
  );
}
