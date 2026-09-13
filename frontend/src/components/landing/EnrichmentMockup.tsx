import { Sparkles, CheckCircle, Mail, Phone, Globe, Instagram } from "lucide-react";

export function EnrichmentMockup() {
  return (
    <div className="flex-1 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
      <div className="border-b border-border bg-background/50 px-3 py-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Enriquecer empresa</p>
        <span className="flex items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-500">
          <Sparkles className="h-2.5 w-2.5" /> Auto
        </span>
      </div>
      <div className="space-y-2 p-3">
        <div className="rounded-md border border-border bg-background p-2.5">
          <p className="text-xs font-semibold">Padaria São José</p>
          <p className="text-[10px] text-muted-foreground">CNPJ: 12.345.678/0001-90</p>
        </div>
        {[
          { icon: Mail, label: "contato@padariasaojose.com.br", color: "text-amber-500", bg: "bg-amber-500/10" },
          { icon: Phone, label: "(12) 98765-4321", color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Globe, label: "padariasaojose.com.br", color: "text-purple-500", bg: "bg-purple-500/10" },
          { icon: Instagram, label: "@padariasaojose", color: "text-pink-500", bg: "bg-pink-500/10" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded border border-border bg-background px-2 py-1.5"
          >
            <div className={`grid h-6 w-6 place-items-center rounded-md ${item.bg}`}>
              <item.icon className={`h-3 w-3 ${item.color}`} />
            </div>
            <span className="text-xs flex-1 truncate">{item.label}</span>
            <div className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-3 w-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
