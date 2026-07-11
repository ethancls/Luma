FROM node:22-alpine AS base

# ── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache python3 make g++ build-base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Builder ──────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Runner ───────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/db ./db
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]
