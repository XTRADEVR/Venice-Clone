FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile=false
COPY . .
RUN pnpm --filter @v/api exec prisma generate && pnpm --filter @v/api build
WORKDIR /repo/apps/api
EXPOSE 8080
CMD ["node", "dist/index.js"]
