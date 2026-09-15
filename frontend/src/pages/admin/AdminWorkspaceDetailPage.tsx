import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, AlertCircle, Building2, Trash2, Save, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api, getErrorMessage } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const PLANS = ["FREE", "STARTER", "PRO", "ENTERPRISE"] as const;

export function AdminWorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-workspace", id],
    queryFn: async () => (await api.get(`/admin/workspaces/${id}`)).data,
    enabled: !!id,
  });

  const w = data?.workspace;
  const editName = name ?? w?.name ?? "";
  const editPlan = plan ?? w?.plan ?? "FREE";
  const editActive = isActive ?? w?.isActive ?? true;
  const dirty = name !== null || plan !== null || isActive !== null;

  const updateMutation = useMutation({
    mutationFn: async () => (await api.patch(`/admin/workspaces/${id}`, { name: editName, plan: editPlan, isActive: editActive })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workspace", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      setName(null);
      setPlan(null);
      setIsActive(null);
      toast.success("Workspace atualizado");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => (await api.delete(`/admin/workspaces/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      toast.success("Workspace excluído");
      navigate("/admin/workspaces");
    },
    onError: (err) => {
      setConfirmDelete(false);
      toast.error(getErrorMessage(err));
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!w) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Workspace não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/workspaces")} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{w.name}</h1>
          <p className="font-mono text-xs text-muted-foreground">{w.slug}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={w.isActive ? "success" : "secondary"}>{w.isActive ? "Ativo" : "Inativo"}</Badge>
        <Badge variant="secondary">{w.plan}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Membros</CardDescription><CardTitle className="text-2xl">{w._count?.members ?? 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Leads</CardDescription><CardTitle className="text-2xl">{formatNumber(w._count?.leads ?? 0)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Empresas</CardDescription><CardTitle className="text-2xl">{formatNumber(w._count?.companies ?? 0)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Créditos</CardDescription><CardTitle className="text-2xl">{formatNumber(w.creditBalance?.balance ?? 0)}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar workspace</CardTitle>
          <CardDescription>Nome, plano e status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={editName} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={editPlan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Ativo</Label>
              <Switch checked={editActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={!dirty || updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Membros</CardTitle>
          <CardDescription>Dono: {w.owner?.name} ({w.owner?.email})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {w.members?.map((m: any) => (
            <div key={m.user.id} className="flex items-center justify-between rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium">{m.user.name}</span>
                <span className="block text-xs text-muted-foreground">{m.user.email}</span>
              </span>
              <Badge variant={m.role === "OWNER" ? "default" : "secondary"}>{m.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Building2 className="h-3 w-3" /> Criado em {formatDateTime(w.createdAt)}
      </p>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir workspace?"
        description={`"${w.name}" e todos os seus dados (leads, listas, campanhas) serão excluídos permanentemente. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
