import { Plug, Wrench, Zap, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">Conecte fontes de dados e ferramentas externas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
              <Plug className="h-4 w-4" />
            </div>
            Em breve
          </CardTitle>
          <CardDescription>
            A arquitetura de providers já está pronta. Em breve você poderá ativar diferentes fontes de dados
            pela própria interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Google Maps API</div>
                <div className="text-sm text-muted-foreground">Configurável via MAP_PROVIDER_API_KEY</div>
              </div>
              <Badge variant="secondary">Em desenvolvimento</Badge>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-500/10 text-purple-500">
                <ExternalLink className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Provedores Oficiais</div>
                <div className="text-sm text-muted-foreground">Serpro, ReceitaWS, IBGE</div>
              </div>
              <Badge variant="secondary">Em desenvolvimento</Badge>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10 text-green-500">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">API Keys Externas</div>
                <div className="text-sm text-muted-foreground">Para integrações personalizadas</div>
              </div>
              <Badge variant="secondary">Em desenvolvimento</Badge>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-pink-500/10 text-pink-500">
                <Loader2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Webhooks</div>
                <div className="text-sm text-muted-foreground">Notificações em tempo real</div>
              </div>
              <Badge variant="secondary">Em desenvolvimento</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
