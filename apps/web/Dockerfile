# Stage 1: Install dependencies
FROM crpi-dgkl9khr1943eg60.cn-hangzhou.personal.cr.aliyuncs.com/hq-docker-mirror/node:20-alpine AS deps

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# Stage 2: Build application
FROM deps AS builder

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
RUN pnpm --filter web build

# Stage 3: Production (serve with nginx)
FROM crpi-dgkl9khr1943eg60.cn-hangzhou.personal.cr.aliyuncs.com/hq-docker-mirror/nginx:1.27-alpine AS production

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
