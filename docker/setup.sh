#!/usr/bin/env bash
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${CYAN}[info]${NC}  $*"; }
success() { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}  $*"; }
error()   { echo -e "${RED}[error]${NC} $*"; exit 1; }

# ── Pre-flight ────────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "Docker not found. Install Docker Desktop: https://docs.docker.com/get-docker/"
docker compose version >/dev/null 2>&1 || error "Docker Compose v2 not found. Update Docker Desktop."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Piped Self-Host Setup — TVApp      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Mode selection ────────────────────────────────────────────────────────────
echo "Choose setup mode:"
echo "  1) Local development  (localhost, no domain needed)"
echo "  2) Production server  (real domain + HTTPS via reverse proxy)"
echo ""
read -rp "Mode [1/2, default 1]: " MODE
MODE="${MODE:-1}"

if [[ "$MODE" == "2" ]]; then
  echo ""
  read -rp "API domain     (e.g. pipedapi.example.com): " API_DOMAIN
  read -rp "Frontend domain (e.g. piped.example.com):   " FRONTEND_DOMAIN
  read -rp "Proxy domain   (e.g. pipedproxy.example.com): " PROXY_DOMAIN
  read -rp "Use HTTPS? [Y/n]: " USE_HTTPS
  USE_HTTPS="${USE_HTTPS:-Y}"
  if [[ "${USE_HTTPS^^}" == "Y" ]]; then
    SCHEME="https"
  else
    SCHEME="http"
  fi

  info "Updating config.properties for production..."
  sed -i.bak \
    -e "s|API_URL:.*|API_URL: ${SCHEME}://${API_DOMAIN}|" \
    -e "s|FRONTEND_URL:.*|FRONTEND_URL: ${SCHEME}://${FRONTEND_DOMAIN}|" \
    -e "s|PROXY_PART:.*|PROXY_PART: ${SCHEME}://${PROXY_DOMAIN}|" \
    config/config.properties
  rm -f config/config.properties.bak
  success "config.properties updated"

  info "Updating docker-compose.yml for production..."
  sed -i.bak \
    -e "s|BACKEND_HOSTNAME: localhost:8081|BACKEND_HOSTNAME: ${API_DOMAIN}|" \
    -e "s|HTTP_MODE: http|HTTP_MODE: ${SCHEME}|" \
    docker-compose.yml
  rm -f docker-compose.yml.bak
  success "docker-compose.yml updated"

  echo ""
  warn "Production mode: you must put a reverse proxy (nginx / Caddy / Traefik) in front"
  warn "that terminates TLS and forwards to:"
  warn "  ${API_DOMAIN}      → localhost:8081"
  warn "  ${FRONTEND_DOMAIN}  → localhost:8080"
  warn "  ${PROXY_DOMAIN}    → localhost:8082"
else
  success "Using local dev defaults (API: http://localhost:8081)"
fi

# ── Ensure data dir exists ────────────────────────────────────────────────────
mkdir -p data/db
success "data/db directory ready"

# ── Pull images ───────────────────────────────────────────────────────────────
echo ""
info "Pulling Docker images (this may take a few minutes)..."
docker compose pull

# ── Start ─────────────────────────────────────────────────────────────────────
echo ""
info "Starting Piped stack..."
docker compose up -d

# ── Wait for backend ──────────────────────────────────────────────────────────
echo ""
info "Waiting for backend to become healthy..."
TRIES=0
until curl -sf http://localhost:8081/trending?region=US -o /dev/null; do
  TRIES=$((TRIES+1))
  if [[ $TRIES -ge 30 ]]; then
    warn "Backend not ready after 60s. Check logs: docker compose logs piped-backend"
    break
  fi
  printf "."
  sleep 2
done
echo ""

if curl -sf http://localhost:8081/trending?region=US -o /dev/null; then
  success "Backend is up and returning data!"
else
  warn "Backend may still be initialising — give it another minute."
fi

# ── Update web/.env.local ─────────────────────────────────────────────────────
ENV_FILE="$SCRIPT_DIR/../web/.env.local"
if [[ "$MODE" == "2" ]]; then
  API_URL="${SCHEME}://${API_DOMAIN}"
else
  API_URL="http://localhost:8081"
fi

echo "VITE_PIPED_API_URL=${API_URL}" > "$ENV_FILE"
success "Written: web/.env.local  →  VITE_PIPED_API_URL=${API_URL}"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Piped is running!                                   ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  Frontend  →  http://localhost:8090                  ║${NC}"
echo -e "${GREEN}║  API       →  http://localhost:8081                  ║${NC}"
echo -e "${GREEN}║  Proxy     →  http://localhost:8082                  ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  Start TV app:  cd ../web && npm run dev             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
