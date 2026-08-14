#!/bin/bash

# Script completo: Firestore Emulator + Docker

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

echo -e "\n${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Start Dev Environment (Emulator+Docker)║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Verificar dependências
if ! command -v firebase &> /dev/null; then
    error "Firebase CLI não encontrado"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    error "Docker não encontrado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não encontrado"
    exit 1
fi

success "Todas as dependências encontradas"

# Iniciar Firestore Emulator em background
info "Iniciando Firestore Emulator..."
firebase emulators:start --only firestore &
FIREBASE_PID=$!
sleep 3

# Verificar se emulator iniciou
if ! curl -s http://127.0.0.1:8080 > /dev/null 2>&1; then
    error "Firestore Emulator não iniciou corretamente"
    kill $FIREBASE_PID 2>/dev/null || true
    exit 1
fi

success "Firestore Emulator rodando em http://127.0.0.1:8080"

# Iniciar Docker
info "Iniciando containers Docker..."
docker-compose up --build

# Cleanup
warning "Parando Firestore Emulator..."
kill $FIREBASE_PID 2>/dev/null || true
