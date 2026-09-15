import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Building2, FileSearch, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

type Period = "7" | "30" | "90";

function formatTick(date: string) {
  const [, m, d] = date.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

function formatFull(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => (await api.get("/admin/analytics")).data,
    refetchInterval: 60_000,
  });

  const { data: dailyStats, isLoading: dailyLoading } = useQuery({
    queryKey: ["admin-analytics-daily", period],
    queryFn: async () => (await api.get("/admin/analytics/daily", { params: { days: period } })).data,
    refetchInterval: 60_000,
  });

  const searches = (dailyStats?.dailySearches ?? []) as Array<{ date: string; count: number }>;
  const users = (dailyStats?.dailyUsers ?? []) as Array<{ date: string; count: number }>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Métricas e tendências da plataforma em tempo real.</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={FileSearch} label="Pesquisas Hoje" value={stats?.searchesToday || 0} color="text-purple-500" bg="bg-purple-500/10" isLoading={isLoading} />
        <MetricCard icon={Users} label="Leads Criados Hoje" value={stats?.leadsToday || 0} color="text-emerald-500" bg="bg-emerald-500/10" isLoading={isLoading} />
        <MetricCard icon={Clock} label="Novos Usuários (Semana)" value={stats?.newUsersWeek || 0} color="text-blue-500" bg="bg-blue-500/10" isLoading={isLoading} />
        <MetricCard icon={Building2} label="Workspaces Ativos" value={stats?.activeWorkspaces || 0} color="text-indigo-500" bg="bg-indigo-500/10" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" /> Pesquisas por dia
            </CardTitle>
            <CardDescription>Total de buscas executadas na plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <Skeleton className="h-64" />
            ) : searches.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sem dados</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={searches} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                    <defs>
                      <linearGradient id="searchesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tickFormatter={formatTick} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      labelFormatter={(label) => formatFull(String(label))}
                      formatter={(v) => [v, "Pesquisas"]}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} fill="url(#searchesFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" /> Novos usuários por dia
            </CardTitle>
            <CardDescription>Cadastros criados na plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <Skeleton className="h-64" />
            ) : users.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sem dados</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={users} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tickFormatter={formatTick} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      labelFormatter={(label) => formatFull(String(label))}
                      formatter={(v) => [v, "Usuários"]}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color = "text-muted-foreground", bg = "bg-muted/30", isLoading }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color?: string; bg?: string; isLoading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1">
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", bg)}>
            <Icon className={`h-3 w-3 ${color}`} />
          </div>
          {label}
        </CardDescription>
        <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(value)}</CardTitle>
      </CardHeader>
    </Card>
  );
}
