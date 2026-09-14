import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Plus, Send, Trash2, Loader2, Users, CheckCircle2, AlertCircle, KeyRound, Star, RotateCcw } from "lucide-react";
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
import type { EmailCampaign, CampaignStatus, EmailQuota, LeadList, SmtpCredential, Tag } from "@/types";
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
  const [credentialDialog, setCredentialDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    bodyContent: "",
    listId: "",
    tagId: "",
    smtpCredentialId: "",
  });
  const [credForm, setCredForm] = useState({
    name: "",
    host: "smtp.gmail.com",
    port: "587",
    username: "",
    password: "",
    fromAddress: "",
    dailyLimit: "500",
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

  const { data: quota } = useQuery({
    queryKey: ["email-quota"],
    queryFn: async () => (await api.get<EmailQuota>("/email-campaigns/quota")).data,
    refetchInterval: 30000,
  });

  const { data: credentialsData } = useQuery({
    queryKey: ["smtp-credentials"],
    queryFn: async () => (await api.get<{ items: SmtpCredential[] }>("/smtp-credentials")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post("/email-campaigns", {
          name: form.name,
          subject: form.subject,
          bodyContent: form.bodyContent,
          listId: form.listId.trim() ? form.listId : undefined,
          tagId: form.tagId.trim() ? form.tagId : undefined,
          smtpCredentialId: form.smtpCredentialId.trim() ? form.smtpCredentialId : undefined,
        })
      ).data,
    onSuccess: () => {
      setCreateDialog(false);
      setForm({ name: "", subject: "", bodyContent: "", listId: "", tagId: "", smtpCredentialId: "" });
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
    },
  });

  const createCredential = useMutation({
    mutationFn: async () =>
      (
        await api.post("/smtp-credentials", {
          name: credForm.name,
          host: credForm.host,
          port: Number(credForm.port) || 587,
          username: credForm.username,
          password: credForm.password,
          fromAddress: credForm.fromAddress.trim() || credForm.username,
          dailyLimit: Number(credForm.dailyLimit) || 500,
          isDefault: !credentialsData?.items?.length,
        })
      ).data,
    onSuccess: () => {
      setCredentialDialog(false);
      setCredForm({ name: "", host: "smtp.gmail.com", port: "587", username: "", password: "", fromAddress: "", dailyLimit: "500" });
      queryClient.invalidateQueries({ queryKey: ["smtp-credentials"] });
    },
  });

  const deleteCredential = useMutation({
    mutationFn: async (id: string) => api.delete(`/smtp-credentials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtp-credentials"] });
    },
  });

  const setDefaultCredential = useMutation({
    mutationFn: async (id: string) => api.patch(`/smtp-credentials/${id}`, { isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtp-credentials"] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/email-campaigns/${id}/send`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["email-quota"] });
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

      {quota && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 py-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-lg font-semibold">
                  {quota.sentToday}/{quota.dailyLimit}
                </span>
                <span className="text-sm text-muted-foreground">
                  e-mails enviados hoje · restam <strong className="text-foreground">{quota.remaining}</strong>
                </span>
              </div>
              <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${quota.dailyLimit ? Math.min(100, (quota.sentToday / quota.dailyLimit) * 100) : 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                A cota renova à meia-noite (horário de Brasília).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <TableHead>Remetente</TableHead>
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
                    <TableCell className="text-xs text-muted-foreground">
                      {campaign.smtpCredential ? (
                        <Badge variant="outline" className="gap-1">
                          <KeyRound className="h-3 w-3" /> {campaign.smtpCredential.name}
                        </Badge>
                      ) : (
                        <span className="text-xs">Padrão do sistema</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {campaign.status !== "SENDING" && (
                          <Button
                            size="sm"
                            variant={campaign.status === "DRAFT" || campaign.status === "SCHEDULED" ? "default" : "outline"}
                            onClick={() => sendMutation.mutate(campaign.id)}
                            disabled={sendMutation.isPending}
                            className="gap-1.5"
                          >
                            {sendMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : campaign.status === "COMPLETED" || campaign.status === "FAILED" ? (
                              <RotateCcw className="h-3.5 w-3.5" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            {campaign.status === "COMPLETED" || campaign.status === "FAILED"
                              ? "Disparar novamente"
                              : "Disparar"}
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
          {sendMutation.error && (
            <p className="px-4 py-3 text-sm text-destructive">{getErrorMessage(sendMutation.error)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" /> Minhas credenciais SMTP
            </CardTitle>
            <CardDescription>
              Cadastre sua própria conta de envio (ex: Gmail com senha de app) para não usar o remetente padrão do sistema.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setCredentialDialog(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {!credentialsData?.items?.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma credencial cadastrada. Suas campanhas usarão o remetente padrão do sistema.
            </p>
          ) : (
            <div className="space-y-2">
              {credentialsData.items.map((cred) => (
                <div key={cred.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cred.name}</span>
                      {cred.isDefault && <Badge variant="success">Padrão</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cred.username} · {cred.host}:{cred.port} · limite {cred.dailyLimit}/dia
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!cred.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDefaultCredential.mutate(cred.id)}
                        disabled={setDefaultCredential.isPending}
                        className="gap-1.5 text-xs"
                        title="Usar como padrão"
                      >
                        <Star className="h-3.5 w-3.5" /> Padrão
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteCredential.mutate(cred.id)}
                      disabled={deleteCredential.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
              <Label>Conta de envio (SMTP)</Label>
              <Select value={form.smtpCredentialId} onValueChange={(v) => setForm({ ...form, smtpCredentialId: v })}>
                <SelectTrigger><SelectValue placeholder="Padrão do sistema" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Padrão do sistema</SelectItem>
                  {credentialsData?.items.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.username})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Use sua própria credencial para não consumir a conta padrão. Cadastre em "Minhas credenciais SMTP" abaixo.
              </p>
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

      <Dialog open={credentialDialog} onOpenChange={setCredentialDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Nova credencial SMTP
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cred-name">Nome (identificação)</Label>
              <Input
                id="cred-name"
                placeholder="Ex: Meu Gmail"
                value={credForm.name}
                onChange={(e) => setCredForm({ ...credForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cred-host">Servidor SMTP</Label>
                <Input
                  id="cred-host"
                  placeholder="smtp.gmail.com"
                  value={credForm.host}
                  onChange={(e) => setCredForm({ ...credForm, host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cred-port">Porta</Label>
                <Input
                  id="cred-port"
                  type="number"
                  value={credForm.port}
                  onChange={(e) => setCredForm({ ...credForm, port: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cred-username">Usuário / E-mail</Label>
              <Input
                id="cred-username"
                placeholder="voce@gmail.com"
                value={credForm.username}
                onChange={(e) => setCredForm({ ...credForm, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cred-password">Senha (ou senha de app)</Label>
              <Input
                id="cred-password"
                type="password"
                placeholder="••••••••••••••••"
                value={credForm.password}
                onChange={(e) => setCredForm({ ...credForm, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Para Gmail, use uma senha de app (Conta Google → Segurança → Senhas de app). A senha é armazenada criptografada.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cred-from">Remetente</Label>
                <Input
                  id="cred-from"
                  placeholder="Igual ao usuário"
                  value={credForm.fromAddress}
                  onChange={(e) => setCredForm({ ...credForm, fromAddress: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cred-limit">Limite diário</Label>
                <Input
                  id="cred-limit"
                  type="number"
                  min={1}
                  value={credForm.dailyLimit}
                  onChange={(e) => setCredForm({ ...credForm, dailyLimit: e.target.value })}
                />
              </div>
            </div>
          </div>

          {createCredential.error && (
            <p className="text-sm text-destructive">{getErrorMessage(createCredential.error)}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCredentialDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createCredential.mutate()}
              disabled={createCredential.isPending || !credForm.name || !credForm.host || !credForm.username || !credForm.password}
            >
              {createCredential.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar credencial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
