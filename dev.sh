#!/usr/bin/env bash
# dev.sh — inicia todo o ambiente de desenvolvimento do LogIA
# Uso: ./dev.sh
# Para parar: Ctrl+C (encerra frontend e backend; o DB continua rodando)

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/Backend"
FRONTEND="$ROOT/Frontend"
VENV="$BACKEND/.venv"

# ── carrega nvm (necessário quando chamado via CMD/bat sem shell interativo) ──
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

# ── cores ──────────────────────────────────────────────────────────────
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

log() { echo -e "${CYAN}[dev]${RESET} $*"; }
ok()  { echo -e "${GREEN}[dev]${RESET} $*"; }
warn(){ echo -e "${YELLOW}[dev]${RESET} $*"; }

# ── 0. SSH + port proxy (atualiza IP do WSL no Windows a cada reinício) ─
sudo service ssh start 2>/dev/null || true
WSL_IP=$(hostname -I | awk '{print $1}')
powershell.exe -Command "netsh interface portproxy set v4tov4 listenport=2222 listenaddress=0.0.0.0 connectport=22 connectaddress=$WSL_IP" 2>/dev/null || true
ok "SSH ativo — WSL IP: $WSL_IP (porta 2222 → Windows)"

# ── 1. sobe o banco ─────────────────────────────────────────────────────
log "Subindo container do banco de dados..."
docker compose -f "$BACKEND/docker-compose.yml" up -d
ok "Banco rodando em localhost:5432"

# ── 2. migrações ────────────────────────────────────────────────────────
log "Aplicando migrações do banco..."
(
  cd "$BACKEND"
  source "$VENV/bin/activate"

  for attempt in {1..20}; do
    if alembic upgrade head >/tmp/logia-alembic.log 2>&1; then
      ok "Migrações aplicadas com sucesso"
      break
    fi

    if [ "$attempt" -eq 20 ]; then
      cat /tmp/logia-alembic.log
      echo
      warn "Não foi possível aplicar as migrações após várias tentativas."
      exit 1
    fi

    sleep 1
  done
)

# ── 3. backend ──────────────────────────────────────────────────────────
log "Iniciando backend FastAPI..."
(
  cd "$BACKEND"
  source "$VENV/bin/activate"
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!
ok "Backend PID $BACKEND_PID → http://localhost:8000"

# ── 4. frontend ─────────────────────────────────────────────────────────
log "Iniciando frontend Vite..."
(
  cd "$FRONTEND"
  npm run dev -- --host
) &
FRONTEND_PID=$!
ok "Frontend PID $FRONTEND_PID → http://localhost:5173"

# ── 4. aguarda Ctrl+C e desliga tudo ────────────────────────────────────
cleanup() {
  warn "Encerrando processos..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  warn "Para parar o banco: docker compose -f Backend/docker-compose.yml down"
  exit 0
}
trap cleanup INT TERM

ok "Ambiente rodando. Ctrl+C para encerrar backend + frontend."
wait
