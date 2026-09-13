import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, Settings, Shield, Globe, CreditCard, Bell, Palette, Key } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, getErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AdminSettingsPage() {
  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-config"],
    queryFn: async () => (await api.get("/admin/config")).data,
  });

  const settingsSections = [
    {
      id: "general",
      title: "Geral",
      icon: Globe,
      color: "bg-blue-500/10 text-blue-500",
      description: "Configurações gerais da plataforma",
    },
    {
      id: "security",
      title: "Segurança",
      icon: Shield,
      color: "bg-red-500/10 text-red-500",
      description: "Autenticação e proteção de dados",
    },
    {
      id: "credits",
      title: "Créditos",
      icon: CreditCard,
      color: "bg-amber-500/10 text-amber-500",
      description: "Limites e custos de créditos",
    },
    {
      id: "notifications",
      title: "Notificações",
      icon: Bell,
      color: "bg-pink-500/10 text-pink-500",
      description: "Emails e alertas automáticos",
    },
    {
      id: "appearance",
      title: "Aparência",
      icon: Palette,
      color: "bg-purple-500/10 text-purple-500",
      description: "Tema e personalização visual",
    },
    {
      id: "api",
      title: "API Keys",
      icon: Key,
      color: "bg-cyan-500/10 text-cyan-500",
      description: "Chaves de integração externa",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Configurações globais da plataforma.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Card key={section.id} className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn("grid h-8 w-8 place-items-center rounded-lg", section.color)}>
                  <section.icon className="h-4 w-4" />
                </div>
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {section.id === "general" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Plataforma</Label>
                    <Input defaultValue={config?.platformName || "Lead Generator"} />
                  </div>
                  <div className="space-y-2">
                    <Label>URL Base</Label>
                    <Input type="url" defaultValue={config?.baseUrl || "https://app.exemplo.com"} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Modo Manutenção</Label>
                      <p className="text-xs text-muted-foreground">Impede novos logins exceto admins</p>
                    </div>
                    <Switch defaultChecked={config?.maintenanceMode || false} />
                  </div>
                </div>
              )}
              {section.id === "security" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>2FA Obrigatório para Admins</Label>
                      <p className="text-xs text-muted-foreground">Exige autenticação de dois fatores</p>
                    </div>
                    <Switch defaultChecked={config?.require2FA || false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Expiração de Sessão (horas)</Label>
                      <p className="text-xs text-muted-foreground">Tempo antes do logout automático</p>
                    </div>
                    <Input type="number" defaultValue={config?.sessionTimeout || 24} className="w-24" />
                  </div>
                </div>
              )}
              {section.id === "credits" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Créditos Iniciais (Plano Free)</Label>
                      <Input type="number" defaultValue={config?.freeCredits || 100} />
                    </div>
                    <div className="space-y-2">
                      <Label>Bônus Boas-Vindas</Label>
                      <Input type="number" defaultValue={config?.welcomeBonus || 0} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Custo por Pesquisa</Label>
                      <Input type="number" defaultValue={config?.searchCost || 1} />
                    </div>
                    <div className="space-y-2">
                      <Label>Custo por Enriquecimento</Label>
                      <Input type="number" defaultValue={config?.enrichmentCost || 1} />
                    </div>
                  </div>
                </div>
              )}
              {section.id === "notifications" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email de Boas-Vindas</Label>
                      <p className="text-xs text-muted-foreground">Enviar email ao criar conta</p>
                    </div>
                    <Switch defaultChecked={config?.sendWelcomeEmail || true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Alertas de Créditos Baixos</Label>
                      <p className="text-xs text-muted-foreground">Notificar quando menos de 10%</p>
                    </div>
                    <Switch defaultChecked={config?.lowCreditAlerts || true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Relatórios Semanais</Label>
                      <p className="text-xs text-muted-foreground">Enviar resumo semanal para admins</p>
                    </div>
                    <Switch defaultChecked={config?.weeklyReports || false} />
                  </div>
                </div>
              )}
              {section.id === "appearance" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tema Padrão</Label>
                    <Select defaultValue={config?.defaultTheme || "system"}>
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
                    <Input defaultValue={config?.primaryColor || "#6366f1"} />
                  </div>
                </div>
              )}
              {section.id === "api" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure chaves de API para integrações externas.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>BrasilAPI / IBGE</Label>
                      <Input type="password" placeholder="API Key (opcional)" />
                    </div>
                    <div className="space-y-2">
                      <Label>Overpass API / OSM</Label>
                      <Input type="password" placeholder="API Key (opcional)" />
                    </div>
                    <div className="space-y-2">
                      <Label>Serpro CNPJ</Label>
                      <Input type="password" placeholder="API Key (opcional)" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nominatim (Geocoding)</Label>
                      <Input type="password" placeholder="API Key (opcional)" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}