#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/onkopanel"
GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}→${NC} Yeni kod çekiliyor..."
git -C "$APP_DIR" pull origin main

echo -e "${BLUE}→${NC} Image'lar yeniden derleniyor..."
docker compose -f "$APP_DIR/docker-compose.yml" build api web

echo -e "${BLUE}→${NC} Servisler yeniden başlatılıyor..."
docker compose -f "$APP_DIR/docker-compose.yml" up -d --no-deps api web

sleep 5
if curl -sf "http://localhost/api/healthz" &>/dev/null; then
  echo -e "${GREEN}✓${NC} Güncelleme tamamlandı, API sağlıklı."
else
  echo "⚠ API henüz cevap vermiyor — 'docker compose logs api' ile kontrol et."
fi
