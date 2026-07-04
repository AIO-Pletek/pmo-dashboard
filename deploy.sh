#!/bin/bash
set -e

# ==============================================
# PMO Dashboard - Deployment Script (nginx mode)
# Run this ON the server (116.204.131.112)
# ==============================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "========================================"
echo " PMO Dashboard - Server Deployment"
echo "========================================"
echo -e "${NC}"

# ---- 1. Install Docker if not present ----
if ! command -v docker &>/dev/null; then
    echo -e "${YELLOW}[1/6] Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}[1/6] Docker already installed.${NC}"
fi

# ---- 2. Clone / pull repo ----
REPO_URL="https://github.com/AIO-Pletek/pmo-dashboard.git"
APP_DIR="/opt/pmo-dashboard"

echo -e "${YELLOW}[2/6] Setting up application at ${APP_DIR}...${NC}"

if [ -d "$APP_DIR/.git" ]; then
    echo "  Repository exists, pulling latest..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "  Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# ---- 3. Configure environment ----
echo -e "${YELLOW}[3/6] Configuring environment...${NC}"

if [ ! -f ".env" ]; then
    echo "  Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL=file:/app/db/custom.db
JWT_SECRET=pmo-dashboard-jwt-secret-key-2024-super-secure-random-string
ALLOWED_EMAIL_DOMAINS=company.com,example.com,test.com
APP_URL=http://116.204.131.112
EOF
    echo -e "${RED}  ⚠️  Edit .env with proper secrets before production!${NC}"
else
    echo "  .env already exists, skipping."
fi

# Generate random JWT secret
if grep -q "change-me-in-production" .env 2>/dev/null || grep -q "super-secure-random-string" .env 2>/dev/null; then
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    echo "  JWT_SECRET auto-generated."
fi

# ---- 4. Build & run with Docker Compose ----
echo -e "${YELLOW}[4/6] Building and starting Docker containers...${NC}"

docker compose down 2>/dev/null || true
docker compose up -d --build

echo -e "${GREEN}  Container started.${NC}"

# ---- 5. Configure nginx ----
echo -e "${YELLOW}[5/6] Configuring nginx reverse proxy...${NC}"

NGINX_CONF="/etc/nginx/sites-available/pmo-dashboard"
NGINX_ENABLED="/etc/nginx/sites-enabled/pmo-dashboard"
NGINX_DEFAULT="/etc/nginx/sites-enabled/default"

# Copy nginx config
cp nginx-pmo.conf "$NGINX_CONF"
echo "  Copied nginx config to ${NGINX_CONF}"

# Enable site
if [ ! -L "$NGINX_ENABLED" ]; then
    ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
    echo "  Site enabled."
fi

# Disable default site if it exists (conflicts with our config)
if [ -L "$NGINX_DEFAULT" ] || [ -f "$NGINX_DEFAULT" ]; then
    rm -f "$NGINX_DEFAULT"
    echo "  Default nginx site disabled."
fi

# Test & reload nginx
echo "  Testing nginx config..."
if nginx -t 2>&1; then
    systemctl reload nginx
    echo -e "${GREEN}  Nginx reloaded successfully.${NC}"
else
    echo -e "${RED}  ⚠️  Nginx config test failed. Check ${NGINX_CONF}${NC}"
fi

# ---- 6. Done ----
echo ""
echo -e "${GREEN}========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "  App URL:  http://116.204.131.112"
echo "  API:      http://116.204.131.112/api"
echo ""
echo "  Seed admin user:"
echo "    curl -X POST http://116.204.131.112/api/pmo-auth/seed"
echo "    Email: admin@company.com"
echo "    Pass:  admin123"
echo ""
echo "  View logs:"
echo "    cd ${APP_DIR} && docker compose logs -f"
echo ""
echo "  Restart after update:"
echo "    cd ${APP_DIR} && git pull && docker compose up -d --build"
echo "========================================"
echo -e "${NC}"
