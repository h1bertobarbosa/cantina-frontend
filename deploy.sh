#!/usr/bin/env bash
#
# Deploy do frontend: build da imagem, push para o Docker Hub,
# pull da imagem na VPS e update do service no Swarm.
#
# Uso: ./deploy.sh

set -euo pipefail

# Garante que o build rode a partir da raiz de cantina-frontend/
# (o contexto "." e o -f docker/Dockerfile dependem disso)
cd "$(dirname "$0")"

IMAGE="h1bertobarbosa/cantina-frontend:latest"
API_URL="https://cantina-backend.humbertoob.com.br"
VPS="root@95.111.232.237"
SERVICE="cantina-web_frontend"

echo "==> Build ($IMAGE, API: $API_URL)"
docker build -f docker/Dockerfile \
  --build-arg VUE_APP_BACKEND_BASE_URL="$API_URL" \
  -t "$IMAGE" .

echo "==> Push"
docker push "$IMAGE"

echo "==> Pull e update do service $SERVICE em $VPS"
ssh "$VPS" \
  "docker pull $IMAGE && \
   docker service update \
     --detach=false \
     --image $IMAGE \
     $SERVICE"

echo "==> Deploy concluido."
