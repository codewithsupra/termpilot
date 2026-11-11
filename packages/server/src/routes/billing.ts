import { Hono } from "hono";
import type { AuthenticatedEnv } from "../middleware/require-auth";
import { createCheckoutUrl, createCustomerPortalUrl } from "../lib/polar";

// Behind a host's HTTPS proxy the server sees plain http, so the request URL would give a
// wrong scheme. API_URL (the public address of this server) wins when it is set.
const publicBaseUrl = (requestUrl: string) => process.env.API_URL ?? requestUrl;

const app = new Hono<AuthenticatedEnv>()
  .post("/checkout", async (c) => {
    const userId = c.get("userId");

    return c.json({
      url: await createCheckoutUrl({ customerExternalId: userId, requestUrl: publicBaseUrl(c.req.url) }),
    });
  })
  .post("/portal", async (c) => {
    const userId = c.get("userId");

    return c.json({
      url: await createCustomerPortalUrl({ customerExternalId: userId, requestUrl: publicBaseUrl(c.req.url) }),
    });
  })
  .get("/success", (c) => c.text("Done. You can close this tab and return to Termpilot."));

export default app;
