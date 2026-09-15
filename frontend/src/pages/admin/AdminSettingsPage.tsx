import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings, Shield, Globe, CreditCard, Bell, Palette, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConfigForm {
  platformName: string;
  baseUrl: string;
  maintenanceMode: boolean;
  require2FA: boolean;
  sessionTimeout: number;
  freeCredits: number;
  welcomeBonus: number;
  searchCost: number;
  enrichmentCost: number;
  sendWelcomeEmail: boolean;
  lowCreditAlerts: boolean;
  weeklyReports: boolean;
  defaultTheme: string;
  primaryColor: string;
}

const EMPTY: ConfigForm = {
  platformName: "",
  baseUrl: "",
  maintenanceMode: false,
  require2FA: false,
  sessionTimeout: 24,
  freeCredits: 100,
  welcomeBonus: 0,
  searchCost: 1,
  enrichmentCost: 1,
  sendWelcomeEmail: true,
  lowCreditAlerts: true,
  weeklyReports: false,
  defaultTheme: "system",
  primaryColor: "#2563eb",
};

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ConfigForm>(EMPTY);
  const [dirty, setDirty] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-config"],
    queryFn: async () => (await api.get("/admin/config")).data,
  });

  useEffect(() => {
    if (config) {
      setForm({ ...EMPTY, ...config });
      setDirty(false);
    }
  }, [config]);

  const set = <K extends keyof ConfigForm>(key: K, value: ConfigForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => (await api.patch("/admin/config", form)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-config"], data);
      setDirty(false);
      toast.success("Configurações salvas");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const num = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Configurações globais da plataforma.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending || isLoading}>
          {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar alterações
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center p-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn("grid h-8 w-8 place-items-center rounded-lg", "bg-blue-500/10 text-blue-500")}>
                  <Globe className="h-4 w-4" />
                </div>
                Geral
              </CardTitle>
              <CardDescription>Configurações gerais da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Plataforma</Label>
                <Input value={form.platformName} onChange={(e) => set("platformName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>URL Base</Label>
                <Input type="url" value={form.baseUrl} onChange={(e) => set("baseUrl", e.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-3">
                <div className="space-y-1">
                  <Label>Modo Manutenção</Label>
                  <p className="text-xs text-muted-foreground">Bloqueia logins exceto Super Admins</p>
                </div>
                <Switch checked={form.maintenanceMode} onCheckedChange={(v) => set("maintenanceMode", v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn("grid h-8 w-8 place-items-center rounded-lg", "bg-red-500/10 text-red-500")}>
                  <Shield className="h-4 w-4" />
                </div>
                Segurança
              </CardTitle>
              <CardDescription>Autenticação e proteção de dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>2FA Obrigatório para Admins</Label>
                  <p className="text-xs text-muted-foreground">Exige autenticação de dois fatores</p>
                </div>
                <Switch checked={form.require2FA} onCheckedChange={(v) => set("require2FA", v)} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label>Expiração de Sessão (horas)</Label>
                  <p className="text-xs text-muted-foreground">Tempo antes do logout automático</p>
                </div>
                <Input type="number" min={1} value={form.sessionTimeout} onChange={(e) => set("sessionTimeout", num(e.target.value))} className="w-24" />
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn("grid h-8 w-8 place-items-center rounded-lg", "bg-amber-500/10 text-amber-500")}>
                  <CreditCard className="h-4 w-4" />
                </div>
                Créditos
              </CardTitle>
              <CardDescription>Limites e custos de créditos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Créditos Iniciais (Plano Free)</Label>
                  <Input type="number" min={0} value={form.freeCredits} onChange={(e) => set("freeCredits", num(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Bônus Boas-Vindas</Label>
                  <Input type="number" min={0} value={form.welcomeBonus} onChange={(e) => set("welcomeBonus", num(e.target.value))} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Custo por Pesquisa</Label>
                  <Input type="number" min={0} value={form.searchCost} onChange={(e) => set("searchCost", num(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Custo por Enriquecimento</Label>
                  <Input type="number" min={0} value={form.enrichmentCost} onChange={(e) => set("enrichmentCost", num(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn("grid h-8 w-8 place-items-center rounded-lg", "bg-pink-500/10 text-pink-500")}>
                  <Bell className="h-4 w-4" />
                </div>
                Notificações
              </CardTitle>
              <CardDescription>Emails e alertas automáticos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email de Boas-Vindas</Label>
                  <p className="text-xs text-muted-foreground">Enviar email ao criar conta</p>
                </div>
                <Switch checked={form.sendWelcomeEmail} onCheckedChange={(v) => set("sendWelcomeEmail", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Alertas de Créditos Baixos</Label>
                  <p className="text-xs text-muted-foreground">Notificar quando menos de 10%</p>
                </div>
                <Switch checked={form.lowCreditAlerts} onCheckedChange={(v) => set("lowCreditAlerts", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Relatórios Semanais</Label>
                  <p className="text-xs text-muted-foreground">Enviar resumo semanal para admins</p>
                </div>
                <Switch checked={form.weeklyReports} onCheckedChange={(v) => set("weeklyReports", v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn("grid h-8 w-8 place-items-center rounded-lg", "bg-purple-500/10 text-purple-500")}>
                  <Palette className="h-4 w-4" />
                </div>
                Aparência
              </CardTitle>
              <CardDescription>Tema e personalização visual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema Padrão</Label>
                <Select value={form.defaultTheme} onValueChange={(v) => set("defaultTheme", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cor Primária (Hex)</Label>
                <div className="flex gap-2">
                  <Input value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} placeholder="#2563eb" />
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(form.primaryColor) ? form.primaryColor : "#2563eb"}
                    onChange={(e) => set("primaryColor", e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-md border bg-transparent p-1"
                    aria-label="Escolher cor"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn("grid h-8 w-8 place-items-center rounded-lg", "bg-cyan-500/10 text-cyan-500")}>
                  <Settings className="h-4 w-4" />
                </div>
                Sobre
              </CardTitle>
              <CardDescription>Informações da instalação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                As chaves de API dos provedores de dados (BrasilAPI, Serpro, mapas) são configuradas via variáveis de
                ambiente no servidor e gerenciadas na página de Providers.
              </p>
              <p className="text-muted-foreground">
                Alterações aqui entram em vigor imediatamente após salvar.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
