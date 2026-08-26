import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, MapPin, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, getErrorMessage } from "@/lib/api";
import type { Company, Search as SearchType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StateSelect, CitySelect } from "@/components/forms/LocationSelect";

// Segment presets that match common OSM tags
const SEGMENT_PRESETS = [
  { value: "clinica", label: "Clínicas / Consultórios" },
  { value: "dentista", label: "Dentistas" },
  { value: "restaurante", label: "Restaurantes" },
  { value: "academia", label: "Academias / Fitness" },
  { value: "escola", label: "Escolas / Universidades" },
  { value: "hotel", label: "Hotéis / Pousadas" },
  { value: "oficina", label: "Oficinas / Auto" },
  { value: "mercado", label: "Mercados / Supermercados" },
  { value: "farmacia", label: "Farmácias" },
  { value: "banco", label: "Bancos / Financeiras" },
  { value: "pet", label: "Pet shops / Veterinárias" },
  { value: "salao", label: "Salões / Beleza" },
  { value: "loja", label: "Lojas de Roupa" },
];

const RADIUS_PRESETS = [
  { value: "1", label: "1 km" },
  { value: "3", label: "3 km" },
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "20", label: "20 km" },
  { value: "50", label: "50 km" },
];

export function SearchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    keyword: "",
    country: "Brasil",
    state: "",
    city: "",
    region: "",
    neighborhood: "",
    category: "",
    radiusKm: 5,
    quantity: 50,
  });
  const [customKeyword, setCustomKeyword] = useState(false);

  const { data: searches } = useQuery({
    queryKey: ["searches"],
    queryFn: async () => (await api.get<{ items: SearchType[] }>("/search?pageSize=10")).data,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { keyword: form.keyword, quantity: form.quantity };
      if (form.country) payload.country = form.country;
      if (form.state) payload.state = form.state;
      if (form.city) payload.city = form.city;
      if (form.region) payload.region = form.region;
      if (form.neighborhood) payload.neighborhood = form.neighborhood;
      if (form.category) payload.category = form.category;
      if (form.radiusKm) payload.radiusKm = form.radiusKm;
      return (await api.post("/search", payload)).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["searches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (data.search) navigate(`/search/${data.search.id}`);
    },
  });

  const selectedPreset = SEGMENT_PRESETS.find((s) => s.value === form.keyword);
  const showCustomInput = customKeyword || (!selectedPreset && form.keyword.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Encontrar empresas</h1>
        <p className="text-muted-foreground">Defina o segmento e a localização para iniciar uma pesquisa.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova pesquisa</CardTitle>
          <CardDescription>Cada empresa encontrada consome 1 crédito da sua workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="keyword">Segmento</Label>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Select
                  value={showCustomInput ? "custom" : form.keyword}
                  onValueChange={(v) => {
                    if (v === "custom") {
                      setCustomKeyword(true);
                    } else {
                      setCustomKeyword(false);
                      setForm({ ...form, keyword: v });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um segmento ou digite personalizado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {SEGMENT_PRESETS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">— personalizado —</SelectItem>
                  </SelectContent>
                </Select>
                {showCustomInput && (
                  <Input
                    id="keyword"
                    placeholder="Digite o segmento (ex: clínicas odontológicas)"
                    value={form.keyword}
                    onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                    required
                    minLength={2}
                  />
                )}
              </div>
              {selectedPreset && (
                <p className="text-xs text-muted-foreground">
                  Segmento selecionado: <strong>{selectedPreset.label}</strong>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>País</Label>
                <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Brasil">Brasil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado *</Label>
                <StateSelect value={form.state} onChange={(v: string) => setForm({ ...form, state: v, city: "" })} />
              </div>
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <CitySelect state={form.state} value={form.city} onChange={(v: string) => setForm({ ...form, city: v })} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="region">Região</Label>
                <Input
                  id="region"
                  placeholder="Ex: Vale do Paraíba"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  placeholder="Opcional"
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Raio de busca</Label>
                <Select
                  value={String(form.radiusKm)}
                  onValueChange={(v) => setForm({ ...form, radiusKm: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o raio" />
                  </SelectTrigger>
                  <SelectContent>
                    {RADIUS_PRESETS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade (máx 100)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={100}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                />
              </div>
            </div>

            {mutation.error && (
              <p className="text-sm text-destructive">{getErrorMessage(mutation.error)}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForm({ ...form, keyword: "", city: "", state: "" })}
              >
                Limpar
              </Button>
              <Button type="submit" disabled={mutation.isPending || !form.keyword || !form.city}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Pesquisando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" /> Encontrar empresas
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pesquisas recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {!searches?.items?.length ? (
            <EmptyState
              icon={<MapPin className="h-10 w-10" />}
              title="Nenhuma pesquisa ainda"
              description="Faça sua primeira busca acima para encontrar empresas."
            />
          ) : (
            <div className="space-y-2">
              {searches.items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/search/${s.id}`)}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-accent"
                >
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <Building2 className="h-4 w-4 text-primary" /> {s.keyword}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {[s.city, s.state].filter(Boolean).join(" · ") || "Sem localização"} ·{" "}
                      {new Date(s.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        s.status === "COMPLETED"
                          ? "success"
                          : s.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {s.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{s.resultsCount} resultados</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
