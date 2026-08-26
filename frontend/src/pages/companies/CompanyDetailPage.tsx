import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, MessageCircle, Mail, Globe, MapPin, Star, Instagram, Facebook, Loader2, FileSearch, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, getErrorMessage } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => (await api.get(`/companies/${id}`)).data,
    enabled: !!id,
  });

  const queryClient = useQueryClient();

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [cnpjInput, setCnpjInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lookupCnpj = async () => {
    setLookupLoading(true);
    setError(null);
    try {
      const res = await api.get(`/companies/${id}/lookup-cnpj`);
      setLookupResult(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLookupLoading(false);
    }
  };

  const enrichCompany = useMutation({
    mutationFn: async () => api.post(`/enrichment/companies/${id}`, {
      fields: ["email", "phone", "whatsapp", "website", "social"],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
      queryClient.invalidateQueries({ queryKey: ["enrichment-jobs"] });
    },
    onError: (err: any) => setError(getErrorMessage(err)),
  });

  const saveCnpj = async () => {
    if (!cnpjInput.trim()) return;
    try {
      await api.patch(`/companies/${id}`, { document: cnpjInput.replace(/\D/g, "") });
      queryClient.invalidateQueries({ queryKey: ["company", id] });
      setCnpjInput("");
      setLookupResult(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isLoading) return <div className="grid place-items-center p-12"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!data) return null;

  const c = data.company;
  const mapsUrl = c.latitude && c.longitude
    ? `https://www.google.com/maps?q=${c.latitude},${c.longitude}`
    : c.address
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${c.address}, ${c.city}, ${c.state}`)}`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
          {c.legalName && c.legalName !== c.name && <p className="text-muted-foreground">{c.legalName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
            {c.category && <CardDescription>{c.category}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {c.description && <p className="text-sm">{c.description}</p>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Telefone" value={c.phone} icon={Phone} />
              <Field label="WhatsApp" value={c.whatsapp} icon={MessageCircle} />
              <Field label="E-mail" value={c.email} icon={Mail} href={c.email ? `mailto:${c.email}` : undefined} />
              <Field label="Site" value={c.website} icon={Globe} href={c.website} />
              <Field label="Instagram" value={c.instagram} icon={Instagram} href={c.instagram ? `https://instagram.com/${c.instagram.replace("@", "")}` : undefined} />
              <Field label="Facebook" value={c.facebook} icon={Facebook} href={c.facebook ? `https://facebook.com/${c.facebook}` : undefined} />
            </div>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <MapPin className="h-4 w-4" /> Ver no mapa
              </a>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {!c.document ? (
                <>
                  <Button size="sm" variant="outline" onClick={lookupCnpj} disabled={lookupLoading}>
                    {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                    Buscar CNPJ
                  </Button>

                  {lookupResult?.found === false && (
                    <Button size="sm" variant="outline" onClick={() => window.open(lookupResult.searchUrl, "_blank")} className="gap-1">
                      <Globe className="h-3 w-3" /> ReceitaWS
                    </Button>
                  )}

                  <Input
                    value={cnpjInput}
                    onChange={(e) => setCnpjInput(e.target.value)}
                    placeholder="Digite o CNPJ aqui"
                    className="w-52"
                  />
                  <Button size="sm" onClick={saveCnpj} disabled={!cnpjInput.trim()}>Salvar CNPJ</Button>
                </>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <FileSearch className="h-3 w-3" /> CNPJ: {c.document}
                </Badge>
              )}

              <Button size="sm" variant="secondary" onClick={() => enrichCompany.mutate()} disabled={enrichCompany.isPending}>
                {enrichCompany.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Enriquecer dados
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {c.address && <p>{c.address}</p>}
            {c.neighborhood && <p>{c.neighborhood}</p>}
            <p>{c.city}{c.state ? `, ${c.state}` : ""}</p>
            {c.postalCode && <p>CEP: {c.postalCode}</p>}
            <p>{c.country}</p>
            {c.latitude && c.longitude && (
              <p className="text-xs text-muted-foreground">{c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avaliação</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          {c.rating != null ? (
            <>
              <Badge variant="outline" className="gap-1 px-3 py-1 text-base">
                <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-500" /> {c.rating}
              </Badge>
              <span className="text-sm text-muted-foreground">{c.reviewCount ?? 0} avaliações</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Sem avaliações disponíveis.</span>
          )}
        </CardContent>
      </Card>

      {c.sourceUrl && (
        <p className="text-xs text-muted-foreground">
          Fonte: <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="underline">{c.source || "desconhecida"}</a>
        </p>
      )}
    </div>
  );
}

function Field({ label, value, icon: Icon, href }: { label: string; value?: string | null; icon: React.ComponentType<{ className?: string }>; href?: string }) {
  if (!value) return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">—</p>
    </div>
  );
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm hover:underline">
          <Icon className="h-3 w-3" /> {value}
        </a>
      ) : (
        <p className="flex items-center gap-1 text-sm"><Icon className="h-3 w-3" /> {value}</p>
      )}
    </div>
  );
}
