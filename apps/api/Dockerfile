# Stage 1: Install dependencies
FROM crpi-dgkl9khr1943eg60.cn-hangzhou.personal.cr.aliyuncs.com/hq-docker-mirror/node:20-alpine AS deps

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# Stage 2: Build application
FROM deps AS builder

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
RUN pnpm --filter api build

# Stage 3: Create standalone deploy (flat node_modules, no pnpm symlinks)
FROM deps AS deployer

COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/shared ./packages/shared
RUN pnpm --filter api deploy --prod --legacy /app/standalone

# Stage 4: Production
FROM crpi-dgkl9khr1943eg60.cn-hangzhou.personal.cr.aliyuncs.com/hq-docker-mirror/node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=deployer /app/standalone/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "apps/api/dist/apps/api/src/main"]
