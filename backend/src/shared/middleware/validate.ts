import { FastifyReply, FastifyRequest } from "fastify";
import { ZodSchema } from "zod";

/**
 * Generic Fastify preValidation handler that validates request body,
 * querystring, and params against a Zod schema. Replaces fastify-type-provider-zod
 * to keep deps minimal.
 */
export function validate<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const input: Record<string, unknown> = {};
    if (request.body !== undefined) input.body = request.body;
    if (request.query !== undefined) input.querystring = request.query;
    if (request.params !== undefined) input.params = request.params;
    const parsed = schema.parse(input);
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      if (obj.body !== undefined) (request as any).body = obj.body;
      if (obj.querystring !== undefined) (request as any).query = obj.querystring;
      if (obj.params !== undefined) (request as any).params = obj.params;
    }
  };
}
