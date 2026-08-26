import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, ListChecks, Edit, Download, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api, getErrorMessage } from "@/lib/api";
import type { LeadList, Lead, LeadStatus } from "@/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  CONVERTED: "Convertido",
  LOST: "Perdido",
  ARCHIVED: "Arquivado",
};

interface ListWithItems extends LeadList {
  items: Array<{ id: string; lead: Lead }>;
}

export function ListsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [error, setError] = useState<string | null>(null);
  const [editingList, setEditingList] = useState<LeadList | null>(null);
  const [detailOpen, setDetailOpen] = useState<LeadList | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["lists"],
    queryFn: async () => (await api.get<{ lists: LeadList[] }>("/lists")).data,
  });

  const create = useMutation({
    mutationFn: async () => api.post("/lists", { name, description, color }),
    onSuccess: () => {
      setOpen(false);
      setName("");
      setDescription("");
      setColor("#6366f1");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const update = useMutation({
    mutationFn: async () => api.patch(`/lists/${editingList!.id}`, { name, description, color }),
    onSuccess: () => {
      setEditingList(null);
      setName("");
      setDescription("");
      setColor("#6366f1");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/lists/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });

  const removeLead = useMutation({
    mutationFn: async ({ listId, leadId }: { listId: string; leadId: string }) =>
      api.delete(`/lists/${listId}/items/${leadId}`),
    onSuccess: () => {
      if (detailOpen) {
        api.get(`/lists/${detailOpen.id}`).then((res) => {
          queryClient.setQueryData(["list", detailOpen.id], res.data);
        });
      }
    },
  });

  const startEdit = (list: LeadList) => {
    setEditingList(list);
    setName(list.name);
    setDescription(list.description || "");
    setColor(list.color || "#6366f1");
  };

  const { data: detailData } = useQuery({
    queryKey: ["list", detailOpen?.id],
    queryFn: async () => (await api.get<{ list: ListWithItems }>(`/lists/${detailOpen!.id}`)).data,
    enabled: !!detailOpen,
  });

  const exportCsv = () => {
    if (!detailData?.list?.items?.length) return;
    const headers = ["Empresa", "Telefone", "WhatsApp", "E-mail", "Status", "Cidade", "Criado"];
    const rows = detailData.list.items.map((i) => {
      const c = i.lead.company;
      return [
        `"${c.name}"`,
        `"${c.phone || ""}"`,
        `"${c.whatsapp || ""}"`,
        `"${c.email || ""}"`,
        `"${i.lead.status}"`,
        `"${c.city || ""}${c.state ? "/" + c.state : ""}"`,
        `"${formatDate(i.lead.createdAt)}"`,
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${detailOpen!.name}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Listas</h1>
          <p className="text-muted-foreground">Crie e gerencie listas de leads para organizar sua base.</p>
        </div>
        <Dialog open={open || !!editingList} onOpenChange={(o) => {
          if (!o) {
            setOpen(false);
            setEditingList(null);
            setName("");
            setDescription("");
            setColor("#6366f1");
            setError(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingList(null); setName(""); setDescription(""); setColor("#6366f1"); setError(null); setOpen(true); }}>
              <Plus className="h-4 w-4" /> Nova lista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingList ? "Editar lista" : "Nova lista"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Clientes VIP" />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhe a lista..." />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20 p-1" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button onClick={() => editingList ? update.mutate() : create.mutate()} disabled={!name || create.isPending || update.isPending}>
                {create.isPending || update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingList ? "Salvar" : "Criar")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Minhas listas</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid place-items-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !data?.lists?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma lista criada. Crie a primeira acima.</p>
          ) : (
            <div className="space-y-2">
              {data.lists.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: l.color || "#6366f1" }} />
                    <div>
                      <div className="font-medium">{l.name}</div>
                      {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}
                    </div>
                    <Badge variant="secondary" className="text-xs">{l._count?.items || 0} itens</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetailOpen(l)}>
                      <ListChecks className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(l)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove.mutate(l.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailOpen} onOpenChange={(o) => !o && setDetailOpen(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" /> {detailOpen?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {detailData?.list?.items?.length === 0 && (
              <p className="text-sm text-muted-foreground">Esta lista está vazia.</p>
            )}

            {detailData?.list?.items?.length ? (
              <>
                <Button size="sm" variant="outline" onClick={exportCsv}>
                  <Download className="h-4 w-4" /> Exportar CSV
                </Button>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData.list.items.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>
                          <button
                            onClick={() => window.open(`/companies/${i.lead.company.id}`, "_blank")}
                            className="font-medium hover:underline"
                          >
                            {i.lead.company.name}
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{i.lead.company.phone || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{i.lead.company.email || "—"}</TableCell>
                        <TableCell>
                          <Select
                            value={i.lead.status}
                            onValueChange={(v) => {
                              api.post(`/leads/${i.lead.id}/status`, { status: v });
                            }}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", "ARCHIVED"].map((s) => (
                                <SelectItem key={s} value={s}>{STATUS_LABELS[s as LeadStatus]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{formatDate(i.lead.createdAt)}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLead.mutate({ listId: detailOpen!.id, leadId: i.lead.id })}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Carregando itens...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
