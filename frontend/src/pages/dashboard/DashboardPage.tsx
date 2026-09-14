import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Search,
  Users,
  Download,
  Sparkles,
  ArrowUpRight,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  History,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { DashboardData, Search as SearchType } from "@/types";

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  color = "bg-primary/10 text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  color?: string;
}) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardData>("/dashboard")).data,
  });

  const { data: recentSearches, isLoading: loadingSearches } = useQuery({
    queryKey: ["searches", "recent"],
    queryFn: async () => (await api.get<{ items: SearchType[] }>("/search?pageSize=5")).data,
  });

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral das suas atividades e qualidade dos dados.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <MetricCard icon={Building2} label="Empresas encontradas" value={formatNumber(data.companies.total)} color="bg-blue-500/10 text-blue-500" />
            <MetricCard icon={Users} label="Leads salvos" value={formatNumber(data.leads.total)} hint={`${data.leads.thisMonth} este mês`} color="bg-emerald-500/10 text-emerald-500" />
            <MetricCard icon={Search} label="Pesquisas realizadas" value={formatNumber(data.searches.total)} color="bg-violet-500/10 text-violet-500" />
            <MetricCard icon={Sparkles} label="Créditos" value={formatNumber(data.credits.balance)} hint={`${formatNumber(data.credits.lifetime)} total`} color="bg-amber-500/10 text-amber-500" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Qualidade dos dados</CardTitle>
            <CardDescription>Percentual de empresas com cada informação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading || !data ? (
              <Skeleton className="h-32" />
            ) : (
              <>
                <QualityBar icon={Phone} label="Telefone" value={data.quality.phone} barClassName="bg-blue-500" />
                <QualityBar icon={MessageCircle} label="WhatsApp" value={data.quality.whatsapp} barClassName="bg-emerald-500" />
                <QualityBar icon={Mail} label="E-mail" value={data.quality.email} barClassName="bg-amber-500" />
                <QualityBar icon={Globe} label="Site" value={data.quality.website} barClassName="bg-violet-500" />
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickAction
                to="/search"
                icon={Search}
                title="Encontrar empresas"
                description="Nova busca por segmento e região"
                iconClassName="bg-blue-500/10 text-blue-500"
              />
              <QuickAction
                to="/leads"
                icon={Users}
                title="Meus leads"
                description="Gerenciar e qualificar leads"
                iconClassName="bg-emerald-500/10 text-emerald-500"
              />
              <QuickAction
                to="/exports"
                icon={Download}
                title="Exportar CSV"
                description="Levar dados para o CRM"
                iconClassName="bg-amber-500/10 text-amber-500"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-muted-foreground" />
                Pesquisas recentes
              </CardTitle>
              <Link to="/search" className="text-xs font-medium text-primary hover:underline">
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              {loadingSearches ? (
                <div className="space-y-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : !recentSearches || recentSearches.items.length === 0 ? (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  Nenhuma pesquisa ainda.{" "}
                  <Link to="/search" className="font-medium text-primary hover:underline">
                    Fazer a primeira busca
                  </Link>
                </p>
              ) : (
                <ul className="divide-y">
                  {recentSearches.items.map((s) => (
                    <li key={s.id}>
                      <Link to={`/search/${s.id}`} className="group flex items-center justify-between gap-2 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium group-hover:text-primary">
                            {s.keyword || "Busca sem palavra-chave"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[s.city, s.state].filter(Boolean).join(" · ") || "Todas as regiões"}
                            {" · "}
                            {formatNumber(s.resultsCount)} resultados
                          </p>
                        </div>
                        <SearchStatusBadge status={s.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  description,
  iconClassName,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconClassName?: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border p-3 transition-all hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm"
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${iconClassName ?? "bg-primary/10 text-primary"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
    </Link>
  );
}

function SearchStatusBadge({ status }: { status: SearchType["status"] }) {
  const map = {
    COMPLETED: { variant: "success" as const, label: "Concluída" },
    FAILED: { variant: "destructive" as const, label: "Falhou" },
    PROCESSING: { variant: "info" as const, label: "Processando" },
    PENDING: { variant: "warning" as const, label: "Pendente" },
    CANCELLED: { variant: "secondary" as const, label: "Cancelada" },
  }[status];
  return <Badge variant={map.variant}>{map.label}</Badge>;
}

function QualityBar({
  icon: Icon,
  label,
  value,
  barClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  barClassName: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <span className="font-semibold tabular-nums">{formatPercent(value)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${barClassName}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
