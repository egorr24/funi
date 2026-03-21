FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Use the internal DATABASE_URL from your screenshot for the build step
ENV DATABASE_URL="postgresql://postgres:yZZwZLoTfylFhbuMzoHLBLUgvLYldBp@postgres.railway.internal:5432/railway"
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV AUTH_TRUST_HOST=true
# Use the public DATABASE_URL for runtime to be safe, or internal if within the same project
ENV DATABASE_URL="postgresql://postgres:yZZwZLoTfylFhbuMzoHLBLUgvLYldBp@autorack.proxy.rlwy.net:16454/railway"

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
# Run prisma db push on every start to ensure tables exist
CMD ["sh", "-c", "npx prisma db push && node server.js"]
