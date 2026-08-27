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
          { icon: Mail, label: "contato@padariasaojose.com.br", color: "text-amber-500" },
          { icon: Phone, label: "(12) 98765-4321", color: "text-blue-500" },
          { icon: Globe, label: "padariasaojose.com.br", color: "text-purple-500" },
          { icon: Instagram, label: "@padariasaojose", color: "text-pink-500" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded border border-border bg-background px-2 py-1.5"
          >
            <item.icon className={`h-3 w-3 ${item.color}`} />
            <span className="text-xs flex-1 truncate">{item.label}</span>
            <CheckCircle className="h-3 w-3 text-green-500" />
          </div>
        ))}
      </div>
    </div>
  );
}
