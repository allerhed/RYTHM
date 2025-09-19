# Production Dockerfile for Admin App
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files for dev dependencies
COPY package.json package-lock.json* ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/

# Install all dependencies (including dev dependencies for TypeScript)
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io

# Build shared packages first
RUN npm run build --workspace=@rythm/shared
RUN npm run build --workspace=@rythm/db

# Build the admin app
RUN npm run build --workspace=@rythm/admin

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public

USER nextjs

EXPOSE 3002

ENV PORT=3002

CMD ["node", "apps/admin/server.js"]