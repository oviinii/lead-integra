import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, AlertCircle, UserCheck, UserX, Shield, Trash2, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, getErrorMessage } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => (await api.get(`/admin/users/${id}`)).data,
    enabled: !!id,
  });

  const toggleActive = useMutation({
    mutationFn: async (isActive: boolean) => (await api.patch(`/admin/users/${id}`, { isActive })).data,
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(v ? "Usuário ativado" : "Usuário desativado");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleSuperAdmin = useMutation({
    mutationFn: async (isSuperAdmin: boolean) => (await api.patch(`/admin/users/${id}`, { isSuperAdmin })).data,
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(v ? "Promovido a Super Admin" : "Acesso de Super Admin removido");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => (await api.delete(`/admin/users/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário excluído");
      navigate("/admin/users");
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

  const u = data?.user;
  if (!u) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Usuário não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{u.name}</h1>
            <p className="text-muted-foreground">{u.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={u.isActive ? "success" : "secondary"}>{u.isActive ? "Ativo" : "Inativo"}</Badge>
        <Badge variant={u.isSuperAdmin ? "default" : "secondary"}>{u.isSuperAdmin ? "Super Admin" : "Usuário"}</Badge>
        {u.emailVerifiedAt && <Badge variant="info">E-mail verificado</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Leads criados</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(u._count?.leadsCreated ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pesquisas</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(u._count?.searches ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Membro desde</CardDescription>
            <CardTitle className="text-lg">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Workspaces
          </CardTitle>
          <CardDescription>Workspaces próprios e participações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!u.ownedWorkspaces?.length && !u.workspaceMembers?.length) && (
            <p className="text-sm text-muted-foreground">Nenhum workspace vinculado.</p>
          )}
          {u.ownedWorkspaces?.map((w: any) => (
            <Link key={w.id} to={`/admin/workspaces/${w.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent">
              <span>
                <span className="block text-sm font-medium">{w.name}</span>
                <span className="block text-xs text-muted-foreground">Dono · Plano {w.plan}</span>
              </span>
              <Badge variant={w.isActive ? "success" : "secondary"}>{w.isActive ? "Ativo" : "Inativo"}</Badge>
            </Link>
          ))}
          {u.workspaceMembers?.filter((m: any) => !u.ownedWorkspaces?.some((w: any) => w.id === m.workspace.id)).map((m: any) => (
            <div key={m.workspace.id} className="flex items-center justify-between rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium">{m.workspace.name}</span>
                <span className="block text-xs text-muted-foreground">Papel: {m.role}</span>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
          <CardDescription>Gerencie o acesso e o ciclo de vida deste usuário.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toggleActive.mutate(!u.isActive)} disabled={toggleActive.isPending}>
            {u.isActive ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
            {u.isActive ? "Desativar" : "Ativar"}
          </Button>
          <Button variant="outline" onClick={() => toggleSuperAdmin.mutate(!u.isSuperAdmin)} disabled={toggleSuperAdmin.isPending}>
            <Shield className="mr-2 h-4 w-4" />
            {u.isSuperAdmin ? "Remover Super Admin" : "Tornar Super Admin"}
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Criado em {formatDateTime(u.createdAt)} · Atualizado em {formatDateTime(u.updatedAt)}</p>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir usuário?"
        description={`"${u.name}" será excluído permanentemente. Se possuir workspaces vinculados, a exclusão será bloqueada — desative-o nesse caso.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
