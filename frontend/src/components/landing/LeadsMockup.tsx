import { CheckCircle, MessageCircle, Download, Building2, MapPin, Tag } from "lucide-react";

export function LeadsMockup() {
  return (
    <div className="flex-1 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
      <div className="border-b border-border bg-background/50 px-3 py-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Meus leads</p>
        <span className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          <Download className="h-2.5 w-2.5" /> CSV
        </span>
      </div>
      <div className="space-y-1.5 p-2">
        {[
          { name: "Padaria São José", city: "Taubaté", wa: true, category: "Alimentação" },
          { name: "Mercado Central", city: "Caçapava", wa: true, category: "Varejo" },
          { name: "Auto Posto Brasil", city: "Pindamonhangaba", wa: false, category: "Serviços" },
        ].map((lead) => (
          <div
            key={lead.name}
            className="flex items-center justify-between rounded border border-border bg-background px-2 py-1.5"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium truncate">{lead.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">{lead.category}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{lead.city}</p>
            </div>
            {lead.wa ? (
              <div className="flex items-center gap-1">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-green-500/10 text-green-500">
                  <MessageCircle className="h-3 w-3" />
                </div>
              </div>
            ) : (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                —
              </span>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground">3 prontos para vender</span>
          <div className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
