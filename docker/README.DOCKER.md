# Meets - Configuração Docker

Guia completo para rodar a aplicação com Docker e comunicação interna entre serviços.

## 📋 Requisitos

- Docker >= 20.10
- Docker Compose >= 2.0
- 4GB de RAM mínimo

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         Docker Network (Bridge)         │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │  Frontend    │  │     Backend      │ │
│  │ (Expo/Node)  │──│   (Express/Bun)  │ │
│  │ :8081        │  │    :3000         │ │
│  └──────────────┘  └──────────────────┘ │
│        │                    │           │
│        │                    ▼           │
│        │          ┌──────────────────┐  │
│        │          │ Firebase         │  │
│        └──────────│ Real ou Local    │  │
│                   │ :8080 (ext)      │  │
│                   └──────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Nota**: O Firestore Emulator roda **fora do Docker** em `localhost:8080` para evitar conflitos de imagem.
Se usar Firebase real, não precisa do emulator.

## 🚀 Como Usar

### 1. Iniciar todos os serviços

```bash
docker-compose up --build
```

Flags úteis:
- `-d`: Rodar em background
- `--build`: Recompilar imagens
- `-f docker-compose.yml`: Especificar arquivo (padrão)

### 2. Acompanhar logs

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f firestore-emulator
```

### 3. Acessar a aplicação

- **Frontend (Expo Web)**: http://localhost:8081
- **Backend (API)**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Firestore Emulator**: http://localhost:8080

### 4. Parar os serviços

```bash
docker-compose down

# Remover volumes também (limpar dados)
docker-compose down -v
```

## 🔌 Comunicação Interna

Os serviços se comunicam através da rede Docker usando nomes de serviço como hosts:

### Do Frontend para Backend:
```javascript
// URLs internas no Docker
const API_URL = 'http://backend:3000/api';

// URLs externas (localhost)
const API_URL = 'http://localhost:3000/api';
```

### Do Backend para Firestore:
```javascript
// Emulator no Docker
const FIRESTORE_HOST = 'firestore-emulator:8080';

// Local (dev)
const FIRESTORE_HOST = 'localhost:8080';
```

## 🔐 Variáveis de Ambiente

### `.env.docker` (raiz do projeto)
```bash
FIREBASE_PROJECT_ID=snack-local
FIRESTORE_EMULATOR_HOST=firestore-emulator:8080
BACKEND_URL=http://backend:3000
FRONTEND_URL=http://frontend:8081
NODE_ENV=production
```

### `snack/backend/.env.docker`
```bash
PORT=3000
NODE_ENV=production
FIREBASE_PROJECT_ID=snack-local
FIRESTORE_EMULATOR_HOST=firestore-emulator:8080
CORS_ORIGIN=http://frontend:8081
```

## 📝 Modificar para Firestore Real

Para usar credenciais reais do Firebase em produção:

1. Obter suas credenciais do Firebase Console (Service Account)
2. Codificar em base64:
   ```bash
   cat credentials.json | base64
   ```
3. Adicionar ao `.env.docker`:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_BASE64=<base64_aqui>
   FIRESTORE_EMULATOR_HOST=  # Deixar vazio
   ```
4. Reconstruir: `docker-compose up --build`

## 🛠️ Comandos Úteis

### Executar comando em um serviço
```bash
# No backend
docker-compose exec backend bun --version

# No frontend
docker-compose exec frontend npm --version
```

### Entrar em um container
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Ver recursos utilizados
```bash
docker stats
```

### Limpar tudo
```bash
docker-compose down -v
docker system prune -a
```

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Mudar porta no docker-compose.yml
# Exemplo: "8082:8081" ao invés de "8081:8081"
```

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs -f <serviço>

# Reconstruir
docker-compose up --build
```

### Firestore Emulator não conecta
```bash
# Verificar se porta 8080 está aberta
docker ps | grep firestore

# Restart do emulator
docker-compose restart firestore-emulator
```

### Frontend não acessa Backend
- Verificar se usar `http://backend:3000` dentro do Docker
- Verificar CORS_ORIGIN no backend
- Verificar se backend está rodando: `docker-compose logs backend`

## 📊 Estrutura de Volumes

```yaml
backend:
  volumes:
    - ./snack/backend/src:/app/src  # Live reload em desenvolvimento

frontend:
  volumes:
    - ./snack:/app                  # Hot reload do Expo
    - /app/node_modules             # Preservar node_modules do container
```

## 🎯 Próximos Passos

1. **Adicionar banco de dados**: PostgreSQL/MongoDB no compose
2. **Configurar CI/CD**: GitHub Actions para builds automáticos
3. **Setup de produção**: Usar nginx como reverse proxy
4. **Scaling**: Usar Kubernetes para múltiplas instâncias

## 📚 Recursos

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Expo Docker Guide](https://docs.expo.dev/guides/how-expo-works/)
