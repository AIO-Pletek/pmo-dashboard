#!/bin/bash
set -e

# ==============================================
# PMO Dashboard - Deployment Script
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
    echo -e "${YELLOW}[1/5] Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}[1/5] Docker already installed.${NC}"
fi

# ---- 2. Open firewall ports ----
echo -e "${YELLOW}[2/5] Configuring firewall...${NC}"

# UFW
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
    echo "  Opening port 6666 (UFW)..."
    ufw allow 6666/tcp 2>/dev/null || echo "  Port 6666 already allowed or need sudo"
fi

# iptables (fallback)
if command -v iptables &>/dev/null; then
    echo "  Opening port 6666 (iptables)..."
    iptables -A INPUT -p tcp --dport 6666 -j ACCEPT 2>/dev/null || true
    # Save rules
    if command -v netfilter-persistent &>/dev/null; then
        netfilter-persistent save 2>/dev/null || true
    elif command -v iptables-save &>/dev/null; then
        iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
    fi
fi

echo -e "${GREEN}  Firewall configured.${NC}"

# ---- 3. Clone / pull repo ----
REPO_URL="https://github.com/AIO-Pletek/pmo-dashboard.git"
APP_DIR="/opt/pmo-dashboard"

echo -e "${YELLOW}[3/5] Setting up application at ${APP_DIR}...${NC}"

if [ -d "$APP_DIR/.git" ]; then
    echo "  Repository exists, pulling latest..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "  Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# ---- 4. Configure environment ----
echo -e "${YELLOW}[4/5] Configuring environment...${NC}"

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "  Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL=file:/app/db/custom.db
JWT_SECRET=pmo-dashboard-jwt-secret-key-2024-super-secure-random-string
ALLOWED_EMAIL_DOMAINS=company.com,example.com,test.com
APP_URL=http://116.204.131.112:6666
EOF
    echo -e "${RED}  ⚠️  Edit .env with proper secrets before production!${NC}"
else
    echo "  .env already exists, skipping."
fi

# ---- 5. Build & run with Docker Compose ----
echo -e "${YELLOW}[5/5] Building and starting Docker containers...${NC}"

# Generate a random JWT secret if not set
if grep -q "change-me-in-production" .env 2>/dev/null || ! grep -q "JWT_SECRET" .env 2>/dev/null; then
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p)
    # Update docker-compose env or .env
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env 2>/dev/null || true
fi

docker compose down 2>/dev/null || true
docker compose up -d --build

echo ""
echo -e "${GREEN}========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "  App URL:  http://116.204.131.112:6666"
echo "  API:      http://116.204.131.112:6666/api"
echo ""
echo "  Seed admin user:"
echo "    curl -X POST http://116.204.131.112:6666/api/pmo-auth/seed"
echo "    Email: admin@company.com"
echo "    Pass:  admin123"
echo ""
echo "  View logs:"
echo "    cd ${APP_DIR} && docker compose logs -f"
echo ""
echo "  Restart:"
echo "    cd ${APP_DIR} && docker compose up -d --build"
echo "========================================"
echo -e "${NC}"
