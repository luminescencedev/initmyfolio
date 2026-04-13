FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate --workspace=@initmyfolio/db
RUN npm run build --workspace=@initmyfolio/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
