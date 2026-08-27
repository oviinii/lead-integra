import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Sparkles,
  MessageCircle,
  ListChecks,
  Tag,
  Download,
  Users,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Bot,
  ArrowRight,
  Menu,
  X,
  Filter,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { whatsappLink } from "@/lib/utils";
import { DashboardMockup } from "@/components/landing/DashboardMockup";
import { SearchMockup } from "@/components/landing/SearchMockup";
import { EnrichmentMockup } from "@/components/landing/EnrichmentMockup";
import { LeadsMockup } from "@/components/landing/LeadsMockup";

const FEATURES = [
  {
    icon: Search,
    title: "Busca de empresas em massa",
    description:
      "Encontre centenas de empresas por segmento, cidade, estado ou palavras-chave. Integração com OpenStreetMap (grátis) e providers pagos.",
  },
  {
    icon: Sparkles,
    title: "Enriquecimento automático",
    description:
      "Receba e-mail, telefone, site, Instagram, Facebook e razão social direto da BrasilAPI, ReceitaWS e Serpro.",
  },
  {
    icon: MessageCircle,
    title: "Verificação de WhatsApp",
    description:
      "Confirme em lote quais números possuem WhatsApp ativo via OpenWA. Clique e abra a conversa em um clique.",
  },
  {
    icon: ListChecks,
    title: "Listas inteligentes",
    description:
      "Organize leads em listas, exporte para CSV e acompanhe o status de cada negociação.",
  },
  {
    icon: Tag,
    title: "Tags e segmentação",
    description:
      "Classifique leads com tags personalizadas e filtre rapidamente o que importa.",
  },
  {
    icon: TrendingUp,
    title: "Dashboard com KPIs",
    description:
      "Acompanhe taxa de conversão, qualidade dos dados, créditos e evolução mensal em tempo real.",
  },
  {
    icon: Download,
    title: "Exportação CSV",
    description:
      "Baixe seus leads filtrados em CSV pronto para enviar ao CRM ou equipe de vendas.",
  },
  {
    icon: Shield,
    title: "Multi-workspace e multi-usuário",
    description:
      "Cada equipe tem seu workspace isolado, com papéis OWNER, ADMIN, MEMBER e VIEWER.",
  },
];

const PLANS = [
  {
    name: "500 créditos",
    price: "R$ 57",
    pricePerCredit: "R$ 0,114 / crédito",
    highlight: false,
    savings: null,
  },
  {
    name: "1.000 créditos",
    price: "R$ 97",
    pricePerCredit: "R$ 0,097 / crédito",
    highlight: true,
    savings: "Mais popular",
  },
  {
    name: "1.500 créditos",
    price: "R$ 147",
    pricePerCredit: "R$ 0,098 / crédito",
    highlight: false,
    savings: null,
  },
  {
    name: "Plano personalizado",
    price: "Sob consulta",
    pricePerCredit: "Compre quantos créditos quiser",
    highlight: false,
    savings: "Personalizado",
  },
];

const FAQ = [
  {
    q: "O que é um crédito?",
    a: "Cada crédito consome 1 unidade ao buscar ou enriquecer uma empresa. Verificações de WhatsApp em lote também deduzem 1 crédito por número verificado.",
  },
  {
    q: "Como faço para comprar créditos?",
    a: "Os créditos são vendidos manualmente. Entre em contato pelo WhatsApp (12) 99210-0377 e nossa equipe ativa o pacote no seu workspace.",
  },
  {
    q: "Os créditos expiram?",
    a: "Não. Os créditos ficam disponíveis no seu workspace até serem consumidos.",
  },
  {
    q: "Posso usar meu próprio provedor de dados?",
    a: "Sim! Você pode configurar COMPANY_PROVIDER_API_KEY e COMPANY_PROVIDER_BASE_URL para usar Google Places, Serpro ou outro provider de sua escolha.",
  },
  {
    q: "Tem contrato de fidelidade?",
    a: "Não. Você compra créditos avulsos conforme a demanda, sem fidelidade.",
  },
];

