# Termpilot

An AI coding agent that lives in your terminal. You chat with a model, and it can read your project, search it, edit files and run commands, on your machine, while you watch.

Built with Bun, TypeScript, React in the terminal ([OpenTUI](https://github.com/sst/opentui)), a [Hono](https://hono.dev) server, Prisma on Postgres (Neon), the [AI SDK](https://ai-sdk.dev), Clerk sign-in and Polar billing.

> **Credit.** This project was built by following Code with Antonio's tutorial, [code-with-antonio/nightcode](https://github.com/code-with-antonio/nightcode), chapter by chapter. The architecture and most of the code come from that tutorial. It is not an original design, and I'm not affiliated with the tutorial's author. What I added or changed is listed under [What I changed](#what-i-changed).

## What it looks like

The start screen, captured from the real app's terminal output:

```text
                    ▀█▀ █▀▀ █▀█ █▀▄▀█ █▀█ █ █   █▀█ ▀█▀
                     █  ██▄ █▀▄ █ ▀ █ █▀▀ █ █▄▄ █▄█  █
┃
┃  Ask anything... "Fix a bug in the database"
┃
┃  Build › gemini-3.6-flash
┃
                                                                tab agents
```

## What it does

- **Two modes.** `Build` can read, write, edit files and run shell commands. `Plan` is read-only: it can read, list, glob and grep, but not change anything. Switch with <kbd>Tab</kbd>.
- **Tools run on your machine.** The server only sends the model's tool calls to the CLI. The CLI runs them in the folder where you started it, then sends the result back.
- **Streaming replies** with the model's reasoning and every tool call shown as it happens.
- **Models:** Claude, OpenAI and Gemini (the default is `gemini-3.6-flash`, which works on Google's free tier). On the free tier each Gemini model allows only 20 requests a day, so when one runs out the server automatically tries another.
- **Accounts and billing.** Browser sign-in (Clerk OAuth with PKCE), per-user sessions, and a credits system on Polar. Each request is converted to credits and reported as usage, and new work is blocked when the balance reaches zero.
- **`@file` mentions**, a session browser, themes, and slash commands: `/new`, `/agents`, `/models`, `/sessions`, `/theme`, `/login`, `/logout`, `/upgrade`, `/usage`, `/exit`.

## How it works

```
 terminal (CLI)                         server (Hono)                    services
┌────────────────────┐   HTTPS/SSE    ┌──────────────────────┐        ┌──────────────┐
│ React UI (OpenTUI) │ ─────────────▶ │ /chat   streams the  │ ─────▶ │ Claude /     │
│ local tools:       │                │         model reply  │        │ OpenAI /     │
│  read, list, glob, │ ◀───────────── │ /sessions            │        │ Gemini       │
│  grep, write, edit,│  tool calls    │ /billing  /auth      │ ─────▶ │ Neon (DB)    │
│  bash              │                └──────────────────────┘ ─────▶ │ Clerk, Polar │
└────────────────────┘
        ▲ runs the tool, sends the result back and the model continues
```

Monorepo (`bun` workspaces):

| Package | Role |
|---|---|
| `packages/cli` | The terminal app, local tool execution, and the `termpilot` command |
| `packages/server` | Hono API: chat streaming, sessions, auth check, billing |
| `packages/shared` | Tool schemas, modes and the model list, shared by both sides |
| `packages/database` | Prisma schema and client |

## Run it locally

You need [Bun](https://bun.sh), a Postgres database (a free [Neon](https://neon.tech) one works), a [Clerk](https://clerk.com) OAuth application, a [Polar](https://polar.sh) sandbox account, and at least one model API key (a free Gemini key is enough).

1. Install and configure:

   ```sh
   bun install
   cp .env.example .env     # then fill in the values
   cd packages/database && bunx prisma migrate deploy && cd ../..
   ```

   In Clerk, create an OAuth application that is **Public** with **Require PKCE**, and add the redirect URI `http://localhost:3000/auth/callback`. In Polar, create a product with a Meter Credits benefit, and a meter whose filter is the event name `termpilot_usage` (or the name you set in `POLAR_USAGE_EVENT_NAME`), aggregated as the **sum** of the `credits` property.

2. Start the server and the CLI in two terminals:

   ```sh
   bun run dev:server
   bun run dev:cli
   ```

3. Optional, to get a `termpilot` command that works in any folder:

   ```sh
   bun run link:cli
   ```

Then type `/login` in the app, open a project folder, and ask it something.

## Security notes

- The tools run **on your computer with your permissions**. Read what the model proposes, and use `Plan` mode when you only want it to look.
- File tools refuse paths outside the folder you started in. **`bash` and symlinks are not restricted**, so a command can still reach other files.
- The CLI never receives the server's secrets: the launcher loads only three public values, and the `bash` tool removes server-only variables (database, provider keys, Clerk and Polar secrets) from every command it runs.
- The server listens on `127.0.0.1` unless `HOST` is set. Secrets live only in `.env`, which is git-ignored.

## What I changed

Beyond following the tutorial, each as a separate commit:

- Added **Gemini** as a third provider and made it the default, so the project runs without paid API keys.
- Fixed the tutorial's project-folder check, which let sibling folders through.
- Made the server listen on localhost only by default.
- **Gemini fallback:** if the chosen Gemini model is out of quota or overloaded before it starts answering, the server tries the next model (with unit tests).
- **Billing fixes:** replies without tool calls were stored with an empty message id (so later usage events were dropped as duplicates), and requests that ended in a tool call were never billed.
- **Keeping secrets out of the CLI:** see the security notes above.
- **Deployment preparation:** configurable `HOST` and `PORT`, a `/health` endpoint, a Dockerfile and [DEPLOY.md](DEPLOY.md).
- Renamed the project, so it is not confused with the tutorial's own.

## Status

- Built and checked: typechecking, the tool round trip with a scripted fake model, the terminal UI in a pseudo-terminal, sign-in, and billing against the Polar sandbox.
- **Not yet verified:** the client-side tool loop against the real Gemini API (the free quota ran out while testing), and `docker build` on a machine with Docker running.
- Known gaps: Gemini fallback models can be slow on free keys (a reply took about 3 minutes in one test); an interrupted reply (<kbd>Esc</kbd>) is not billed; the "no credits" error appears as raw JSON; there is no automated test suite yet.
- It has not been deployed. See [DEPLOY.md](DEPLOY.md) for what that needs.

## License

No license has been chosen yet, so by default all rights are reserved. The code that comes from the tutorial belongs to its author.
