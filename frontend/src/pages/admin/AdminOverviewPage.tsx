import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { Building2, Users, FileSearch, Download, Sparkles, Plug, BarChart3, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => (await api.get("/admin/overview")).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin · Visão geral</h1>
        <p className="text-muted-foreground">Métricas globais da plataforma.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {isLoading || !data ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Tile icon={Users} label="Usuários" value={data.users} color="text-blue-500" bg="bg-blue-500/10" />
            <Tile icon={Building2} label="Workspaces" value={data.workspaces} color="text-indigo-500" bg="bg-indigo-500/10" />
            <Tile icon={FileSearch} label="Pesquisas" value={data.searches} color="text-purple-500" bg="bg-purple-500/10" />
            <Tile icon={Users} label="Leads" value={data.leads} color="text-emerald-500" bg="bg-emerald-500/10" />
            <Tile icon={Download} label="Exportações" value={data.exports} color="text-amber-500" bg="bg-amber-500/10" />
            <Tile icon={Sparkles} label="Créditos consumidos" value={data.creditsConsumed} color="text-red-500" bg="bg-red-500/10" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isLoading || !data ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Percent className="h-4 w-4 text-pink-500" />
                  <span className="text-xs">Taxa de conversão</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {data.searches > 0 ? `${Math.round((data.leads / data.searches) * 100)}%` : "—"}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{data.leads} leads / {data.searches} pesquisas</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BarChart3 className="h-4 w-4 text-cyan-500" />
                  <span className="text-xs">Créditos por workspace</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {data.workspaces > 0 ? formatNumber(Math.round(data.creditsConsumed / data.workspaces)) : "—"}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">média por workspace</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plug className="h-4 w-4 text-amber-500" />
                  <span className="text-xs">Providers ativos</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {data.providers?.filter((p: any) => p.isActive).length || 0}/{data.providers?.length || 0}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">de {data.providers?.length || 0} configurados</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plug className="h-4 w-4" /> Providers</CardTitle>
          <CardDescription>Status dos provedores de dados.</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.providers?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum provider configurado.</p>
          ) : (
            <div className="divide-y">
              {data.providers.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">key: {p.key} · {p.type}</div>
                  </div>
                  <Badge variant={p.isActive ? "success" : "secondary"}>
                    {p.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ icon: Icon, label, value, color = "text-muted-foreground", bg = "bg-muted/30" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color?: string; bg?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bg)}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <span className="text-xs">{label}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold">{formatNumber(value)}</div>
      </CardContent>
    </Card>
  );
}
