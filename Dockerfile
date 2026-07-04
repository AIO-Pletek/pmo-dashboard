# Stage 1: Build
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Build Next.js (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Stage 2: Run
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Install Caddy + curl (for health check)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=amd64" -o /usr/local/bin/caddy && \
    chmod +x /usr/local/bin/caddy && \
    rm -rf /var/lib/apt/lists/*

# Copy standalone Next.js build
COPY --from=builder /app/.next/standalone /app/next-service-dist

# Copy node_modules (needed for prisma db push on startup)
COPY --from=builder /app/node_modules /app/node_modules

# Copy prisma schema
COPY --from=builder /app/prisma /app/prisma

# Copy Caddyfile and entrypoint
COPY Caddyfile /app/Caddyfile
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create directories for database and uploads
RUN mkdir -p /app/db /app/public/uploads

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV CADDY_PORT=6666
ENV DATABASE_URL=file:/app/db/custom.db

EXPOSE 6666

ENTRYPOINT ["/app/docker-entrypoint.sh"]
