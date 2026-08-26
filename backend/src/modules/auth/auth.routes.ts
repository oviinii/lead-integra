import { FastifyInstance } from "fastify";
import { authenticate } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.schema";
import {
  changePasswordHandler,
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
  resetPasswordHandler,
} from "./auth.service";

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/register", { preValidation: validate(registerSchema) }, async (req, reply) => {
    return registerHandler(app, req as any, reply);
  });

  app.post("/login", { preValidation: validate(loginSchema) }, async (req) => {
    return loginHandler(app, req as any);
  });

  app.post("/refresh", { preValidation: validate(refreshSchema) }, async (req) => {
    return refreshHandler(app, req as any);
  });

  app.post("/forgot-password", { preValidation: validate(forgotPasswordSchema) }, async (req) => {
    return forgotPasswordHandler(req as any);
  });

  app.post("/reset-password", { preValidation: validate(resetPasswordSchema) }, async (req) => {
    return resetPasswordHandler(req as any);
  });

  app.register(async (instance) => {
    instance.addHook("preHandler", authenticate);
    instance.get("/me", async (req) => meHandler(req));
    instance.post("/logout", async (req) => logoutHandler(req as any));
    instance.post(
      "/change-password",
      { preValidation: validate(changePasswordSchema) },
      async (req) => changePasswordHandler(req as any),
    );
  });
}
