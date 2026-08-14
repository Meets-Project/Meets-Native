#!/bin/bash

# Meets - Docker Helper Script
# Facilita o uso do Docker e Docker Compose

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de output
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

# Menu principal
show_menu() {
    echo -e "\n${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Meets - Docker Helper                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"
    echo "1) Iniciar todos os serviços"
    echo "2) Parar todos os serviços"
    echo "3) Ver logs (todos)"
    echo "4) Ver logs (backend)"
    echo "5) Ver logs (frontend)"
    echo "6) Entrar no backend (shell)"
    echo "7) Entrar no frontend (shell)"
    echo "8) Reconstruir imagens"
    echo "9) Status dos containers"
    echo "10) Limpar tudo (volumes + containers)"
    echo "0) Sair"
    echo ""
}

# Executar ação
case "${1:-}" in
    start)
        info "Iniciando serviços..."
        docker-compose up --build
        ;;
    stop)
        info "Parando serviços..."
        docker-compose down
        success "Serviços parados"
        ;;
    logs)
        docker-compose logs -f "${2:-}"
        ;;
    logs-backend)
        info "Logs do Backend:"
        docker-compose logs -f backend
        ;;
    logs-frontend)
        info "Logs do Frontend:"
        docker-compose logs -f frontend
        ;;
    bash-backend)
        info "Entrando no Backend (shell)..."
        docker-compose exec backend sh
        ;;
    bash-frontend)
        info "Entrando no Frontend (shell)..."
        docker-compose exec frontend sh
        ;;
    rebuild)
        info "Reconstruindo imagens..."
        docker-compose up --build -d
        success "Imagens reconstruídas e serviços iniciados"
        ;;
    status)
        info "Status dos containers:"
        docker ps -a | grep meets
        ;;
    clean)
        warning "Removendo tudo (containers, volumes, networks)..."
        read -p "Tem certeza? (s/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            docker-compose down -v
            success "Tudo limpo"
        else
            warning "Cancelado"
        fi
        ;;
    *)
        show_menu
        read -p "Escolha uma opção: " choice
        case $choice in
            1) docker-compose up --build ;;
            2) docker-compose down && success "Serviços parados" ;;
            3) docker-compose logs -f ;;
            4) docker-compose logs -f backend ;;
            5) docker-compose logs -f frontend ;;
            6) docker-compose exec backend sh ;;
            7) docker-compose exec frontend sh ;;
            8) docker-compose up --build -d && success "Imagens reconstruídas" ;;
            9) docker ps -a | grep meets ;;
            10) docker-compose down -v && success "Tudo limpo" ;;
            0) exit 0 ;;
            *) error "Opção inválida" ;;
        esac
        ;;
esac
