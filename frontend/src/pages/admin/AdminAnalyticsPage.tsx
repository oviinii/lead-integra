import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, TrendingUp, BarChart3, Users, Building2, FileSearch, Download, Sparkles, Clock, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, getErrorMessage } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pesquisas Hoje</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(stats?.searchesToday || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Leads Criados Hoje</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(stats?.leadsToday || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Novos Usuários (Semana)</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(stats?.newUsersWeek || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Workspaces Ativos</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(stats?.activeWorkspaces || 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Pesquisas por Dia (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {!dailyStats?.dailySearches?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <div className="space-y-2">
                {dailyStats.dailySearches.slice(-30).reverse().map((d: any) => (
                  <div key={d.date} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatDateTime(d.date)}</span>
                    <span className="font-medium">{formatNumber(d.count)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Novos Usuários por Dia (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {!dailyStats?.dailyUsers?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <div className="space-y-2">
                {dailyStats.dailyUsers.slice(-30).reverse().map((d: any) => (
                  <div key={d.date} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatDateTime(d.date)}</span>
                    <span className="font-medium">{formatNumber(d.count)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}