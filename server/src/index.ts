import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  IdentityError,
  resolveUser,
  unauthorizedResponse,
} from "./auth/identity";
import { SshSession } from "./do/ssh-session";
import { dashboardRoutes } from "./routes/dashboards";
import { meRoutes } from "./routes/me";
import { savedPasswordRoutes } from "./routes/saved-passwords";
import { savedPrivateKeyRoutes } from "./routes/saved-private-keys";
import { serverRoutes } from "./routes/servers";
import { sessionRoutes } from "./routes/sessions";
import type { Variables } from "./types";

export { SshSession };

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cf-Access-Jwt-Assertion"],
  }),
);

app.use("/api/*", async (c, next) => {
  try {
    const user = await resolveUser(c.req.raw, c.env);
    c.set("user", user);
    await next();
  } catch (error) {
    if (error instanceof IdentityError) {
      return unauthorizedResponse(error, true);
    }
    console.error("identity error", error);
    return c.json({ error: "Unauthorized" }, 401);
  }
});

app.get("/api/health", (c) => c.json({ ok: true }));

const v1 = new Hono<{ Bindings: Env; Variables: Variables }>();
v1.route("/me", meRoutes);
v1.route("/servers", serverRoutes);
v1.route("/saved-passwords", savedPasswordRoutes);
v1.route("/saved-private-keys", savedPrivateKeyRoutes);
v1.route("/dashboards", dashboardRoutes);
v1.route("/sessions", sessionRoutes);

app.route("/api/v1", v1);

app.all("*", async (c) => {
  try {
    await resolveUser(c.req.raw, c.env);
  } catch (error) {
    if (error instanceof IdentityError) {
      return unauthorizedResponse(error, false);
    }
    console.error("identity error", error);
    return new Response("Unauthorized", { status: 401 });
  }

  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
