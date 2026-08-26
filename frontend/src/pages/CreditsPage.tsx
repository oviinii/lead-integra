import { useQuery } from "@tanstack/react-query";
import { CreditCard, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/utils";

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
            <CardDescription>Saldo atual</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(balance?.balance)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total consumido</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-24" /> : formatNumber((balance?.lifetime ?? 0) - (balance?.balance ?? 0))}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bônus concedidos</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(balance?.lifetime)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {!txs?.transactions?.length ? (
            <p className="text-sm text-muted-foreground">Sem movimentações.</p>
          ) : (
            <div className="divide-y">
              {txs.transactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{t.description || t.type}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</div>
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
