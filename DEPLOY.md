# Deploying Termpilot

Only the **server** is deployed. The CLI runs on each user's machine (its tools read and
write that machine's files) and talks to the server over HTTPS.

## 1. What the server needs

Set these as environment variables on the host. Never copy your local `.env` to a host or
into an image (`.dockerignore` keeps it out).

| Variable | Notes |
|---|---|
| `HOST` | `0.0.0.0` (the Dockerfile sets it). Without it the server listens on localhost only. |
| `PORT` | Set by most hosts. Defaults to 3000. |
| `API_URL` | The public HTTPS address of this server, for example `https://termpilot.example.com`. Used for checkout and portal return links and for the Clerk redirect. |
| `DATABASE_URL` | Neon connection string. |
| `GOOGLE_GENERATIVE_AI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | At least one. The free Gemini tier is rate limited and will not handle real users. |
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` | The server refuses to start without them. |
| `POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_ID`, `POLAR_CREDITS_METER_ID`, `POLAR_SERVER` | `POLAR_SERVER=production` for real payments (needs a production Polar account, product, meter and token). |

## 2. Build and run

The `Dockerfile` builds a server-only image. Health check path: `/health`.

```bash
docker build -t termpilot-server .
docker run -p 3000:3000 --env-file <your-production-env-file> termpilot-server
```

On Render: New, Web Service, connect the repo, runtime **Docker**, health check path
`/health`, add the variables above. Use an instance type that stays on (replies stream for
up to several minutes).

## 3. Database

Run once per deploy that changes the schema (from your machine, with `DATABASE_URL` set to
the production database, or as the host's pre-deploy command):

```bash
cd packages/database && bunx prisma migrate deploy
```

## 4. Clerk

In the Clerk OAuth application, add the redirect URI
`<API_URL>/auth/callback` (for example `https://termpilot.example.com/auth/callback`). The
app must stay **Public** with **Require PKCE**. Use a Clerk *production* instance for real
users.

## 5. Point the CLI at the server

```bash
API_URL=https://termpilot.example.com termpilot
```

`bin/termpilot` also reads `API_URL`, `CLERK_FRONTEND_API` and `CLERK_OAUTH_CLIENT_ID` from
the repo's `.env`. A variable already set in the shell wins. Handing the CLI to other
people still needs packaging (npm or a single binary) and baked-in defaults, because the
bin script finds `.env` by its location in this repo.

## 6. Before real users

- HTTPS only. Login tokens travel as bearer headers.
- Put a spending limit on the model API key. The credit gate protects billing, not your key.
- Consider rate limiting `/chat` and `/sessions`.
- Known gaps from the tutorial: interrupted replies are not billed, and the `bash` tool and
  symlinks are not restricted to the project folder (this runs on the user's machine).
