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

echo "--- Servisler güncelleniyor (postgres + migrate + app) ---"
# tek seferlik migrate container'ı bayat kalırsa isim çakışması verir; önce temizle
docker compose -f docker-compose.prod.yml rm -fs migrate 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d

# nginx compose'da değil, host üzerinde çalışıyor (bkz. docker/nginx/default.conf).
# Uygulama 127.0.0.1:3000'e sabit yayınlandığı için upstream değişmez; yine de
# yeni sürümden sonra bağlantı havuzu tazelensin diye reload ediyoruz.
echo "--- host nginx reload ediliyor ---"
nginx -t && systemctl reload nginx

echo "--- Eski image temizliği ---"
docker image prune -f

echo "=== Dağıtım tamamlandı ==="
docker compose -f docker-compose.prod.yml ps
ENDSSH
