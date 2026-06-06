# Build context is the repo ROOT. Multi-stage: build the Vite bundle, then serve the
# static files with nginx (which also proxies /api to the backend container).
FROM node:22-alpine AS build
RUN npm i -g pnpm@latest
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --frozen-lockfile --filter @invoice/frontend...

COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
RUN pnpm --filter @invoice/frontend build

FROM nginx:alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
