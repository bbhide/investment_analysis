# syntax=docker/dockerfile:1.7
# Build context = repo root.

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/calc/package.json packages/calc/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/shared packages/shared
COPY packages/calc packages/calc
COPY packages/web packages/web
RUN pnpm --filter @inv/shared build \
  && pnpm --filter @inv/calc build \
  && pnpm --filter @inv/web build

# Runtime: tiny nginx serving the SPA + proxying /api to the api container
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
