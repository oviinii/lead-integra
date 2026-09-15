import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, getErrorMessage } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

export function AdminWorkspacesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createOwnerEmail, setCreateOwnerEmail] = useState("");
  const [createPlan, setCreatePlan] = useState("FREE");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-workspaces", search, planFilter, page, pageSize],
    queryFn: async () =>
      (
        await api.get("/admin/workspaces", {
          params: { search, plan: planFilter === "all" ? undefined : planFilter, page, pageSize },
        })
      ).data,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const createMutation = useMutation({
    mutationFn: async () =>
      (await api.post("/admin/workspaces", { name: createName.trim(), ownerEmail: createOwnerEmail.trim(), plan: createPlan })).data,
    onSuccess: () => {
      setCreateOpen(false);
      setCreateName("");
      setCreateOwnerEmail("");
      setCreatePlan("FREE");
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      toast.success("Workspace criado");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/workspaces/${id}`),
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      toast.success("Workspace excluído");
    },
    onError: (err) => {
      setDeleteTarget(null);
      toast.error(getErrorMessage(err));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">Gerencie workspaces da plataforma.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Novo workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo workspace</DialogTitle>
              <DialogDescription>Crie um workspace vinculado a um usuário existente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Agência XYZ" />
              </div>
              <div className="space-y-2">
                <Label>E-mail do dono</Label>
                <Input type="email" value={createOwnerEmail} onChange={(e) => setCreateOwnerEmail(e.target.value)} placeholder="dono@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={createPlan} onValueChange={setCreatePlan}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["FREE", "STARTER", "PRO", "ENTERPRISE"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !createName.trim() || !createOwnerEmail.trim()}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            placeholder="Buscar por nome, slug ou e-mail do dono..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Plano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="FREE">FREE</SelectItem>
              <SelectItem value="STARTER">STARTER</SelectItem>
              <SelectItem value="PRO">PRO</SelectItem>
              <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="grid place-items-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !data?.workspaces?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum workspace encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.workspaces?.map((w: any) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <Link to={`/admin/workspaces/${w.id}`} className="font-medium hover:underline">
                        {w.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{w.owner?.name}</div>
                      <div className="text-xs text-muted-foreground">{w.owner?.email}</div>
                    </TableCell>
                     <TableCell>
                       <Badge
                         variant="secondary"
                         className={cn(
                           w.plan === "FREE" ? "border-sky-500/30 bg-sky-500/10 text-sky-500"
                           : w.plan === "STARTER" ? "border-green-500/30 bg-green-500/10 text-green-500"
                           : w.plan === "PRO" ? "border-purple-500/30 bg-purple-500/10 text-purple-500"
                           : w.plan === "ENTERPRISE" ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                           : "",
                         )}
                       >
                         {w.plan}
                       </Badge>
                     </TableCell>
                    <TableCell className="text-muted-foreground">{w._count?.members || 0}</TableCell>
                    <TableCell className="text-muted-foreground">{formatNumber(w._count?.leads || 0)}</TableCell>
                    <TableCell className="font-medium">{formatNumber(w.creditBalance?.balance || 0)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDateTime(w.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => navigate(`/admin/workspaces/${w.id}`)}>
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setDeleteTarget({ id: w.id, name: w.name })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-between border-t p-4">
            <span className="text-sm text-muted-foreground">
              {formatNumber(total)} workspace(s) · Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page <= 1}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir workspace?"
        description={deleteTarget ? `"${deleteTarget.name}" e todos os seus dados serão excluídos permanentemente. Essa ação não pode ser desfeita.` : ""}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}