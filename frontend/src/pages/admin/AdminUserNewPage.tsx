import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  isSuperAdmin: z.boolean().default(false),
  createWorkspace: z.boolean().default(true),
  workspaceName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function AdminUserNewPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isSuperAdmin: false, createWorkspace: true },
  });

  const createWorkspace = watch("createWorkspace");
  const isSuperAdmin = watch("isSuperAdmin");

  const mutation = useMutation({
    mutationFn: async (data: FormData) => (await api.post("/admin/users", data)).data,
    onSuccess: (data) => {
      if (data.emailSent) {
        toast.success(`Usuário criado e e-mail de boas-vindas enviado para ${data.user.email}`);
      } else if (data.emailMocked) {
        toast.success("Usuário criado (e-mail simulado — SMTP não configurado)");
      } else {
        toast.success("Usuário criado");
      }
      navigate(`/admin/users/${data.user.id}`);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <UserPlus className="h-5 w-5 text-primary" /> Novo usuário
        </h1>
        <p className="text-muted-foreground">Crie um usuário e envie as credenciais por e-mail.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do usuário</CardTitle>
          <CardDescription>Uma senha temporária será gerada e enviada por e-mail.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => { setError(null); mutation.mutate(d); })} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Nome completo" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="usuario@empresa.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Super Admin</Label>
                <p className="text-xs text-muted-foreground">Acesso total ao painel administrativo</p>
              </div>
              <Switch checked={isSuperAdmin} onCheckedChange={(v) => setValue("isSuperAdmin", v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Criar workspace</Label>
                <p className="text-xs text-muted-foreground">Cria um workspace com créditos iniciais</p>
              </div>
              <Switch checked={createWorkspace} onCheckedChange={(v) => setValue("createWorkspace", v)} />
            </div>
            {createWorkspace && (
              <div className="space-y-2">
                <Label htmlFor="workspaceName">Nome do workspace (opcional)</Label>
                <Input id="workspaceName" placeholder="Padrão: primeiro nome + Workspace" {...register("workspaceName")} />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/admin/users")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Criar e enviar e-mail
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
