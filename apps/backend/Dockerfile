# Build context is the repo ROOT (see docker-compose.yml) so the pnpm workspace and the
# @invoice/shared package resolve. The API runs via tsx — no separate compile step, and
# the shared TypeScript package is consumed directly.
FROM node:22-alpine
RUN npm i -g pnpm@latest
WORKDIR /app

# Copy every manifest first (so --frozen-lockfile can validate the full workspace) and
# install only the backend + its dependencies. Cached unless a manifest changes.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --frozen-lockfile --filter @invoice/backend...

# Source
COPY packages/shared packages/shared
COPY apps/backend apps/backend
COPY seed-data.json ./

EXPOSE 5050
CMD ["pnpm", "--filter", "@invoice/backend", "exec", "tsx", "src/server.ts"]
