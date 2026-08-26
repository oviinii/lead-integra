import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, Loader2, Tag as TagIcon, Plus, CheckSquare, Square, ListPlus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getErrorMessage } from "@/lib/api";
import type { Lead, LeadStatus, Tag, LeadList } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  CONVERTED: "Convertido",
  LOST: "Perdido",
  ARCHIVED: "Arquivado",
};

const STATUS_VARIANT: Record<LeadStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "info"> = {
  NEW: "info",
  CONTACTED: "warning",
  QUALIFIED: "success",
  CONVERTED: "default",
  LOST: "destructive",
  ARCHIVED: "secondary",
};

export function LeadsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [tagDialog, setTagDialog] = useState<{ leadId: string } | null>(null);
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [addListDialog, setAddListDialog] = useState(false);
  const [selectedListId, setSelectedListId] = useState("");

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await api.get<{ tags: Tag[] }>("/tags")).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leads", filters],
    queryFn: async () =>
      (
        await api.get<{ items: Lead[]; total: number }>("/leads", {
          params: {
            q: filters.q || undefined,
            status: filters.status || undefined,
            pageSize: 50,
          },
        })
      ).data,
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) =>
      api.post(`/leads/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const removeLead = useMutation({
    mutationFn: async (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const addTag = useMutation({
    mutationFn: async ({ leadId, tagId }: { leadId: string; tagId: string }) =>
      api.post(`/tags/leads/${leadId}/${tagId}`),
    onSuccess: () => {
      setTagDialog(null);
      setSelectedTag("");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const { data: lists } = useQuery({
    queryKey: ["lists"],
    queryFn: async () => (await api.get<{ lists: LeadList[] }>("/lists")).data,
  });

  const addToList = useMutation({
    mutationFn: async ({ listId, leadIds }: { listId: string; leadIds: string[] }) =>
      api.post(`/lists/${listId}/items`, { leadIds }),
    onSuccess: () => {
      setAddListDialog(false);
      setSelectedListId("");
      setSelectedLeads(new Set());
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err) => getErrorMessage(err),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meus leads</h1>
          <p className="text-muted-foreground">Gerencie, qualifique e exporte seus leads.</p>
        </div>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = `${(import.meta as any).env.VITE_API_URL || ""}/api/exports`;
            }}
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        {selectedLeads.size > 0 && (
          <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
            <span className="text-sm">{selectedLeads.size} lead(s) selecionado(s)</span>
            <Button size="sm" variant="outline" onClick={() => setAddListDialog(true)} disabled={!lists?.lists?.length}>
              <ListPlus className="h-4 w-4" /> Adicionar à lista
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedLeads(new Set())}>
              <X className="h-4 w-4" /> Limpar seleção
            </Button>
          </div>
        )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            placeholder="Buscar por nome ou e-mail"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">Todos</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setFilters({ q: "", status: "" })}>Limpar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="grid place-items-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !data?.items?.length ? (
            <EmptyState
              icon={<TagIcon className="h-10 w-10" />}
              title="Você ainda não possui leads"
              description="Faça sua primeira pesquisa para começar a gerar leads."
              action={<Button onClick={() => navigate("/search")}>Encontrar empresas</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <button
                      onClick={() => {
                        if (selectedLeads.size === data?.items?.length) setSelectedLeads(new Set());
                        else data?.items?.forEach((l) => setSelectedLeads((prev) => new Set([...prev, l.id])));
                      }}
                      className="rounded hover:bg-muted"
                    >
                      {selectedLeads.size === data?.items?.length && data?.items?.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  </TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <button
                        onClick={() => {
                          setSelectedLeads((prev) => {
                            const next = new Set(prev);
                            if (next.has(lead.id)) next.delete(lead.id);
                            else next.add(lead.id);
                            return next;
                          });
                        }}
                        className="rounded hover:bg-muted"
                      >
                        {selectedLeads.has(lead.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => navigate(`/companies/${lead.company.id}`)} className="font-medium hover:underline">
                        {lead.company.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{lead.company.category || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.company.city || "—"}{lead.company.state ? `/${lead.company.state}` : ""}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.company.phone || "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(v) => changeStatus.mutate({ id: lead.id, status: v as LeadStatus })}
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.score >= 70 ? "success" : lead.score >= 40 ? "warning" : "secondary"}>
                        {lead.score} · {lead.scoreLabel || ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {lead.tags.map((t) => (
                          <Badge key={t.id} style={{ backgroundColor: t.tag.color || undefined, color: "#fff" }} variant="secondary">
                            {t.tag.name}
                          </Badge>
                        ))}
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setTagDialog({ leadId: lead.id })}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(lead.createdAt)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => removeLead.mutate(lead.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!tagDialog} onOpenChange={(o) => !o && setTagDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Tag</Label>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {tags?.tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Crie novas tags em <a href="/tags" className="underline">Tags</a>.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => addTag.mutate({ leadId: tagDialog!.leadId, tagId: selectedTag })} disabled={!selectedTag || addTag.isPending}>
              {addTag.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addListDialog} onOpenChange={setAddListDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar à lista</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Lista</Label>
            <Select value={selectedListId} onValueChange={setSelectedListId}>
              <SelectTrigger><SelectValue placeholder="Selecione uma lista" /></SelectTrigger>
              <SelectContent>
                {lists?.lists.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{selectedLeads.size} lead(s) serão adicionados.</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => addToList.mutate({ listId: selectedListId, leadIds: Array.from(selectedLeads) })}
              disabled={!selectedListId || addToList.isPending}
            >
              {addToList.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
