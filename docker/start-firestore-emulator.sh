#!/bin/bash

# Setup Firestore Emulator para desenvolvimento
# Este script instala e configura o Firestore Emulator localmente

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

echo -e "\n${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Setup Firestore Emulator              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Verificar se Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    warning "Firebase CLI não encontrado"
    read -p "Deseja instalar? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        info "Instalando Firebase CLI..."
        npm install -g firebase-tools
        success "Firebase CLI instalado!"
    else
        error "Firebase CLI é necessário. Abortando."
        exit 1
    fi
fi

# Verificar se está em um projeto Firebase
if [ ! -f "firebase.json" ] && [ ! -f "snack/backend/firebase.json" ]; then
    warning "firebase.json não encontrado"
    read -p "Deseja inicializar Firebase? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        info "Inicializando Firebase..."
        firebase init
    fi
fi

info "Iniciando Firestore Emulator..."
info "O emulator rodará em http://127.0.0.1:8080"
info ""
info "Em outro terminal, execute:"
echo -e "${YELLOW}  docker-compose up --build${NC}"
info ""
warning "CTRL+C para parar o emulator"
echo ""

firebase emulators:start --only firestore
