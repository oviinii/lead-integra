import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, DollarSign, Plus, X, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, getErrorMessage } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WorkspaceOption {
  id: string;
  name: string;
  creditBalance?: { balance: number } | null;
}

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  createdAt: string;
  workspace?: { name: string };
}

interface CreditOverview {
  totalCredits: number;
  consumedThisMonth: number;
  availableCredits: number;
  activeWorkspaces: number;
}

export function AdminCreditsPage() {
  const queryClient = useQueryClient();
  const [addCreditsOpen, setAddCreditsOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [txType, setTxType] = useState("all");
  const [txWorkspaceId, setTxWorkspaceId] = useState("all");
  const [txSearch, setTxSearch] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [txPageSize] = useState(20);

  const overviewQuery = useQuery({
    queryKey: ["admin-credits-overview"],
    queryFn: async () => {
      const res = await api.get("/admin/credits/overview");
      return res.data as CreditOverview;
    },
  });

  const workspacesQuery = useQuery({
    queryKey: ["admin-workspaces-select"],
    queryFn: async () => {
      const res = await api.get("/admin/workspaces");
      return res.data;
    },
  });

  const transactionsQuery = useQuery({
    queryKey: ["admin-credit-transactions", txType, txWorkspaceId, txSearch, txPage, txPageSize],
    queryFn: async () => {
      const res = await api.get("/admin/credit-transactions", {
        params: {
          page: txPage,
          pageSize: txPageSize,
          type: txType === "all" ? undefined : txType,
          workspaceId: txWorkspaceId === "all" ? undefined : txWorkspaceId,
          search: txSearch || undefined,
        },
      });
      return res.data;
    },
  });

  const addCreditsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/admin/credits/add", {
        workspaceId: selectedWorkspaceId,
        amount: parseInt(addAmount, 10),
        description: addDescription || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setAddCreditsOpen(false);
      setSelectedWorkspaceId("");
      setAddAmount("");
      setAddDescription("");
      queryClient.invalidateQueries({ queryKey: ["admin-credits-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-credit-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      toast.success("Créditos adicionados");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const overview = overviewQuery.data;
  const overviewLoading = overviewQuery.isLoading;
  const workspaces = workspacesQuery.data;
  const wsLoading = workspacesQuery.isLoading;
  const transactions = transactionsQuery.data;
  const txLoading = transactionsQuery.isLoading;
  const addCredits = addCreditsMutation;

  const wsOptions = (workspaces?.workspaces ?? []) as WorkspaceOption[];
  const txList = (transactions?.transactions ?? []) as CreditTransaction[];
  const txTotal = transactions?.total ?? 0;
  const txTotalPages = Math.max(1, Math.ceil(txTotal / txPageSize));

  const resetTxFilters = () => {
    setTxType("all");
    setTxWorkspaceId("all");
    setTxSearch("");
    setTxPage(1);
  };

  const exportTxCsv = () => {
    const header = ["Workspace", "Tipo", "Quantidade", "Descrição", "Data"];
    const lines = txList.map((t) =>
      [
        t.workspace?.name ?? "N/A",
        t.type,
        String(t.amount),
        (t.description ?? "-").replace(/"/g, '""'),
        t.createdAt,
      ]
        .map((v) => `"${v}"`)
        .join(";"),
    );
    const csv = ["\uFEFF" + header.join(";"), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transacoes-creditos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Créditos</h1>
          <p className="text-muted-foreground">Visão geral e histórico de créditos da plataforma.</p>
        </div>
        <Dialog open={addCreditsOpen} onOpenChange={setAddCreditsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Créditos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Créditos</DialogTitle>
              <DialogDescription>
                Selecione o workspace e a quantidade de créditos a adicionar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Workspace</Label>
                <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {wsLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      wsOptions.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.creditBalance?.balance || 0} créditos)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Ex: 100"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder="Ex: Bônus de boas-vindas"
                />
              </div>
              {addCredits.isPending && (
                <p className="text-sm text-yellow-600">Processando...</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddCreditsOpen(false)}>
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
              <Button
                onClick={() => addCredits.mutate()}
                disabled={addCredits.isPending || !selectedWorkspaceId || !addAmount}
              >
                {addCredits.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" /> Confirmar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Créditos</CardDescription>
            <CardTitle className="text-3xl">
              {overviewLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(overview?.totalCredits || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Consumidos (Mês)</CardDescription>
            <CardTitle className="text-3xl">
              {overviewLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(overview?.consumedThisMonth || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Disponíveis</CardDescription>
            <CardTitle className="text-3xl">
              {overviewLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(overview?.availableCredits || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Workspaces Ativos</CardDescription>
            <CardTitle className="text-3xl">
              {overviewLoading ? <Skeleton className="h-8 w-24" /> : overview?.activeWorkspaces || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Créditos monetizados na plataforma
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Histórico de Transações
              </CardTitle>
              <CardDescription>
                {formatNumber(txTotal)} movimentação(ões) · Página {txPage} de {txTotalPages}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportTxCsv} disabled={txList.length === 0}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input
              placeholder="Buscar descrição ou workspace..."
              value={txSearch}
              onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
            />
            <Select value={txType} onValueChange={(v) => { setTxType(v); setTxPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="SEARCH">SEARCH</SelectItem>
                <SelectItem value="ENRICHMENT">ENRICHMENT</SelectItem>
                <SelectItem value="EXPORT">EXPORT</SelectItem>
                <SelectItem value="PURCHASE">PURCHASE</SelectItem>
                <SelectItem value="BONUS">BONUS</SelectItem>
                <SelectItem value="REFUND">REFUND</SelectItem>
              </SelectContent>
            </Select>
            <Select value={txWorkspaceId} onValueChange={(v) => { setTxWorkspaceId(v); setTxPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Workspace" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os workspaces</SelectItem>
                {wsOptions.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={resetTxFilters}>Limpar filtros</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : txList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  txList.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.workspace?.name || "N/A"}</TableCell>
                       <TableCell>
                         <Badge
                           variant={t.amount > 0 ? "success" : "destructive"}
                           className={cn(
                             t.type === "SEARCH" && "border-blue-500/30 bg-blue-500/10 text-blue-500",
                             t.type === "ENRICHMENT" && "border-amber-500/30 bg-amber-500/10 text-amber-500",
                             t.type === "EXPORT" && "border-purple-500/30 bg-purple-500/10 text-purple-500",
                             t.type === "PURCHASE" && "border-green-500/30 bg-green-500/10 text-green-500",
                             t.type === "BONUS" && "border-pink-500/30 bg-pink-500/10 text-pink-500",
                             t.type === "REFUND" && "border-cyan-500/30 bg-cyan-500/10 text-cyan-500",
                           )}
                         >
                           {t.type}
                         </Badge>
                       </TableCell>
                      <TableCell className={t.amount > 0 ? "text-green-600" : "text-red-600"}>
                        {t.amount > 0 ? "+" : ""}{formatNumber(t.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.description || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDateTime(t.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTxPage((p) => Math.max(1, p - 1))}
              disabled={txPage <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
              disabled={txPage >= txTotalPages}
            >
              Próxima
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
