import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, CreditCard, ArrowLeft, Save, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { api, getErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";

export function AdminPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hasApi, setHasApi] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);

  const { data: plan, isLoading } = useQuery({
    queryKey: ["admin-plan", id],
    queryFn: async () => (await api.get(`/admin/plans/${id}`)).data,
    enabled: !!id,
  });

  useEffect(() => {
    if (plan?.plan) {
      setHasApi(plan.plan.hasApi);
      setIsActive(plan.plan.isActive);
    }
  }, [plan?.plan?.id]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => (await api.patch(`/admin/plans/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-plan", id] });
      toast.success("Plano atualizado com sucesso");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err) || "Erro ao atualizar plano");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      priceCents: parseInt(formData.get("priceCents") as string) || 0,
      creditsMonthly: parseInt(formData.get("creditsMonthly") as string) || 0,
      maxUsers: parseInt(formData.get("maxUsers") as string) || 1,
      maxSearches: parseInt(formData.get("maxSearches") as string) || 10,
      maxExports: parseInt(formData.get("maxExports") as string) || 5,
      hasApi: hasApi ?? false,
      isActive: isActive ?? true,
    };
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plan?.plan) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="ml-2 text-muted-foreground">Plano não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const p = plan.plan;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/plans")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
          <p className="text-muted-foreground">Editar configurações do plano</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/10 text-purple-500">
              <CreditCard className="h-4 w-4" />
            </div>
            Detalhes do Plano
          </CardTitle>
          <Badge variant={p.isActive ? "success" : "secondary"}>
            {p.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" defaultValue={p.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceCents">Preço (centavos)</Label>
                <Input id="priceCents" name="priceCents" type="number" defaultValue={p.priceCents} required />
                <p className="text-xs text-muted-foreground">Ex: 2990 = R$ 29,90</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditsMonthly">Créditos por mês</Label>
                <Input id="creditsMonthly" name="creditsMonthly" type="number" defaultValue={p.creditsMonthly} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Máx. usuários</Label>
                <Input id="maxUsers" name="maxUsers" type="number" defaultValue={p.maxUsers} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSearches">Máx. pesquisas</Label>
                <Input id="maxSearches" name="maxSearches" type="number" defaultValue={p.maxSearches} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxExports">Máx. exports</Label>
                <Input id="maxExports" name="maxExports" type="number" defaultValue={p.maxExports} required />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" defaultValue={p.description || ""} rows={3} />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="hasApi" checked={hasApi ?? p.hasApi} onCheckedChange={setHasApi} />
                <Label htmlFor="hasApi">Acesso à API</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={isActive ?? p.isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive">Plano ativo</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate("/admin/plans")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Plano</CardTitle>
          <CardDescription>Detalhes atuais do plano no banco de dados</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-mono">{p.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Preço</dt>
              <dd>{p.priceCents > 0 ? `R$ ${(p.priceCents / 100).toFixed(2)}` : "Gratuito"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Créditos/mês</dt>
              <dd>{formatNumber(p.creditsMonthly)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Máx. usuários</dt>
              <dd>{p.maxUsers}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Máx. pesquisas</dt>
              <dd>{p.maxSearches}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Máx. exports</dt>
              <dd>{p.maxExports}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">API</dt>
              <dd>
                <Badge variant={p.hasApi ? "success" : "secondary"}>
                  {p.hasApi ? "Sim" : "Não"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={p.isActive ? "success" : "secondary"}>
                  {p.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Criado em</dt>
              <dd>{new Date(p.createdAt).toLocaleDateString("pt-BR")}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}