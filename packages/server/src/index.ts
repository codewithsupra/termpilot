import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { requireAuth } from "./middleware/require-auth";
import sessions from "./routes/sessions";
import chat from "./routes/chat";
import auth from "./routes/auth";
import billing from "./routes/billing";

const app = new Hono();

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({
      error: error.message || "Request failed",
    }, error.status);
  };

  console.error("Unhandled server error", error);
  return c.json({ error: "Internal server error" }, 500);
});

// Deployment: lets a host (or a load balancer) check that the server is up. No auth,
// no database access, nothing secret in the answer.
app.get("/health", (c) => c.json({ ok: true }));

app.use("/sessions/*", requireAuth);
app.use("/chat/*", requireAuth);
app.use("/billing/checkout", requireAuth);
app.use("/billing/portal", requireAuth);

const routes = app
  .route("/auth", auth)
  .route("/billing", billing)
  .route("/sessions", sessions)
  .route("/chat", chat);

export type AppType = typeof routes;
// idleTimeout must be high, otherwise LLM tool calls might not complete
//
// Deviation from the tutorial: by default the server only listens on localhost, so it is
// not reachable from other machines (Bun listens on every network interface by default).
// A deployment sets HOST=0.0.0.0 on purpose, and hosts such as Render set PORT.
const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST ?? "127.0.0.1";

export default { port, hostname, fetch: app.fetch, idleTimeout: 255 };
