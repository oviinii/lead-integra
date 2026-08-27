import { Search, MapPin } from "lucide-react";

export function SearchMockup() {
  return (
    <div className="flex-1 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
      <div className="border-b border-border bg-background/50 px-3 py-2">
        <p className="text-xs text-muted-foreground">integraLead.com/search</p>
      </div>
      <div className="space-y-2 p-3">
        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs flex items-center gap-2">
          <Search className="h-3 w-3 text-muted-foreground" />
          <span>padarias em Taubaté</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-border bg-background px-2 py-1.5">
            <p className="text-[10px] uppercase text-muted-foreground">Cidade</p>
            <p className="font-medium">Taubaté</p>
          </div>
          <div className="rounded border border-border bg-background px-2 py-1.5">
            <p className="text-[10px] uppercase text-muted-foreground">Estado</p>
            <p className="font-medium">SP</p>
          </div>
        </div>
        <div className="rounded-md bg-primary/90 px-3 py-1.5 text-center text-xs font-medium text-primary-foreground">
          Buscar 50 empresas
        </div>
        <div className="space-y-1.5 pt-1">
          {[
            "Padaria São José",
            "Padaria Central",
            "Padaria Pão Quente",
            "Padaria do Bairro",
          ].map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded border border-border bg-background px-2 py-1.5"
            >
              <MapPin className="h-3 w-3 flex-shrink-0 text-primary" />
              <span className="text-xs">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
