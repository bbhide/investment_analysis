# syntax=docker/dockerfile:1.7
# Build context = repo root (monorepo), so paths are packages/api/...

FROM node:20-alpine AS base
RUN apk add --no-cache openssl libstdc++
RUN corepack enable
WORKDIR /app

# --- deps: install all workspace deps with lockfile fidelity ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/calc/package.json packages/calc/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile

# --- build: compile shared + calc + api ---
FROM deps AS build
COPY packages/shared packages/shared
COPY packages/calc packages/calc
COPY packages/api packages/api
RUN pnpm --filter @inv/api exec prisma generate \
  && pnpm --filter @inv/shared build \
  && pnpm --filter @inv/calc build \
  && pnpm --filter @inv/api build

# --- runtime: copy node_modules + dist directly from build stage ---
# Keeps it simple: we trust the build stage's lockfile-pinned install. Image
# is a bit bigger than a prod-only install would be, but image hygiene is fine
# for a single-tenant deployment and prisma CLI is available for migrations.
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl libstdc++
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Workspace manifests + lockfile (referenced by pnpm at runtime for filtered exec)
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=build /app/packages/shared/package.json packages/shared/
COPY --from=build /app/packages/calc/package.json packages/calc/
COPY --from=build /app/packages/api/package.json packages/api/
COPY --from=build /app/packages/web/package.json packages/web/

# node_modules (workspace + per-package)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/node_modules packages/shared/node_modules
COPY --from=build /app/packages/calc/node_modules packages/calc/node_modules
COPY --from=build /app/packages/api/node_modules packages/api/node_modules

# Compiled output + prisma schema (for migrate deploy)
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/calc/dist packages/calc/dist
COPY --from=build /app/packages/api/dist packages/api/dist
COPY --from=build /app/packages/api/prisma packages/api/prisma

# Point shared/calc package "main" to dist (they ship src-pointing manifests for dev)
RUN node -e "const fs=require('fs');for(const p of['packages/shared/package.json','packages/calc/package.json']){const j=JSON.parse(fs.readFileSync(p));j.main='./dist/index.js';j.types='./dist/index.d.ts';j.exports={'.':'./dist/index.js'};fs.writeFileSync(p,JSON.stringify(j,null,2));}"

EXPOSE 4000

CMD sh -c "pnpm --filter @inv/api exec prisma migrate deploy && node packages/api/dist/server.js"
