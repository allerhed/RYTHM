# Multi-stage build for API
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build shared packages first
RUN npm run build --workspace=@rythm/shared
RUN npm run build --workspace=@rythm/db

# Build API
RUN npm run build --workspace=@rythm/api

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# Copy built application and maintain workspace structure
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/package.json ./package.json
COPY --from=builder --chown=apiuser:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=apiuser:nodejs /app/packages/db ./packages/db
COPY --from=deps --chown=apiuser:nodejs /app/node_modules ./node_modules

USER apiuser

EXPOSE 3001

ENV PORT 3001

CMD ["node", "dist/index.js"]