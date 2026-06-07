# Deployment Instructions

## Quick Deploy (Pull latest code)
```bash
cd /path/to/qontac-net-v2
git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Full Rebuild (If needed)
```bash
cd /path/to/qontac-net-v2
git pull origin main
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## Check Status
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f app
```

## After Deploy
1. Check https://qontac.net/
2. Verify sidebar shows "RECEP YILMAZ" (not "demo")
3. Verify profile page labels: "Ünvan / Kariyer" and "Takım"
4. Test kart URL copy/go buttons
