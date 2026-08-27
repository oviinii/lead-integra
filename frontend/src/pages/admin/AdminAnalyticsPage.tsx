import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, TrendingUp, BarChart3, Users, Building2, FileSearch, Download, Sparkles, Clock, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AdminAnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => (await api.get("/admin/analytics")).data,
  });

  const { data: dailyStats, isLoading: dailyLoading } = useQuery({
    queryKey: ["admin-analytics-daily"],
    queryFn: async () => (await api.get("/admin/analytics/daily")).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Métricas e tendências da plataforma.</p>
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
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-purple-500" /> Pesquisas por Dia (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {!dailyStats?.dailySearches?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <div className="space-y-2">
                {dailyStats.dailySearches.slice(-30).reverse().map((d: any) => {
                  const max = Math.max(...dailyStats.dailySearches.map((x: any) => x.count));
                  const pct = (d.count / max) * 100;
                  return (
                    <div key={d.date} className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-xs text-muted-foreground">{formatDateTime(d.date).split(",")[0]}</span>
                      <div className="flex-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-gradient-to-t from-purple-500/40 to-purple-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-6 text-right font-medium">{d.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Novos Usuários por Dia (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {!dailyStats?.dailyUsers?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <div className="space-y-2">
                {dailyStats.dailyUsers.slice(-30).reverse().map((d: any) => {
                  const max = Math.max(...dailyStats.dailyUsers.map((x: any) => x.count));
                  const pct = (d.count / max) * 100;
                  return (
                    <div key={d.date} className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-xs text-muted-foreground">{formatDateTime(d.date).split(",")[0]}</span>
                      <div className="flex-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-gradient-to-t from-blue-500/40 to-blue-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-6 text-right font-medium">{d.count}</span>
                    </div>
                  );
                })}
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