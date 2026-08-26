export interface BrazilCity {
  id: number;
  nome: string;
}

export const BRAZIL_CITIES: Record<string, BrazilCity[]> = {
  SP: [
    { id: 355030, nome: "São Paulo" },
    { id: 354660, nome: "São José dos Campos" },
    { id: 355400, nome: "Taubaté" },
    { id: 350950, nome: "Campinas" },
    { id: 351900, nome: "São Bernardo do Campo" },
  ],
  RJ: [
    { id: 330455, nome: "Rio de Janeiro" },
    { id: 330330, nome: "Niterói" },
    { id: 330400, nome: "Petrópolis" },
  ],
  MG: [
    { id: 310620, nome: "Belo Horizonte" },
    { id: 310720, nome: "Uberlândia" },
    { id: 310340, nome: "Contagem" },
  ],
  RS: [
    { id: 431490, nome: "Porto Alegre" },
    { id: 431270, nome: "Caxias do Sul" },
  ],
  BA: [
    { id: 292740, nome: "Salvador" },
    { id: 292990, nome: "Feira de Santana" },
  ],
  PR: [
    { id: 410690, nome: "Curitiba" },
    { id: 411990, nome: "Londrina" },
  ],
  PE: [
    { id: 261160, nome: "Recife" },
    { id: 261380, nome: "Caruaru" },
  ],
  CE: [
    { id: 230540, nome: "Fortaleza" },
  ],
  PA: [
    { id: 150140, nome: "Belém" },
  ],
};
