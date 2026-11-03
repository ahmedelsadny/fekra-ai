# ============================================================
# FEKRA AI — API (NestJS + Prisma)
# Build context must be the REPOSITORY ROOT:
#   docker build -f apps/api/Dockerfile .
# ============================================================
FROM node:20-bookworm-slim

WORKDIR /app

# Copy workspace manifests first (better layer caching)
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/

# Install workspace dependencies (api + shared-types)
RUN npm install --workspace=apps/api --include-workspace-root

# Copy source code
COPY packages/shared-types packages/shared-types
COPY apps/api apps/api

WORKDIR /app/apps/api

# Generate Prisma client & compile TypeScript
RUN npx prisma generate && npm run build

EXPOSE 4000

# Start sequence: sync schema (db push) → seed (idempotent) → run API
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx ts-node prisma/seed.ts && node dist/main"]
