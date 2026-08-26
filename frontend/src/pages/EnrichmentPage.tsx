import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Clock, CheckCircle, XCircle, TrendingUp, MessageCircle, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, getErrorMessage } from "@/lib/api";
import type { Lead, LeadStatus } from "@/types";
import { formatDateTime, formatPhone, whatsappLink } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

interface WhatsAppCheckResult {
  phone: string;
  hasWhatsApp: boolean;
  whatsappNumber?: string;
}

interface PhoneCompanyPair {
  phone: string;
  companyId: string;
}

export function EnrichmentPage() {
  const queryClient = useQueryClient();
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"pending" | "verified">("pending");
  const [error, setError] = useState<string | null>(null);

  const { data: openwaStatus } = useQuery({
    queryKey: ["openwa-status"],
    queryFn: async () => (await api.get<{ connected: boolean }>("/openwa/status")).data,
    refetchInterval: 30000,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => (await api.get<{ items: Lead[] }>("/leads?pageSize=200")).data,
  });

  const checkWhatsApp = useMutation({
    mutationFn: async (items: PhoneCompanyPair[]) =>
      api.post<{ results: Record<string, WhatsAppCheckResult> }>("/openwa/batch-check", { phones: items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSelectedLeads(new Set());
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const allLeads = leads?.items ?? [];
  const leadsWithPhone = allLeads.filter((l) => l.company.phone || l.company.whatsapp);

  const displayedLeads = viewMode === "verified"
    ? leadsWithPhone.filter((l) => l.company.whatsapp)
    : leadsWithPhone.filter((l) => !l.company.whatsapp);

  const totalWithPhone = leadsWithPhone.length;
  const totalVerified = leadsWithPhone.filter((l) => l.company.whatsapp).length;
  const totalPending = totalWithPhone - totalVerified;
  const progressPct = totalWithPhone > 0 ? Math.round((totalVerified / totalWithPhone) * 100) : 0;

  const toggleLead = (leadId: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === displayedLeads.length) setSelectedLeads(new Set());
    else displayedLeads.forEach((l) => setSelectedLeads((prev) => new Set([...prev, l.id])));
  };

  const handleCheckWhatsApp = (items: PhoneCompanyPair[]) => {
    setError(null);
    checkWhatsApp.mutate(items);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Verificação WhatsApp</h1>
          <p className="text-muted-foreground">Verifique quais leads têm WhatsApp ativo usando OpenWA.</p>
        </div>
        <div className="flex gap-2">
          {openwaStatus?.connected === false && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" /> OpenWA offline
            </Badge>
          )}
          {openwaStatus?.connected === true && (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" /> OpenWA online
            </Badge>
          )}
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as "pending" | "verified")}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Sem WhatsApp ({totalPending})</SelectItem>
              <SelectItem value="verified">Com WhatsApp ({totalVerified})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Progresso
          </CardTitle>
          <CardDescription>
            {totalWithPhone > 0
              ? `${totalVerified} de ${totalWithPhone} leads com WhatsApp verificado (${progressPct}%)`
              : "Nenhum lead com telefone cadastrado."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{totalVerified} com WhatsApp</span>
              <span>{totalPending} sem WhatsApp</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {viewMode === "verified" ? "Leads com WhatsApp" : "Leads para verificar"}
          </CardTitle>
          <div className="flex gap-2">
            {selectedLeads.size > 0 && viewMode === "pending" && (
              <Button
                size="sm"
                onClick={() => {
                  const items = displayedLeads
                    .filter((l) => selectedLeads.has(l.id))
                    .filter((l) => l.company.phone || l.company.whatsapp)
                    .map((l) => ({
                      phone: l.company.phone || l.company.whatsapp!,
                      companyId: l.company.id,
                    }));
                  if (items.length > 0) handleCheckWhatsApp(items);
                }}
                disabled={checkWhatsApp.isPending || !openwaStatus?.connected}
              >
                {checkWhatsApp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                Verificar WhatsApp ({selectedLeads.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {leadsLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !displayedLeads.length ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {viewMode === "verified"
                ? "Nenhum lead com WhatsApp verificado ainda."
                : "Todos os leads com telefone já têm WhatsApp verificado!"}
            </div>
          ) : (
            <div className="border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        checked={selectedLeads.size === displayedLeads.length && displayedLeads.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead className="w-32">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="pr-2">
                        <Checkbox
                          checked={selectedLeads.has(lead.id)}
                          onCheckedChange={() => toggleLead(lead.id)}
                          aria-label={`Selecionar ${lead.company.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{lead.company.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.company.city || "—"}
                        {lead.company.state ? `/${lead.company.state}` : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[lead.status]} className="text-xs">
                          {STATUS_LABELS[lead.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatPhone(lead.company.phone) || "—"}</TableCell>
                      <TableCell>
                        {lead.company.whatsapp ? (
                          <a
                            href={whatsappLink(lead.company.whatsapp)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-green-500 hover:underline"
                          >
                            <CheckCircle className="h-3 w-3" /> {formatPhone(lead.company.whatsapp)}
                          </a>
                        ) : lead.company.whatsappVerified ? (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <XCircle className="h-3 w-3 text-red-500" /> Sem WhatsApp
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          disabled={checkWhatsApp.isPending || !(lead.company.phone || lead.company.whatsapp) || !openwaStatus?.connected}
                          onClick={() => {
                            const phone = lead.company.phone || lead.company.whatsapp;
                            if (phone) handleCheckWhatsApp([{ phone, companyId: lead.company.id }]);
                          }}
                        >
                          {checkWhatsApp.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          <span className="ml-1">Verificar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}