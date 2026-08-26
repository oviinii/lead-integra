import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, DollarSign, Plus, X } from "lucide-react";
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
    queryKey: ["admin-credit-transactions"],
    queryFn: async () => {
      const res = await api.get("/admin/credit-transactions", {
        params: { page: 1, pageSize: 50 },
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
    },
    onError: (err: any) => {
      console.error(getErrorMessage(err));
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
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Histórico de Transações
          </CardTitle>
          <CardDescription>Últimas 50 movimentações de créditos.</CardDescription>
        </CardHeader>
        <CardContent>
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
                        <Badge variant={t.amount > 0 ? "success" : "destructive"}>
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
        </CardContent>
      </Card>
    </div>
  );
}
