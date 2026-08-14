# 🚀 Guia Rápido - Docker Setup

## Comece em 2 minutos!

### Opção 1: Usar Firestore Real (Produção)

```bash
# 1. Configure as credenciais Firebase
# - Vá em https://console.firebase.google.com
# - Baixe a Service Account key
# - Encode em base64: cat key.json | base64
# - Edite .env.docker e adicione: FIREBASE_SERVICE_ACCOUNT_BASE64=<chave>

# 2. Inicie Docker
docker-compose up --build
```

**URLs**:
- Frontend: http://localhost:8081
- Backend: http://localhost:3000
- Health: http://localhost:3000/health

---

### Opção 2: Usar Firestore Emulator (Desenvolvimento) ⭐ Recomendado

**Terminal 1 - Firestore Emulator**:
```bash
# Primeira vez (setup)
npm install -g firebase-tools
firebase init  # Se não tiver firebase.json

# Depois
bash start-firestore-emulator.sh
```

**Terminal 2 - Docker**:
```bash
docker-compose up --build
```

**URLs**:
- Frontend: http://localhost:8081
- Backend: http://localhost:3000
- Health: http://localhost:3000/health
- Firestore Emulator: http://localhost:8080

---

### Opção 3: Tudo Automatizado (One-Command)

```bash
bash start-dev-full.sh
```

Isso inicia Firestore Emulator + Docker tudo junto!

---

## 📋 Menu Interativo

```bash
bash docker-helper.sh
```

Escolha uma opção:
```
1) Iniciar todos os serviços
2) Parar todos os serviços
3) Ver logs (todos)
4) Ver logs (backend)
5) Ver logs (frontend)
6) Entrar no backend (shell)
7) Entrar no frontend (shell)
8) Reconstruir imagens
9) Status dos containers
10) Limpar tudo
```

---

## 🔌 Comunicação Interna

**Dentro do Docker**:
```javascript
// Frontend → Backend
const API = 'http://backend:3000/api'

// Backend → Firestore
const FIRESTORE = 'localhost:8080' // Emulator local
```

**De fora (localhost)**:
```javascript
// Frontend: http://localhost:8081
// Backend: http://localhost:3000
// Firestore: http://localhost:8080
```

---

## 🛑 Parar Tudo

```bash
# Parar containers
docker-compose down

# Parar e limpar volumes
docker-compose down -v

# Parar Firestore Emulator (se rodando separado)
# No terminal do emulator: CTRL+C
```

---

## 📚 Mais Info

- [README.DOCKER.md](README.DOCKER.md) - Documentação completa
- [DOCKER-COMMUNICATION.md](DOCKER-COMMUNICATION.md) - Como os serviços se comunicam
- [FIRESTORE-OPTIONS.md](FIRESTORE-OPTIONS.md) - Comparação de opções Firestore

---

## ❓ Troubleshooting

### Erro: "Já existe container com esse nome"
```bash
docker-compose down -v
docker-compose up --build
```

### Backend não conecta ao Firestore
Verifique se Firestore Emulator está rodando em outro terminal:
```bash
bash start-firestore-emulator.sh
```

### Frontend não acessa Backend
Erro esperado se usar `localhost` dentro do Docker. Use `http://backend:3000` nos containers.

### Porta em uso
Mude em `docker-compose.yml`:
```yaml
ports:
  - "8082:8081"  # Ao invés de 8081:8081
```

---

## 🎯 Próximo Passo

Edite o `App.js` do frontend para chamar a API:

```javascript
import { API_CONFIG } from './data/apiConfig';

fetch(`${API_CONFIG.BASE_URL}/users`)
  .then(r => r.json())
  .then(data => console.log('Users:', data))
  .catch(err => console.error('Erro:', err))
```
