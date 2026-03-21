FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time dummy DB URL to allow Next.js build
ENV DATABASE_URL="postgresql://postgres:yZZwZLoTfylFhbuMzoHLBLUgvLYldBp@postgres.railway.internal:5432/railway"
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV AUTH_TRUST_HOST=true
# Use credentials from your latest screenshot
ENV DATABASE_URL="postgresql://postgres:yZZwZLoTfylFhbuMzoHLBLUgvLYldBp@autorack.proxy.rlwy.net:16454/railway"
ENV NEXTAUTH_SECRET="7823457892345789234578923457892345"
ENV NEXTAUTH_URL="https://funi-production.up.railway.app"

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/models ./models
COPY --from=builder /app/routes ./routes

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push || true && node server.js"]
