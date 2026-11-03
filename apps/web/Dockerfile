# ============================================================
# FEKRA AI — Web (Next.js 14)
# Build context must be the REPOSITORY ROOT:
#   docker build -f apps/web/Dockerfile .
# The API base URL is resolved at RUNTIME from window.location,
# so the same image works on any server IP / domain.
# ============================================================
FROM node:20-bookworm-slim

WORKDIR /app

# Copy workspace manifests first (better layer caching)
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared-types/package.json packages/shared-types/

# Install workspace dependencies
RUN npm install --workspace=apps/web --include-workspace-root

# Copy source code
COPY packages/shared-types packages/shared-types
COPY apps/web apps/web

WORKDIR /app/apps/web

# Production build
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
