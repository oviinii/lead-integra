import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plug, MoreHorizontal, Plus, Trash2, Eye, EyeOff } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { api, getErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AdminProvidersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: async () => (await api.get("/admin/providers")).data,
  });

  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState("");
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("search");
  const [createActive, setCreateActive] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-providers"] });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/providers/${id}`, { isActive }),
    onSuccess: (_, v) => {
      invalidate();
      toast.success(v.isActive ? "Provider ativado" : "Provider desativado");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      (await api.post("/admin/providers", { key: createKey.trim(), name: createName.trim(), type: createType.trim(), isActive: createActive })).data,
    onSuccess: () => {
      setCreateOpen(false);
      setCreateKey("");
      setCreateName("");
      setCreateType("search");
      setCreateActive(false);
      invalidate();
      toast.success("Provider criado");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/providers/${id}`),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidate();
      toast.success("Provider excluído");
    },
    onError: (err) => {
      setDeleteTarget(null);
      toast.error(getErrorMessage(err));
    },
  });

  const revealKey = async (id: string) => {
    if (revealed[id]) {
      setRevealed((r) => {
        const next = { ...r };
        delete next[id];
        return next;
      });
      return;
    }
    setRevealing(id);
    try {
      const res = await api.get(`/admin/providers/${id}`);
      setRevealed((r) => ({ ...r, [id]: res.data.provider.key }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRevealing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Providers de Dados</h1>
          <p className="text-muted-foreground">Gerencie provedores de dados da plataforma.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo provider</DialogTitle>
              <DialogDescription>Cadastre um provedor de dados externo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Key (identificador único)</Label>
                <Input value={createKey} onChange={(e) => setCreateKey(e.target.value)} placeholder="ex: brasilapi" />
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="BrasilAPI" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={createType} onValueChange={setCreateType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="search">Busca (search)</SelectItem>
                    <SelectItem value="enrichment">Enriquecimento (enrichment)</SelectItem>
                    <SelectItem value="geocoding">Geocodificação (geocoding)</SelectItem>
                    <SelectItem value="cnpj">CNPJ (cnpj)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>Ativo</Label>
                <Switch checked={createActive} onCheckedChange={setCreateActive} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !createKey.trim() || !createName.trim()}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-4 w-4" /> Providers
          </CardTitle>
          <CardDescription>Status dos provedores de dados. As chaves ficam mascaradas por segurança.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid place-items-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !data?.providers?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum provider configurado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead>Erros</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.providers?.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 font-mono text-xs">
                        {revealed[p.id] ?? p.maskedKey ?? "—"}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => revealKey(p.id)}
                          disabled={revealing === p.id}
                          aria-label={revealed[p.id] ? "Ocultar chave" : "Revelar chave"}
                          title={revealed[p.id] ? "Ocultar chave" : "Revelar chave"}
                        >
                          {revealing === p.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : revealed[p.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.type}</TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? "success" : "secondary"}>
                        {p.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {p.lastUsedAt ? formatDateTime(p.lastUsedAt) : "Nunca"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.errorCount > 0 ? "warning" : "secondary"}>{p.errorCount || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={() => toggleActive.mutate({ id: p.id, isActive: !p.isActive })}
                            disabled={toggleActive.isPending}
                          >
                            {p.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setDeleteTarget({ id: p.id, name: p.name })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir provider?"
        description={deleteTarget ? `"${deleteTarget.name}" será excluído permanentemente.` : ""}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
