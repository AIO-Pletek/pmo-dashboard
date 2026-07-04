#!/bin/sh
set -e

CADDY_PORT="${CADDY_PORT:-6666}"
CADDYFILE="/app/Caddyfile"

echo "========================================"
echo " PMO Dashboard - Docker Container"
echo "========================================"
echo " Caddy Port:  $CADDY_PORT"
echo " Next.js Port: ${PORT:-3000}"
echo " Database:    $DATABASE_URL"
echo "========================================"

# --- Database Setup ---
echo "[1/3] Setting up database..."
cd /app

if [ ! -f /app/db/custom.db ]; then
    echo "  Creating new database..."
    touch /app/db/custom.db
fi

echo "  Running prisma db push..."
cd /app && bunx prisma db push --skip-generate 2>&1 || echo "  Warning: db push had issues, continuing..."

echo "  Database ready."

# --- Caddyfile Port Configuration ---
echo "[2/3] Configuring Caddy on port $CADDY_PORT..."
# Replace the port in Caddyfile (first line ":81" → ":$CADDY_PORT")
sed -i "s/^:81 /:$CADDY_PORT /" "$CADDYFILE"
echo "  Caddyfile updated."

# --- Start Services ---
echo "[3/3] Starting services..."

# Start Next.js in background
cd /app/next-service-dist
bun server.js &
NEXT_PID=$!
echo "  Next.js started (PID: $NEXT_PID)"

# Wait for Next.js to be ready
echo "  Waiting for Next.js to be ready..."
for i in $(seq 1 30); do
    if curl -s http://localhost:${PORT:-3000}/api > /dev/null 2>&1; then
        echo "  Next.js is ready."
        break
    fi
    sleep 1
done

cd /app

# Start Caddy in foreground (handles SIGTERM properly)
echo ""
echo " Starting Caddy on port $CADDY_PORT..."
exec caddy run --config "$CADDYFILE" --adapter caddyfile
