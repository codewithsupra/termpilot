import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { requireAuth } from "./middleware/require-auth";
import sessions from "./routes/sessions";
import chat from "./routes/chat";
import auth from "./routes/auth";

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

app.use("/sessions/*", requireAuth);
app.use("/chat/*", requireAuth);

const routes = app
  .route("/auth", auth)
  .route("/sessions", sessions)
  .route("/chat", chat);

export type AppType = typeof routes;
// idleTimeout must be high, otherwise LLM tool calls might not complete
// Deviation from the tutorial: bind to localhost only. This server has no login,
// and from chapter 07 on it can run shell commands and write files for the model,
// so it must not be reachable from other machines (Bun listens on every network
// interface by default).
export default { port: 3000, hostname: "127.0.0.1", fetch: app.fetch, idleTimeout: 255 };
