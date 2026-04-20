#!/usr/bin/env bash
# share.sh — expõe o frontend local do LogIA via Cloudflare Tunnel
# Uso: ./share.sh

set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
WINDOWS_CLOUDFLARED_DEFAULT="/mnt/c/Users/diego/AppData/Local/Microsoft/WinGet/Packages/Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe/cloudflared.exe"

if command -v cloudflared >/dev/null 2>&1; then
  CLOUDFLARED_BIN="cloudflared"
elif command -v cloudflared.exe >/dev/null 2>&1; then
  CLOUDFLARED_BIN="cloudflared.exe"
elif [ -f "${WINDOWS_CLOUDFLARED_DEFAULT}" ]; then
  CLOUDFLARED_BIN="${WINDOWS_CLOUDFLARED_DEFAULT}"
else
  echo "[share] cloudflared não encontrado no PATH."
  echo "[share] Se você instalou via winget no Windows, rode novamente este script no WSL após confirmar o caminho do .exe."
  echo "[share] Instale o Cloudflare Tunnel e rode novamente:"
  echo "[share] https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  exit 1
fi

echo "[share] Abrindo túnel temporário para ${FRONTEND_URL}"
echo "[share] Compartilhe apenas a URL HTTPS gerada pelo cloudflared."
echo "[share] Mantenha o ./dev.sh rodando enquanto seus colegas testarem."

exec "${CLOUDFLARED_BIN}" tunnel --url "${FRONTEND_URL}"
