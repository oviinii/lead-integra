import { FastifyInstance } from "fastify";
import { BRAZIL_STATES } from "./data/states";

interface IbgeState {
  id: number;
  sigla: string;
  nome: string;
}

interface IbgeCity {
  id: number;
  nome: string;
}

export default async function locationsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { useCache?: string } }>("/states", async (req) => {
    // Prefer official IBGE API, fallback to local static list
    try {
      const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data: IbgeState[] = (await res.json()) as any;
        return data.map((s) => ({ sigla: s.sigla, nome: s.nome }));
      }
    } catch {
      // fallback to local
    }
    return BRAZIL_STATES;
  });

  app.get<{ Params: { state: string } }>("/cities/:state", async (req, reply) => {
    const state = req.params.state.toUpperCase();
    try {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!res.ok) throw new Error("IBGE unavailable");
      const data: IbgeCity[] = (await res.json()) as any;
      return data.slice(0, 200);
    } catch {
      return reply.code(502).send({ error: "Não foi possível carregar as cidades." });
    }
  });
}
