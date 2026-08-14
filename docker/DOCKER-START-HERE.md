# 🎉 Meets - Docker Setup COMPLETO

## 🚀 Comece em 2 Minutos

```bash
# Opção 1: Firestore Emulator (Recomendado para Dev)
bash start-firestore-emulator.sh    # Terminal 1
docker-compose up --build           # Terminal 2

# Opção 2: Tudo Automatizado
bash start-dev-full.sh

# Opção 3: Usando Make
make dev
```

**Acesse**:
- 🌐 Frontend: http://localhost:8081
- 🔌 Backend: http://localhost:3000
- 📡 Firestore: http://localhost:8080

---

## 📚 Documentação Rápida

| Documento | Para Quem |
|-----------|-----------|
| **`QUICK-START.md`** | Quer começar já |
| **`README.DOCKER.md`** | Quer entender tudo |
| **`DOCKER-COMMUNICATION.md`** | Como os serviços falam |
| **`FIRESTORE-OPTIONS.md`** | Qual Firestore usar |
| **`API-INTEGRATION-EXAMPLES.md`** | Quer ver exemplos |
| **`SETUP-CHECKLIST.md`** | Problema? Veja aqui |

---

## 🐳 O que foi feito

✅ **Docker Compose** - 3 serviços orquestrados
✅ **Dockerfiles** - Frontend e Backend containerizados
✅ **Comunicação Interna** - Serviços falam entre si
✅ **Firestore** - 3 opções (Real, Emulator, Docker)
✅ **Scripts** - 5 helpers para facilitar
✅ **Documentação** - 7 guias completos
✅ **Exemplos** - Integração pronta para usar

---

## ⚙️ Menu Interativo

```bash
bash docker-helper.sh
```

Escolha entre:
1. Iniciar serviços
2. Parar serviços
3. Ver logs
4. Shell no backend/frontend
5. Reconstruir imagens
6. ... e mais

---

## 🔌 URLs de Comunicação

```javascript
// Dentro do Docker
const API = 'http://backend:3000/api'

// Fora (localhost)
const API = 'http://localhost:3000/api'

// Em arquivo .env
EXPO_PUBLIC_API_URL=http://backend:3000/api
```

---

## 📋 Próximos Passos

1. **Instalar Firebase CLI** (primeira vez):
   ```bash
   npm install -g firebase-tools
   ```

2. **Escolher Firestore**:
   - Dev: Use Emulator (gratuito)
   - Prod: Use Firebase Real (credenciais)

3. **Iniciar ambiente**:
   ```bash
   docker-compose up --build
   ```

4. **Integrar API** (ver `API-INTEGRATION-EXAMPLES.md`)

5. **Deploy** (em produção)

---

## 🛠️ Útil Saber

```bash
# Ver status
docker ps

# Ver logs
docker-compose logs -f

# Ver logs de um serviço
docker-compose logs -f backend

# Entrar em um container
docker-compose exec backend sh

# Parar tudo
docker-compose down

# Limpar volumes (recomeçar do zero)
docker-compose down -v
```

---

## 🎯 Estrutura

```
Docker Network: meets_network
├── Frontend (Expo) 
│   └── http://localhost:8081
├── Backend (Express+Bun)
│   └── http://localhost:3000/api
└── Firestore (Local ou Cloud)
    └── localhost:8080 (dev) ou Firebase (prod)
```

---

## ❓ Problemas?

Veja `SETUP-CHECKLIST.md` para troubleshooting.

Problemas comuns:
- **Porta em uso**: Mude em `docker-compose.yml`
- **Backend não conecta**: Usar `http://backend:3000` (não localhost)
- **Firestore não conecta**: Emulator deve estar rodando em outro terminal
- **Container não inicia**: `docker-compose logs -f backend`

---

## 📞 Suporte Rápido

```bash
# Health check
curl http://localhost:3000/health

# Ver versão do backend
docker-compose exec backend node --version

# Ver versão do frontend
docker-compose exec frontend npm --version
```

---

## 🎓 Você agora tem

- ✅ Ambiente containerizado
- ✅ Comunicação entre serviços
- ✅ Pronto para produção
- ✅ Documentação extensiva
- ✅ Scripts para facilitar
- ✅ Exemplos de integração

---

## 📚 Arquivos Criados

```
21 arquivos novos + 1 modificado

docker-compose.yml              ← Orquestrador
snack/Dockerfile                ← Frontend
snack/backend/Dockerfile        ← Backend
.dockerignore                   ← Otimização
Makefile                        ← Make commands
docker-helper.sh                ← Menu (Linux/Mac)
docker-helper.bat               ← Menu (Windows)
start-firestore-emulator.sh     ← Emulator
start-dev-full.sh               ← Tudo junto
build-docker.sh                 ← Build & push

+ 7 arquivos .md de documentação
+ 3 arquivos de código (config, firebase, env)
```

---

**Status**: ✅ PRONTO PARA USAR

```bash
docker-compose up --build
```

Ou veja `QUICK-START.md` para mais opções.

---

**Criado**: 18/05/2026
**Documentação**: Completa (7 guias)
**Status**: 🟢 Pronto para Produção
