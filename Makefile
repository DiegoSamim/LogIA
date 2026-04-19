BACKEND  := Backend
FRONTEND := Frontend
VENV     := $(BACKEND)/.venv

.PHONY: dev db backend frontend stop db-down install help

## Inicia tudo: banco + backend + frontend
dev:
	@bash dev.sh

## Sobe apenas o banco (Docker)
db:
	docker compose -f $(BACKEND)/docker-compose.yml up -d

## Para e remove o container do banco
db-down:
	docker compose -f $(BACKEND)/docker-compose.yml down

## Inicia apenas o backend
backend:
	cd $(BACKEND) && source $(VENV)/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

## Inicia apenas o frontend
frontend:
	cd $(FRONTEND) && npm run dev

## Instala dependências (Python venv + npm)
install:
	python3 -m venv $(BACKEND)/.venv
	$(VENV)/bin/pip install -r $(BACKEND)/requirements.txt
	cd $(FRONTEND) && npm install

## Mostra essa ajuda
help:
	@grep -E '^##' Makefile | sed 's/## /  /'
