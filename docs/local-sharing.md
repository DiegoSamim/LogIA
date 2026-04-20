# Compartilhar o LogIA local 

Este guia serve para expor temporariamente a instância local do LogIA para 1–2 devs testarem, sem fazer deploy em produção.

## Como funciona

- você sobe o projeto com `./dev.sh`
- o frontend roda em `http://localhost:5173`
- o Vite encaminha `/api` e `/files` para o backend em `http://localhost:8000`
- você publica somente a porta `5173` com Cloudflare Tunnel
- Outros acessam um único link HTTPS e usam o sistema normalmente

## Pré-requisitos

- projeto rodando localmente com `./dev.sh`
- `cloudflared` instalado

Instalação do `cloudflared`:

- documentação oficial: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

## Passo a passo

### 1. Suba o projeto

```bash
./dev.sh
```

Valide localmente:

- `http://localhost:5173`
- login
- refresh ao recarregar
- criação de usuário
- carregamento de `/files`

### 2. Abra o túnel

```bash
./share.sh
```

ou:

```bash
make share
```

O `cloudflared` vai mostrar uma URL pública HTTPS. Compartilhe apenas essa URL.

## Regras de uso

- não exponha diretamente a porta `8000`
- não abra IP/porta pública manualmente
- mantenha sua máquina ligada e conectada
- mantenha `./dev.sh` e `./share.sh` rodando durante os testes
- peça para cada colega criar sua própria conta

## Limites conhecidos

- esse ambiente depende da sua máquina local
- performance depende da sua internet e do seu computador
- uploads e banco continuam locais
- reiniciar backend ou encerrar o túnel derruba o acesso dos colegas
- isso é ambiente temporário de teste, não staging nem produção

## Encerrando

Quando terminar:

1. encerre o `cloudflared` com `Ctrl+C`
2. encerre o `dev.sh` com `Ctrl+C`
3. se quiser, remova usuários de teste depois
