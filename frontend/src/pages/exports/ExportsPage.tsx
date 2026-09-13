import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Link } from "react-router-dom";

export function ExportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["exports"],
    queryFn: async () => (await api.get("/exports")).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exportações</h1>
        <p className="text-muted-foreground">Exporte seus leads e empresas em CSV.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exportar agora</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => {
            const base = (import.meta as any).env.VITE_API_URL || "";
            const token = localStorage.getItem("access_token");
            const ws = localStorage.getItem("workspace_id");
            fetch(`${base}/api/exports`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                "x-workspace-id": ws || "",
              },
              body: JSON.stringify({ type: "leads" }),
            }).then(async (res) => {
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `leads-${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            });
          }}>
            <Download className="h-4 w-4" /> Exportar todos os leads (CSV)
          </Button>
          <Button variant="outline" onClick={() => {
            const base = (import.meta as any).env.VITE_API_URL || "";
            const token = localStorage.getItem("access_token");
            const ws = localStorage.getItem("workspace_id");
            fetch(`${base}/api/exports`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                "x-workspace-id": ws || "",
              },
              body: JSON.stringify({ type: "companies" }),
            }).then(async (res) => {
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `empresas-${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            });
          }}>
            <FileText className="h-4 w-4" /> Exportar todas as empresas (CSV)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : !data?.exports?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma exportação registrada.</p>
          ) : (
            <div className="space-y-3">
              {data.exports.map((e: any) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className={`grid h-8 w-8 place-items-center rounded-lg ${
                      e.type === "leads" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                    }`}>
                      {e.type === "leads" ? <Download className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-medium">{e.type === "leads" ? "Exportação de Leads" : "Exportação de Empresas"}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)} · {e.rowCount} linhas</div>
                    </div>
                  </div>
                  <Badge variant={e.status === "COMPLETED" ? "success" : e.status === "FAILED" ? "destructive" : "secondary"}>
                    {e.status}
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
