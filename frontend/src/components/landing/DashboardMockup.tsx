import { TrendingUp, Users, MessageCircle, Mail, Search, Sparkles, Download, Tag } from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-background/50 px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
          integraLead.com/dashboard
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Dashboard</p>
            <p className="text-lg font-semibold">Visão geral</p>
          </div>
          <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            +12% mês
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: "Empresas", value: "1.247", color: "text-blue-500", bg: "bg-blue-500/10" },
            { icon: TrendingUp, label: "Leads", value: "382", color: "text-purple-500", bg: "bg-purple-500/10" },
            { icon: MessageCircle, label: "WhatsApp", value: "271", color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { icon: Mail, label: "Com e-mail", value: "198", color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-border bg-background p-3"
            >
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", kpi.bg)}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Mini chart */}
        <div className="mt-4 rounded-lg border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium">Leads criados (7 dias)</p>
            <p className="text-xs text-muted-foreground">+24</p>
          </div>
          <div className="flex h-16 items-end gap-1">
            {[40, 55, 35, 70, 60, 85, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
