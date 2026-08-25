#!/data/data/com.termux/files/usr/bin/bash
# Aurora — Termux başlatıcı
# Kullanım: bash start.sh
cd "$(dirname "$0")" || exit 1

if [ ! -d dist ]; then
  echo "dist/ yok — önce: npm run build"
  exit 1
fi

# Ekran kapanınca sunucu ölmesin
command -v termux-wake-lock >/dev/null 2>&1 && termux-wake-lock

echo "Durdurmak için: Ctrl+C  |  wake-lock: termux-wake-unlock"
exec node server.mjs
