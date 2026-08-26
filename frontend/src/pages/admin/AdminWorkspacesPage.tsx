import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Search,
  Loader2,
  Building2,
  Users,
  CreditCard,
  MoreHorizontal,
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

export function AdminWorkspacesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-workspaces", search, page, pageSize],
    queryFn: async () =>
      (
        await api.get("/admin/workspaces", {
          params: { search, page, pageSize },
        })
      ).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">Gerencie workspaces da plataforma.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                      <Badge variant="secondary">{w.plan}</Badge>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-between border-t p-4">
            <span className="text-sm text-muted-foreground">Página {page}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page <= 1}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p: number) => p + 1)}>Próxima</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}