import { CheckCircle, MessageCircle, Download } from "lucide-react";

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
          { name: "Padaria São José", city: "Taubaté", wa: true },
          { name: "Mercado Central", city: "Caçapava", wa: true },
          { name: "Auto Posto Brasil", city: "Pindamonhangaba", wa: false },
        ].map((lead) => (
          <div
            key={lead.name}
            className="flex items-center justify-between rounded border border-border bg-background px-2 py-1.5"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{lead.name}</p>
              <p className="text-[10px] text-muted-foreground">{lead.city}</p>
            </div>
            {lead.wa ? (
              <MessageCircle className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                —
              </span>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground">3 prontos para vender</span>
          <CheckCircle className="h-3 w-3 text-green-500" />
        </div>
      </div>
    </div>
  );
}
