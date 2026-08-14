.PHONY: help docker-up docker-down docker-logs docker-bash-backend docker-bash-frontend docker-build docker-clean emulator emulator-start emulator-stop dev dev-stop

# Colors
BLUE=\033[0;34m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m

help: ## Mostrar este menu
	@echo "$(BLUE)╔════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║  Meets Mobile - Make Commands          ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker Commands:$(NC)"
	@echo "  make docker-up          - Iniciar todos os serviços"
	@echo "  make docker-down        - Parar todos os serviços"
	@echo "  make docker-logs        - Ver logs (todos)"
	@echo "  make docker-logs-be     - Ver logs do backend"
	@echo "  make docker-logs-fe     - Ver logs do frontend"
	@echo "  make docker-bash-be     - Shell do backend"
	@echo "  make docker-bash-fe     - Shell do frontend"
	@echo "  make docker-build       - Reconstruir imagens"
	@echo "  make docker-clean       - Remover tudo (volumes + containers)"
	@echo "  make docker-ps          - Status dos containers"
	@echo ""
	@echo "$(YELLOW)Firestore Emulator:$(NC)"
	@echo "  make emulator           - Iniciar Firestore Emulator"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make dev                - Iniciar tudo (Emulator + Docker)"
	@echo "  make dev-stop           - Parar tudo"
	@echo ""
	@echo "$(YELLOW)Utilities:$(NC)"
	@echo "  make help               - Mostrar este menu"
	@echo ""

# Docker commands
docker-up: ## Iniciar containers
	@echo "$(GREEN)▶ Iniciando containers...$(NC)"
	docker-compose up --build

docker-down: ## Parar containers
	@echo "$(GREEN)⏹ Parando containers...$(NC)"
	docker-compose down

docker-logs: ## Ver todos os logs
	docker-compose logs -f

docker-logs-be: ## Ver logs do backend
	docker-compose logs -f backend

docker-logs-fe: ## Ver logs do frontend
	docker-compose logs -f frontend

docker-bash-be: ## Entrar no backend
	docker-compose exec backend sh

docker-bash-fe: ## Entrar no frontend
	docker-compose exec frontend sh

docker-build: ## Reconstruir imagens
	@echo "$(GREEN)📦 Reconstruindo imagens...$(NC)"
	docker-compose up --build -d

docker-clean: ## Limpar tudo
	@echo "$(YELLOW)⚠ Removendo containers, volumes e networks...$(NC)"
	docker-compose down -v

docker-ps: ## Status dos containers
	docker ps -a | grep meets || echo "Nenhum container rodando"

# Firestore Emulator
emulator: ## Iniciar Firestore Emulator
	@echo "$(GREEN)🔥 Iniciando Firestore Emulator...$(NC)"
	firebase emulators:start --only firestore

# Development
dev: ## Iniciar ambiente completo (Emulator + Docker)
	@echo "$(GREEN)🚀 Iniciando ambiente de desenvolvimento...$(NC)"
	@echo "$(YELLOW)Terminal 1: Firestore Emulator$(NC)"
	@echo "$(YELLOW)Terminal 2: Docker Containers$(NC)"
	@echo ""
	bash start-dev-full.sh

dev-stop: ## Parar ambiente completo
	@echo "$(GREEN)⏹ Parando ambiente...$(NC)"
	docker-compose down
	pkill -f firebase || true

# Info
.PHONY: info
info: ## Informações do projeto
	@echo "$(BLUE)╔════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║  Meets Mobile - Project Info          ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "Frontend:  http://localhost:8081"
	@echo "Backend:   http://localhost:3000"
	@echo "Firestore: http://localhost:8080"
	@echo ""
	@echo "Docs:"
	@echo "  - QUICK-START.md"
	@echo "  - README.DOCKER.md"
	@echo "  - DOCKER-COMMUNICATION.md"
	@echo "  - FIRESTORE-OPTIONS.md"
	@echo ""

# Setup
.PHONY: setup
setup: ## Setup inicial (instalar dependências)
	@echo "$(GREEN)⚙ Executando setup inicial...$(NC)"
	npm install -g firebase-tools
	chmod +x *.sh
	@echo "$(GREEN)✅ Setup completo!$(NC)"
	@echo "$(YELLOW)Próximo passo: make info$(NC)"
