import { useQuery } from "@tanstack/react-query";
import { CreditCard, Sparkles, TrendingUp, Download, Search, Zap, Plus, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { Link } from "react-router-dom";

export function CreditsPage() {
  const { data: balance, isLoading } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => (await api.get("/credits")).data,
  });
  const { data: txs } = useQuery({
    queryKey: ["credit-tx"],
    queryFn: async () => (await api.get("/credits/transactions")).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plano e créditos</h1>
        <p className="text-muted-foreground">Acompanhe seu saldo e o histórico de consumo.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <div className="grid h-6 w-6 place-items-center rounded-md bg-blue-500/10 text-blue-500">
                <CreditCard className="h-3 w-3" />
              </div>
              Saldo atual
            </CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(balance?.balance)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <div className="grid h-6 w-6 place-items-center rounded-md bg-purple-500/10 text-purple-500">
                <TrendingUp className="h-3 w-3" />
              </div>
              Total consumido
            </CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-24" /> : formatNumber((balance?.lifetime ?? 0) - (balance?.balance ?? 0))}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <div className="grid h-6 w-6 place-items-center rounded-md bg-amber-500/10 text-amber-500">
                <Sparkles className="h-3 w-3" />
              </div>
              Bônus concedidos
            </CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(balance?.lifetime)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <CreditCard className="h-4 w-4" />
            </div>
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!txs?.transactions?.length ? (
            <p className="text-sm text-muted-foreground">Sem movimentações.</p>
          ) : (
            <div className="space-y-3">
              {txs.transactions.map((t: any) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className={`grid h-8 w-8 place-items-center rounded-lg ${
                      t.type === "SEARCH" ? "bg-blue-500/10 text-blue-500" :
                      t.type === "ENRICHMENT" ? "bg-amber-500/10 text-amber-500" :
                      t.type === "EXPORT" ? "bg-purple-500/10 text-purple-500" :
                      t.type === "PURCHASE" ? "bg-green-500/10 text-green-500" :
                      t.type === "BONUS" ? "bg-pink-500/10 text-pink-500" :
                      "bg-cyan-500/10 text-cyan-500"
                    }`}>
                      {t.type === "SEARCH" && <Search className="h-4 w-4" />}
                      {t.type === "ENRICHMENT" && <Zap className="h-4 w-4" />}
                      {t.type === "EXPORT" && <Download className="h-4 w-4" />}
                      {t.type === "PURCHASE" && <Plus className="h-4 w-4" />}
                      {t.type === "BONUS" && <Sparkles className="h-4 w-4" />}
                      {t.type === "REFUND" && <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-medium">{t.description || t.type}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</div>
                    </div>
                  </div>
                  <Badge variant={t.amount >= 0 ? "success" : "destructive"}>
                    {t.amount >= 0 ? "+" : ""}{t.amount}
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
