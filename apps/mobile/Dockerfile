# Multi-stage build for Mobile PWA
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build shared packages first
RUN npm run build --workspace=@rythm/shared

# Build mobile app
RUN npm run build --workspace=@rythm/mobile

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/mobile/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/mobile/.next/static ./apps/mobile/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/mobile/public ./apps/mobile/public

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/mobile/server.js"]