const STATS = [
  { value: "+50 mil", label: "empresas encontradas" },
  { value: "+30", label: "segmentos suportados" },
  { value: "97%", label: "precisão dos dados" },
  { value: "5 min", label: "para configurar" },
];

const CONTACT_WHATSAPP = "5512992100377";
const CONTACT_DISPLAY = "(12) 99210-0377";

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const waLink = whatsappLink(CONTACT_WHATSAPP) ?? `https://wa.me/${CONTACT_WHATSAPP}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "border-b border-border/60 bg-background/80 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold leading-none">Integra Lead</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Lead Generator SaaS
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollTo("features")} className="text-sm text-muted-foreground hover:text-foreground">
              Recursos
            </button>
            <button onClick={() => scrollTo("how")} className="text-sm text-muted-foreground hover:text-foreground">
              Como funciona
            </button>
            <button onClick={() => scrollTo("pricing")} className="text-sm text-muted-foreground hover:text-foreground">
              Planos
            </button>
            <button onClick={() => scrollTo("faq")} className="text-sm text-muted-foreground hover:text-foreground">
              FAQ
            </button>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">
                Começar grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              <button onClick={() => scrollTo("features")} className="rounded px-3 py-2 text-left text-sm hover:bg-accent">
                Recursos
              </button>
              <button onClick={() => scrollTo("how")} className="rounded px-3 py-2 text-left text-sm hover:bg-accent">
                Como funciona
              </button>
              <button onClick={() => scrollTo("pricing")} className="rounded px-3 py-2 text-left text-sm hover:bg-accent">
                Planos
              </button>
              <button onClick={() => scrollTo("faq")} className="rounded px-3 py-2 text-left text-sm hover:bg-accent">
                FAQ
              </button>
              <div className="mt-2 flex flex-col gap-2">
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="w-full">Começar grátis</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.18),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="mr-1 h-3 w-3" /> Plataforma 100% em português
              </Badge>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Encontre leads{" "}
                <span className="text-primary">verificados</span>{" "}
                com WhatsApp em minutos
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                O <strong>Integra Lead</strong> busca empresas, enriquece dados automaticamente
                e valida quais telefones têm WhatsApp ativo. Tudo em uma única plataforma.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Começar grátis
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <a href={waLink} target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <MessageCircle className="h-5 w-5" />
                    Falar com vendas
                  </Button>
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Sem cartão
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Setup em 5 min
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Suporte via WhatsApp
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-2xl" />
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border/60 bg-card/30 py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-primary sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Recursos
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tudo que você precisa para gerar leads B2B
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Busque, enriqueça, valide e exporte — sem trocar de ferramenta.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="border-border/60 bg-card/50 transition-colors hover:border-primary/40">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-4 text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{f.description}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-border/60 bg-card/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Como funciona
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Em 3 passos você tem leads prontos para vender
            </h2>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <SearchMockup />
              </div>
              <h3 className="text-xl font-semibold">Busque empresas</h3>
              <p className="mt-2 text-muted-foreground">
                Defina segmento, cidade, estado e a quantidade. Buscamos em segundos via
                OpenStreetMap, BrasilAPI ou seu provider preferido.
              </p>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <EnrichmentMockup />
              </div>
              <h3 className="text-xl font-semibold">Enriqueça os dados</h3>
              <p className="mt-2 text-muted-foreground">
                Em um clique, completamos telefone, e-mail, site, redes sociais e CNPJ de cada
                empresa automaticamente.
              </p>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <LeadsMockup />
              </div>
              <h3 className="text-xl font-semibold">Valide e venda</h3>
              <p className="mt-2 text-muted-foreground">
                Verifique quais números têm WhatsApp ativo, abra a conversa direto do sistema e
                exporte sua lista final em CSV.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCTIONALITIES DETAIL */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                Verificação WhatsApp
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Saiba exatamente quais números abrirão conversa
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Pare de discar para números que não existem. A verificação em lote testa cada
                telefone via OpenWA e marca apenas os que têm WhatsApp ativo.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Verificação em lote com 1 clique",
                  "Link direto para wa.me com número formatado",
                  "Badge visual para 'sem WhatsApp' confirmado",
                  "Histórico salvo no company",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold">Verificação WhatsApp</h4>
                <Badge variant="success" className="text-xs">
                  <CheckCircle className="h-3 w-3" /> OpenWA online
                </Badge>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Padaria São José", phone: "(12) 98765-4321", wa: true },
                  { name: "Mercado Central", phone: "(12) 99876-5432", wa: true },
                  { name: "Auto Posto Brasil", phone: "(12) 97654-3210", wa: false },
                  { name: "Farmácia Vida", phone: "(12) 91234-5678", wa: true },
                ].map((lead) => (
                  <div
                    key={lead.name}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </div>
                    {lead.wa ? (
                      <a
                        href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-green-500 hover:underline"
                      >
                        <CheckCircle className="h-3 w-3" />
                        {lead.phone}
                      </a>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <XCircle className="h-3 w-3 text-red-500" /> Sem WhatsApp
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-y border-border/60 bg-card/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Planos
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Créditos avulsos, sem fidelidade
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Compre apenas o que precisa. Quanto mais créditos, menor o valor por unidade.
            </p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlight
                    ? "relative border-primary/50 bg-card shadow-xl shadow-primary/10"
                    : "border-border/60 bg-card"
                }
              >
                {plan.savings && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default">{plan.savings}</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.pricePerCredit}</p>

                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 block"
                  >
                    <Button
                      className="w-full"
                      variant={plan.highlight ? "default" : "outline"}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Comprar
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">
              Precisa de um volume diferente?
            </h3>
            <p className="mt-2 text-muted-foreground">
              Entre em contato e monte um plano personalizado com a quantidade de créditos
              que sua operação precisa.
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block"
            >
              <Button>
                <MessageCircle className="h-4 w-4" />
                Falar com a equipe
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              Perguntas frequentes
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Dúvidas comuns</h2>
          </div>

          <div className="mt-12 space-y-3">
            {FAQ.map((item, i) => (
              <div
                key={item.q}
                className="rounded-lg border border-border bg-card"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-medium">{item.q}</span>
                  <span
                    className={`text-2xl text-primary transition-transform ${
                      openFaq === i ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-6 py-4 text-muted-foreground">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-y border-border/60 bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para encontrar leads que vendem?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Crie sua conta grátis em segundos. Sem cartão de crédito.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button size="lg">
                Criar conta grátis
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href={waLink} target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline">
                <MessageCircle className="h-5 w-5" />
                Comprar créditos
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="h-5 w-5" />
                </div>
                <p className="text-base font-bold">Integra Lead</p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Plataforma de geração de leads B2B com verificação de WhatsApp e enriquecimento
                automático.
              </p>
            </div>

            <div>
              <h4 className="font-semibold">Produto</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollTo("features")} className="hover:text-foreground">Recursos</button></li>
                <li><button onClick={() => scrollTo("how")} className="hover:text-foreground">Como funciona</button></li>
                <li><button onClick={() => scrollTo("pricing")} className="hover:text-foreground">Planos</button></li>
                <li><button onClick={() => scrollTo("faq")} className="hover:text-foreground">FAQ</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Conta</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground">Entrar</Link></li>
                <li><Link to="/register" className="hover:text-foreground">Criar conta</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Contato</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href={waLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp: {CONTACT_DISPLAY}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  contato@integraLead.com
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 text-sm text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} Integra Lead. Todos os direitos reservados.</p>
            <p>CNPJ XX.XXX.XXX/0001-XX</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
