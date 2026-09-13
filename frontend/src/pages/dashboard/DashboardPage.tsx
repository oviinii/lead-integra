import { useQuery } from "@tanstack/react-query";
import { Building2, Search, Users, Download, Sparkles, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { DashboardData } from "@/types";

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
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${color}`}>
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

  return (
    <div className="space-y-6">
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
            <MetricCard icon={Users} label="Leads salvos" value={formatNumber(data.leads.total)} hint={`${data.leads.thisMonth} este mês`} color="bg-purple-500/10 text-purple-500" />
            <MetricCard icon={Search} label="Pesquisas realizadas" value={formatNumber(data.searches.total)} color="bg-indigo-500/10 text-indigo-500" />
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
          <CardContent className="space-y-3">
            {isLoading || !data ? (
              <Skeleton className="h-32" />
            ) : (
              <>
                <QualityBar label="Telefone" value={data.quality.phone} />
                <QualityBar label="WhatsApp" value={data.quality.whatsapp} />
                <QualityBar label="E-mail" value={data.quality.email} />
                <QualityBar label="Site" value={data.quality.website} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/search" className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent">
              <span className="flex items-center gap-2"><Search className="h-4 w-4 text-primary" /> Encontrar empresas</span>
              <ArrowUpRight className="h-4 w-4 opacity-60" />
            </Link>
            <Link to="/leads" className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Meus leads</span>
              <ArrowUpRight className="h-4 w-4 opacity-60" />
            </Link>
            <Link to="/exports" className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent">
              <span className="flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Exportar CSV</span>
              <ArrowUpRight className="h-4 w-4 opacity-60" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QualityBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{formatPercent(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
