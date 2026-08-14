#!/bin/bash

# Script para fazer build e push das imagens Docker

set -e

REGISTRY="${1:-docker.io}"
NAMESPACE="${2:-meetsmobile}"
VERSION="${3:-latest}"

echo "╔════════════════════════════════════════╗"
echo "║  Meets Mobile - Docker Build & Push    ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Build Backend
echo "📦 Building Backend..."
docker build -t $REGISTRY/$NAMESPACE/backend:$VERSION \
  -t $REGISTRY/$NAMESPACE/backend:latest \
  ./snack/backend

# Build Frontend
echo "📦 Building Frontend..."
docker build -t $REGISTRY/$NAMESPACE/frontend:$VERSION \
  -t $REGISTRY/$NAMESPACE/frontend:latest \
  ./snack

# Push (opcional)
read -p "Deseja fazer push das imagens? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  echo "🚀 Pushing Backend..."
  docker push $REGISTRY/$NAMESPACE/backend:$VERSION
  docker push $REGISTRY/$NAMESPACE/backend:latest
  
  echo "🚀 Pushing Frontend..."
  docker push $REGISTRY/$NAMESPACE/frontend:$VERSION
  docker push $REGISTRY/$NAMESPACE/frontend:latest
  
  echo "✅ Push concluído!"
else
  echo "⏭️  Push cancelado. Imagens construídas localmente."
fi

echo ""
echo "✅ Build completo!"
echo ""
echo "Imagens criadas:"
docker images | grep $NAMESPACE
