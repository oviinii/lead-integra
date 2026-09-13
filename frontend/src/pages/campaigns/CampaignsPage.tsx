import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Plus, Send, Trash2, Loader2, Users, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api, getErrorMessage } from "@/lib/api";
import type { EmailCampaign, CampaignStatus, LeadList, Tag } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendado",
  SENDING: "Enviando...",
  COMPLETED: "Concluído",
  FAILED: "Falhou",
};

const STATUS_VARIANTS: Record<CampaignStatus, "secondary" | "outline" | "success" | "destructive"> = {
  DRAFT: "secondary",
  SCHEDULED: "outline",
  SENDING: "outline",
  COMPLETED: "success",
  FAILED: "destructive",
};

export function CampaignsPage() {
  const queryClient = useQueryClient();
  const [createDialog, setCreateDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    bodyContent: "",
    listId: "",
    tagId: "",
  });

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: async () => (await api.get<{ items: EmailCampaign[]; total: number }>("/email-campaigns")).data,
  });

  const { data: listsData } = useQuery({
    queryKey: ["lists"],
    queryFn: async () => (await api.get<{ lists: LeadList[] }>("/lists")).data,
  });

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await api.get<{ tags: Tag[] }>("/tags")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post("/email-campaigns", {
          name: form.name,
          subject: form.subject,
          bodyContent: form.bodyContent,
          listId: form.listId || undefined,
          tagId: form.tagId || undefined,
        })
      ).data,
    onSuccess: () => {
      setCreateDialog(false);
      setForm({ name: "", subject: "", bodyContent: "", listId: "", tagId: "" });
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/email-campaigns/${id}/send`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/email-campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">E-mail Marketing</h1>
          <p className="text-muted-foreground">Crie e envie campanhas de e-mail em massa para seus leads.</p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Campanha
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minhas Campanhas</CardTitle>
          <CardDescription>Gerencie seus envios em massa e acompanhe os relatórios de entrega.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="grid place-items-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !campaignsData?.items?.length ? (
            <EmptyState
              icon={<Mail className="h-10 w-10" />}
              title="Nenhuma campanha criada"
              description="Crie sua primeira campanha para disparar e-mails para seus leads."
              action={
                <Button onClick={() => setCreateDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Criar campanha
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Público-alvo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignsData.items.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-xs text-muted-foreground">{campaign.subject}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {campaign.list ? (
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" /> Lista: {campaign.list.name}
                        </Badge>
                      ) : campaign.tag ? (
                        <Badge variant="outline" className="gap-1">
                          Tag: {campaign.tag.name}
                        </Badge>
                      ) : (
                        <span className="text-xs">Todos os leads com e-mail</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[campaign.status]}>
                        {campaign.status === "SENDING" && <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />}
                        {STATUS_LABELS[campaign.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {campaign.sentCount}
                        </span>
                        {campaign.failedCount > 0 && (
                          <span className="flex items-center gap-1 text-red-500">
                            <AlertCircle className="h-3.5 w-3.5" /> {campaign.failedCount}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          / {campaign.totalRecipients} destinatários
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(campaign.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {campaign.status === "DRAFT" && (
                          <Button
                            size="sm"
                            onClick={() => sendMutation.mutate(campaign.id)}
                            disabled={sendMutation.isPending}
                            className="gap-1.5"
                          >
                            {sendMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            Disparar
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(campaign.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Nova Campanha de E-mail
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da campanha</Label>
              <Input
                id="name"
                placeholder="Ex: Prospecção Clínicas SP - Setembro"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Assunto do e-mail</Label>
              <Input
                id="subject"
                placeholder="Ex: Oportunidade de parceria exclusiva"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Filtrar por Lista</Label>
                <Select value={form.listId} onValueChange={(v) => setForm({ ...form, listId: v, tagId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Todas as listas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Todas as listas</SelectItem>
                    {listsData?.lists.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filtrar por Tag</Label>
                <Select value={form.tagId} onValueChange={(v) => setForm({ ...form, tagId: v, listId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Todas as tags" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Todas as tags</SelectItem>
                    {tagsData?.tags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyContent">Conteúdo do e-mail</Label>
              <Textarea
                id="bodyContent"
                placeholder="Escreva sua mensagem. Dica: use {{nome}} para personalizar o nome da empresa."
                rows={6}
                value={form.bodyContent}
                onChange={(e) => setForm({ ...form, bodyContent: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: <code className="rounded bg-muted px-1 py-0.5">{"{{nome}}"}</code> (nome da empresa). Suporta HTML básico.
              </p>
            </div>
          </div>

          {createMutation.error && (
            <p className="text-sm text-destructive">{getErrorMessage(createMutation.error)}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.name || !form.subject || !form.bodyContent}
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar Campanha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
