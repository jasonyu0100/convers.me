FROM node:18-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json package-lock.json* ./

# Convert npm to pnpm format
RUN pnpm import

# Set up pnpm caching and install dependencies
# This improves build speed by using a persistent cache
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm in builder stage
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy source code with smart layer caching
COPY . .

# Set NODE_ENV to production during build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build application with optimization flags
RUN --mount=type=cache,target=/app/.next/cache \
    pnpm fly:build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Switch to non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app
USER nextjs

# Set up health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

EXPOSE 3000

# Next.js server
CMD ["node", "server.js"]
