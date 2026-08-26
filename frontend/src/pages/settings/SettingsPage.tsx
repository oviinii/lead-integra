import { useQuery } from "@tanstack/react-query";
import { Loader2, Users as UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function SettingsPage() {
  const { user, workspace } = useAuth();
  const { data: members } = useQuery({
    queryKey: ["workspace-members", workspace?.id],
    queryFn: async () => workspace ? (await api.get(`/workspaces/${workspace.id}/members`)).data : null,
    enabled: !!workspace,
  });

  if (!workspace) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua conta e workspace.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Conta</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><strong>Nome:</strong> {user?.name}</p>
          <p><strong>E-mail:</strong> {user?.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><strong>Nome:</strong> {workspace.name}</p>
          <p><strong>Plano:</strong> <Badge>{workspace.plan}</Badge></p>
          <p><strong>Slug:</strong> {workspace.slug}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><UsersIcon className="h-4 w-4" /> Membros</CardTitle>
        </CardHeader>
        <CardContent>
          {!members?.members?.length ? (
            <p className="text-sm text-muted-foreground">Carregando membros...</p>
          ) : (
            <div className="divide-y">
              {members.members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{m.user.name}</div>
                    <div className="text-xs text-muted-foreground">{m.user.email}</div>
                  </div>
                  <Badge variant="secondary">{m.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
