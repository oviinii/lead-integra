import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Loader2,
  UserCheck,
  UserX,
  Shield,
  Mail,
  MoreHorizontal,
  UserPlus,
  Users,
  Trash2,
  Download,
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
import { EmptyState } from "@/components/ui/empty-state";
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
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, page, pageSize],
    queryFn: async () =>
      (
        await api.get("/admin/users", {
          params: { search, page, pageSize },
        })
      ).data,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/users/${id}`, { isActive }),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(v.isActive ? "Usuário ativado" : "Usuário desativado");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleSuperAdmin = useMutation({
    mutationFn: async ({ id, isSuperAdmin }: { id: string; isSuperAdmin: boolean }) =>
      api.patch(`/admin/users/${id}`, { isSuperAdmin }),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(v.isSuperAdmin ? "Promovido a Super Admin" : "Acesso de Super Admin removido");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário excluído");
    },
    onError: (err) => {
      setDeleteTarget(null);
      toast.error(getErrorMessage(err));
    },
  });

  const exportCsv = () => {
    const rows = (data?.users ?? []).map((u: any) => ({
      Nome: u.name,
      Email: u.email,
      Status: u.isActive ? "Ativo" : "Inativo",
      Tipo: u.isSuperAdmin ? "Super Admin" : "Usuário",
      Workspaces: u._count?.ownedWorkspaces ?? 0,
      CriadoEm: u.createdAt,
    }));
    const header = Object.keys(rows[0] ?? { Nome: "", Email: "", Status: "", Tipo: "", Workspaces: "", CriadoEm: "" });
    const csv = [header.join(";"), ...rows.map((r: any) => header.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "usuarios.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários da plataforma.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!data?.users?.length}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button asChild>
            <Link to="/admin/users/new">
              <UserPlus className="h-4 w-4 mr-2" /> Novo usuário
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            placeholder="Buscar por nome, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="grid place-items-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !data?.users?.length ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="Nenhum usuário encontrado"
              description="Nenhum usuário corresponde aos filtros atuais."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Workspaces</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users?.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "success" : "secondary"}>
                        {u.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isSuperAdmin ? "default" : "secondary"}>
                        {u.isSuperAdmin ? "Super Admin" : "Usuário"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u._count?.ownedWorkspaces || 0}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDateTime(u.createdAt)}</TableCell>
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
                            onSelect={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })}
                            disabled={toggleActive.isPending}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            {u.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => toggleSuperAdmin.mutate({ id: u.id, isSuperAdmin: !u.isSuperAdmin })}
                            disabled={toggleSuperAdmin.isPending}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {u.isSuperAdmin ? "Remover Super Admin" : "Tornar Super Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => navigate(`/admin/users/${u.id}`)}>
                            <Mail className="h-4 w-4 mr-2" /> Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setDeleteTarget({ id: u.id, name: u.name })}
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

          {/* Pagination */}
          <div className="flex items-center justify-between border-t p-4">
            <span className="text-sm text-muted-foreground">
              {formatNumber(total)} usuário(s) · Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir usuário?"
        description={deleteTarget ? `"${deleteTarget.name}" será excluído permanentemente. Se possuir workspaces vinculados, a exclusão será bloqueada.` : ""}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}