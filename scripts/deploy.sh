#!/bin/bash
# QONTAC.NET — Üretim dağıtım scripti (Next.js / Docker)
set -e

SERVER="root@157.180.121.96"
APP_DIR="/var/www/qontac"

echo "=== QONTAC.NET üretim dağıtımı ==="

ssh "$SERVER" bash -s <<'ENDSSH'
set -e
cd /var/www/qontac

echo "--- Son kod çekiliyor ---"
git fetch origin
git reset --hard origin/main

echo "--- .env.production kontrolü ---"
if [ ! -f .env.production ]; then
  echo "HATA: .env.production yok. .env.example'dan oluşturup doldurun." >&2
  exit 1
fi

echo "--- Image build ediliyor ---"
docker compose -f docker-compose.prod.yml build

echo "--- Servisler güncelleniyor ---"
docker compose -f docker-compose.prod.yml up -d

echo "--- Eski image temizliği ---"
docker image prune -f

echo "=== Dağıtım tamamlandı ==="
docker compose -f docker-compose.prod.yml ps
ENDSSH
