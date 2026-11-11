# Termpilot server image. Only the server runs here; the CLI runs on each user's machine.
FROM oven/bun:1.4

WORKDIR /app
ENV NODE_ENV=production
# A deployment must be reachable from outside the container (the default is localhost only).
ENV HOST=0.0.0.0

COPY . .

# The server's postinstall runs "prisma generate", which only reads the schema. The URL
# below is a placeholder for the build step and is NOT used at runtime.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build bun install --frozen-lockfile \
 && chown -R bun:bun /app

USER bun
EXPOSE 3000
CMD ["bun", "run", "packages/server/src/index.ts"]
