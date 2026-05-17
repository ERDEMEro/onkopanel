#!/usr/bin/env bash
set -euo pipefail

DOMAIN="onko-panel.com"
REPO_URL=""
APP_DIR="$HOME/onkopanel"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}→${NC} $*"; }
success() { echo -e "${GREEN}✓${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠${NC} $*"; }
error()   { echo -e "${RED}✗${NC} $*"; exit 1; }

banner() {
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║     OnkoPanel — AWS Setup Script     ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
  echo ""
}

collect_secrets() {
  echo -e "${YELLOW}Ortam değişkenleri ayarlanıyor...${NC}"
  echo ""

  read -rp "  GitHub repo URL'si (https://github.com/...): " REPO_URL
  [[ -z "$REPO_URL" ]] && error "Repo URL gerekli."

  read -rsp "  PostgreSQL şifresi: " POSTGRES_PASSWORD; echo
  [[ -z "$POSTGRES_PASSWORD" ]] && error "PostgreSQL şifresi gerekli."

  SESSION_SECRET=$(openssl rand -hex 32)
  success "Session secret otomatik üretildi."

  read -rsp "  GROQ API Key (gsk_...): " GROQ_API_KEY; echo
  read -rsp "  Serper API Key: " SERPER_API_KEY; echo
  read -rsp "  Stripe Secret Key (sk_live_...): " STRIPE_SECRET_KEY; echo
  read -rsp "  Stripe Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET; echo
}

install_docker() {
  if command -v docker &>/dev/null; then
    success "Docker zaten kurulu: $(docker --version)"
    return
  fi
  info "Docker kuruluyor..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  success "Docker kuruldu."
}

install_certbot() {
  if command -v certbot &>/dev/null; then
    success "Certbot zaten kurulu."
    return
  fi
  info "Certbot kuruluyor..."
  sudo apt-get update -qq
  sudo apt-get install -y certbot
  success "Certbot kuruldu."
}

clone_repo() {
  if [[ -d "$APP_DIR/.git" ]]; then
    info "Repo zaten klonlanmış, güncelleniyor..."
    git -C "$APP_DIR" pull origin main
  else
    info "Repo klonlanıyor: $REPO_URL"
    git clone "$REPO_URL" "$APP_DIR"
  fi
  success "Kod hazır: $APP_DIR"
}

write_env() {
  info ".env dosyası oluşturuluyor..."
  cat > "$APP_DIR/.env" <<EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DATABASE_URL=postgresql://onkopanel:${POSTGRES_PASSWORD}@postgres:5432/onkopanel
SESSION_SECRET=${SESSION_SECRET}
GROQ_API_KEY=${GROQ_API_KEY}
SERPER_API_KEY=${SERPER_API_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
EOF
  chmod 600 "$APP_DIR/.env"
  success ".env dosyası yazıldı."
}

setup_ssl() {
  if [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
    success "SSL sertifikası zaten mevcut."
  else
    warn "SSL kurulumu için $DOMAIN → bu IP'ye DNS A kaydı eklenmiş olmalı."
    read -rp "  DNS kaydı eklendi mi? (e/h): " dns_ready
    if [[ "$dns_ready" =~ ^[Ee]$ ]]; then
      info "SSL sertifikası alınıyor..."
      sudo certbot certonly --standalone \
        -d "$DOMAIN" -d "www.$DOMAIN" \
        --non-interactive --agree-tos \
        -m "admin@$DOMAIN" || warn "SSL alınamadı — ilerle, sonra tekrar dene."
    else
      warn "SSL atlandı. Kurulumu tamamladıktan sonra 'sudo certbot certonly --standalone -d $DOMAIN' çalıştır."
    fi
  fi

  mkdir -p "$APP_DIR/deploy/ssl"
  if [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$APP_DIR/deploy/ssl/"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem"   "$APP_DIR/deploy/ssl/"
    sudo chown "$USER:$USER" "$APP_DIR/deploy/ssl/"*.pem
    success "SSL sertifikaları kopyalandı."

    # Nginx.conf'a HTTPS bloğu ekle
    SSL_CONF="$APP_DIR/artifacts/onkoloji-dashboard/nginx.conf"
    if ! grep -q "listen 443" "$SSL_CONF" 2>/dev/null; then
      cat >> "$SSL_CONF" <<'NGINXEOF'

server {
    listen 443 ssl http2;
    server_name onko-panel.com www.onko-panel.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/javascript;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://api:8080;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF
      success "nginx.conf HTTPS bloğu eklendi."
    fi

    # SSL sertifikası otomatik yenileme
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/*.pem $APP_DIR/deploy/ssl/ && docker compose -f $APP_DIR/docker-compose.yml restart web") | crontab -
    success "SSL otomatik yenileme ayarlandı."
  fi
}

build_and_start() {
  cd "$APP_DIR"
  info "Docker image'lar derleniyor (5-10 dk sürebilir)..."
  docker compose build

  info "Veritabanı başlatılıyor..."
  docker compose up -d postgres
  sleep 8

  info "Şema oluşturuluyor..."
  docker compose run --rm db-migrate 2>/dev/null || warn "Migrate adımı atlandı — manuel çalıştır."

  info "Tüm servisler başlatılıyor..."
  docker compose up -d

  sleep 5
  if curl -sf "http://localhost/api/healthz" &>/dev/null; then
    success "API sağlıklı çalışıyor."
  else
    warn "API henüz hazır değil — 'docker compose logs api' ile kontrol et."
  fi
}

print_summary() {
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║              Kurulum Tamamlandı!                 ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  HTTP  → ${BLUE}http://$DOMAIN${NC}"
  echo -e "  HTTPS → ${BLUE}https://$DOMAIN${NC}"
  echo ""
  echo -e "  Logları izle : ${YELLOW}docker compose -f $APP_DIR/docker-compose.yml logs -f${NC}"
  echo -e "  Durdur       : ${YELLOW}docker compose -f $APP_DIR/docker-compose.yml down${NC}"
  echo -e "  Güncelle     : ${YELLOW}bash $APP_DIR/deploy/update.sh${NC}"
  echo ""
  echo -e "  DNS A kaydını eklemeyi unutmayın:"
  echo -e "  ${YELLOW}$DOMAIN  →  $(curl -s ifconfig.me)${NC}"
  echo ""
}

main() {
  banner
  collect_secrets
  install_docker
  install_certbot
  clone_repo
  write_env
  setup_ssl
  build_and_start
  print_summary
}

main "$@"
