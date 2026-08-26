import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { Building2, Users, FileSearch, Download, Sparkles, Plug } from "lucide-react";

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
            <Tile icon={Users} label="Usuários" value={data.users} />
            <Tile icon={Building2} label="Workspaces" value={data.workspaces} />
            <Tile icon={FileSearch} label="Pesquisas" value={data.searches} />
            <Tile icon={Users} label="Leads" value={data.leads} />
            <Tile icon={Download} label="Exportações" value={data.exports} />
            <Tile icon={Sparkles} label="Créditos consumidos" value={data.creditsConsumed} />
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

function Tile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-xs">{label}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold">{formatNumber(value)}</div>
      </CardContent>
    </Card>
  );
}
