import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Phone, MessageCircle, Mail, Globe, MapPin, Star, Save, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, getErrorMessage } from "@/lib/api";
import type { Company } from "@/types";

export function SearchResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["search", id],
    queryFn: async () => (await api.get(`/search/${id}`)).data,
    enabled: !!id,
  });

  const saveLead = useMutation({
    mutationFn: async (companyId: string) => api.post("/leads", { companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (isLoading) return <div className="grid place-items-center p-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!data) return null;

  const search = data.search;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/search")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{search.keyword}</h1>
            <p className="text-muted-foreground">
              {[search.city, search.state, search.country].filter(Boolean).join(" · ") || "Sem localização específica"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={search.status === "COMPLETED" ? "success" : "secondary"}>{search.status}</Badge>
          <Button variant="outline" size="sm" onClick={() => {
            window.location.href = `${(import.meta as any).env.VITE_API_URL || ""}/api/exports?listId=${search.id}`;
          }}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total encontrado</CardDescription><CardTitle className="text-3xl">{search.resultsCount}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Novas empresas</CardDescription><CardTitle className="text-3xl">{search.savedCount}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Concluída em</CardDescription><CardTitle className="text-base">{search.completedAt ? new Date(search.completedAt).toLocaleString("pt-BR") : "—"}</CardTitle></CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas encontradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!search.results?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum resultado.</p>
          ) : (
            search.results.map((r: any) => (
              <CompanyRow
                key={r.id}
                company={r.company}
                onSave={() => saveLead.mutate(r.company.id)}
                saving={saveLead.isPending}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CompanyRow({ company, onSave, saving }: { company: Company; onSave: () => void; saving: boolean }) {
  return (
    <div className="rounded-lg border p-4 transition-colors hover:bg-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{company.name}</h3>
            {company.category && <Badge variant="secondary">{company.category}</Badge>}
            {company.rating != null && (
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3 fill-yellow-400 stroke-yellow-500" /> {company.rating} ({company.reviewCount})
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {company.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {company.city}{company.state ? `, ${company.state}` : ""}
              </span>
            )}
            {company.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {company.phone}
              </span>
            )}
            {company.whatsapp && (
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-green-600" /> {company.whatsapp}
              </span>
            )}
            {company.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {company.email}
              </span>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                <Globe className="h-3 w-3" /> Site <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <Button size="sm" onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4" /> Salvar como lead
        </Button>
      </div>
    </div>
  );
}
