import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag as TagIcon, Loader2, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api, getErrorMessage } from "@/lib/api";
import type { Tag } from "@/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";

export function TagsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await api.get<{ tags: Tag[] }>("/tags")).data,
  });

  const create = useMutation({
    mutationFn: async () => api.post("/tags", { name, color }),
    onSuccess: () => {
      setOpen(false);
      setName("");
      setColor("#6366f1");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">Organize seus leads com tags personalizadas.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Nova tag</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova tag</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Quente" />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20 p-1" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
                {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Minhas tags</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : !data?.tags?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma tag. Crie a primeira acima.</p>
          ) : (
            <div className="space-y-2">
              {data.tags.map((t) => (
                <Link
                  key={t.id}
                  to={`/tags/${t.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded ${t.color ? "bg-[${t.color}]" : "bg-primary"}`}>
                      <TagIcon className="h-3 w-3 text-white" />
                    </div>
                    <div className="font-medium">{t.name}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
