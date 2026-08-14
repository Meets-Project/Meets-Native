# Comunicação Interna - Docker Network

Guia para comunicação entre serviços no Docker.

## 🔌 Rede Docker

Os serviços se comunicam através da rede `meets_network` (bridge network).

### Serviços Disponíveis:
- **backend**: Express API na porta 3000
- **frontend**: Expo na porta 8081
- **firestore-emulator**: Firestore Emulator na porta 8080

## 📡 URLs Internas

### Do Frontend para Backend
```javascript
// Dentro do Docker (container para container)
const INTERNAL_API = 'http://backend:3000/api';

// Localhost (desenvolvimento local)
const LOCAL_API = 'http://localhost:3000/api';

// Production (usar variável de ambiente)
const API_URL = process.env.REACT_APP_API_URL || 'http://backend:3000/api';
```

### Do Backend para Firestore
```javascript
// Dentro do Docker
const EMULATOR_HOST = 'firestore-emulator:8080';

// Local
const LOCAL_EMULATOR = 'localhost:8080';
```

## 🔄 Exemplos de Comunicação

### 1. Frontend → Backend (Fetch)

```javascript
// src/data/apiConfig.js
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://backend:3000/api',
  TIMEOUT: 5000,
};

// Uso em componentes
async function fetchData() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/users`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  }
}
```

### 2. Backend → Firestore

```javascript
// src/firebase.js
import admin from 'firebase-admin';

// Detectar ambiente
const isEmulator = process.env.FIRESTORE_EMULATOR_HOST;

if (isEmulator) {
  process.env.FIREBASE_EMULATOR_HOST = isEmulator;
  console.log(`Conectado ao Firestore Emulator: ${isEmulator}`);
}

const db = admin.firestore();
```

### 3. Backend → Backend (verificar saúde)

```javascript
// Verificar se outro serviço está vivo
async function checkServiceHealth(url) {
  try {
    const response = await fetch(`http://${url}/health`, {
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Uso
await checkServiceHealth('backend:3000');
```

## 🌍 Variáveis de Ambiente

### No `docker-compose.yml`

```yaml
services:
  frontend:
    environment:
      - EXPO_PUBLIC_API_URL=http://backend:3000/api
      - EXPO_PUBLIC_FIRESTORE_EMULATOR=firestore-emulator:8080
  
  backend:
    environment:
      - FIRESTORE_EMULATOR_HOST=firestore-emulator:8080
      - CORS_ORIGIN=http://frontend:8081
```

### No `.env.docker`

```bash
# Frontend
EXPO_PUBLIC_API_URL=http://backend:3000/api
EXPO_PUBLIC_FIRESTORE_EMULATOR=firestore-emulator:8080

# Backend
FIRESTORE_EMULATOR_HOST=firestore-emulator:8080
CORS_ORIGIN=http://frontend:8081
```

## 🔍 Debugging de Comunicação

### Testar conectividade entre containers

```bash
# Entrar no backend
docker-compose exec backend sh

# De dentro, testar conexão com frontend
ping frontend
curl http://frontend:8081

# Testar conexão com Firestore Emulator
curl http://firestore-emulator:8080
```

### Ver logs de rede

```bash
# Ver logs do docker daemon
docker logs meets_backend
docker logs meets_frontend

# Inspecionar rede
docker network inspect meets_network
```

### Testar API do Backend

```bash
# De fora
curl http://localhost:3000/health

# De dentro de outro container
docker-compose exec frontend curl http://backend:3000/health
```

## 🚫 Problemas Comuns

### Frontend não consegue acessar Backend

**Problema**: `Error: Connect ECONNREFUSED 127.0.0.1:3000`

**Solução**:
1. Usar `http://backend:3000` (nome do serviço) ao invés de `localhost`
2. Verificar se backend está rodando: `docker-compose ps`
3. Checar CORS no backend:
   ```javascript
   app.use(cors({
     origin: process.env.CORS_ORIGIN || 'http://frontend:8081'
   }));
   ```

### Firestore Emulator não conecta

**Problema**: `Error: Cannot connect to Firestore Emulator`

**Solução**:
1. Verificar se emulator está rodando: `docker-compose ps`
2. Usar `firestore-emulator:8080` (nome do serviço)
3. Restart do serviço:
   ```bash
   docker-compose restart firestore-emulator
   ```

### Timeout de conexão

**Problema**: Serviços levam muito tempo para iniciar

**Solução**:
1. Aumentar timeout no docker-compose
2. Usar health checks:
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
     interval: 10s
     timeout: 5s
     retries: 3
   ```

## 📊 Monitorar Recursos

```bash
# Ver CPU, memória, rede
docker stats

# Ver conexões de rede dos containers
docker-compose exec backend netstat -an | grep ESTABLISHED
```

## 🔐 Segurança

### Isolamento de Rede

Os containers APENAS se comunicam através da rede bridge:
- ✅ `backend` ↔ `frontend`
- ✅ `backend` ↔ `firestore-emulator`
- ✅ `frontend` → `firestore-emulator` (se necessário)

### Exposição de Portas

Apenas portas especificadas estão acessíveis externamente:
- `localhost:3000` → backend:3000
- `localhost:8081` → frontend:8081
- `localhost:8080` → firestore-emulator:8080

## 📈 Performance

### Otimizações

1. **Volume compartilhado**: Código-fonte para live reload
   ```yaml
   volumes:
     - ./snack/backend/src:/app/src
   ```

2. **Network driver**: Usar `bridge` (padrão) para isolamento
3. **Resource limits**: Limitar CPU/memória se necessário
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```
