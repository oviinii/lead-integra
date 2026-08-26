import { Plug, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">Conecte fontes de dados e ferramentas externas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plug className="h-4 w-4" /> Em breve</CardTitle>
          <CardDescription>
            A arquitetura de providers já está pronta. Em breve você poderá ativar diferentes fontes de dados
            pela própria interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Google Maps (configurável via MAP_PROVIDER_API_KEY)</li>
            <li>Provedores oficiais de dados empresariais</li>
            <li>API Key para integrações externas</li>
            <li>Webhooks</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
