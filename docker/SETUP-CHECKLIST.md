# ✅ Setup Verificação - Docker Meets Mobile

Checklist para verificar se tudo foi instalado corretamente.

## 📋 Verificação de Arquivos

- [ ] `docker-compose.yml` - Orquestrador dos serviços
- [ ] `snack/Dockerfile` - Container do Frontend
- [ ] `snack/backend/Dockerfile` - Container do Backend
- [ ] `.dockerignore` - Otimização de builds
- [ ] `.env.docker` - Variáveis de ambiente (raiz)
- [ ] `snack/backend/.env.docker` - Variáveis backend
- [ ] `snack/backend/src/config.js` - Config centralizada
- [ ] `snack/backend/src/firebase.js` - Setup Firebase

## 🔧 Scripts e Ferramentas

- [ ] `docker-helper.sh` - Menu interativo (Linux/Mac)
- [ ] `docker-helper.bat` - Menu interativo (Windows)
- [ ] `build-docker.sh` - Build e push de imagens
- [ ] `start-firestore-emulator.sh` - Inicia Firestore Emulator
- [ ] `start-dev-full.sh` - Firestore + Docker (tudo junto)
- [ ] `Makefile` - Make commands (alternativo)

## 📚 Documentação

- [ ] `README.DOCKER.md` - Guia completo
- [ ] `DOCKER-COMMUNICATION.md` - Comunicação entre serviços
- [ ] `FIRESTORE-OPTIONS.md` - Opções de Firestore
- [ ] `QUICK-START.md` - Guia rápido
- [ ] `SETUP-CHECKLIST.md` - Este arquivo

## 🚀 Próximos Passos para Começar

### 1. Instalar Dependências Globais

```bash
# Se não tiver instalado
npm install -g firebase-tools
```

### 2. Escolher Opção de Firestore

#### Opção A: Firebase Real (Produção)
```bash
# 1. Get credenciais em https://console.firebase.google.com
# 2. Encode em base64
# 3. Adicione em .env.docker: FIREBASE_SERVICE_ACCOUNT_BASE64=...
# 4. Inicie Docker:
docker-compose up --build
```

#### Opção B: Firestore Emulator (Desenvolvimento) ⭐
```bash
# Terminal 1: Emulator
bash start-firestore-emulator.sh

# Terminal 2: Docker
docker-compose up --build
```

#### Opção C: Tudo Automatizado
```bash
bash start-dev-full.sh
```

### 3. Verificar Conectividade

**Backend health check**:
```bash
curl http://localhost:3000/health
```

Esperado:
```json
{
  "status": "ok",
  "timestamp": "2026-05-18T...",
  "environment": "production"
}
```

**Frontend**:
Abrir http://localhost:8081 no navegador

**Firestore Emulator** (se usar):
```bash
curl http://localhost:8080
```

## 🐳 Estrutura Docker

```
meets_network (bridge)
├── backend:3000
│   └── Conecta a: localhost:8080 (Firestore) ou Firebase Real
└── frontend:8081
    └── Conecta a: http://backend:3000/api
```

## 🔄 Fluxo de Dados

1. **Browser** → `http://localhost:8081` (Frontend)
2. **Frontend** → `http://backend:3000/api` (dentro Docker: `http://backend:3000`)
3. **Backend** → `localhost:8080` (Firestore Emulator) ou Firebase Cloud
4. **Firestore** → Retorna dados para Backend
5. **Backend** → Retorna JSON para Frontend
6. **Frontend** → Renderiza no Browser

## ⚙️ Variáveis de Ambiente

### .env.docker (raiz)
```bash
NODE_ENV=production
FIREBASE_PROJECT_ID=snack-local
FIRESTORE_EMULATOR_HOST=localhost:8080
CORS_ORIGIN=http://frontend:8081
```

### Backend acessa:
```javascript
process.env.PORT              // 3000
process.env.NODE_ENV          // production
process.env.FIRESTORE_EMULATOR_HOST // localhost:8080
process.env.CORS_ORIGIN       // http://frontend:8081
```

## 🛠️ Troubleshooting Rápido

### Erro: Porta em uso
```bash
# Mudar em docker-compose.yml
ports:
  - "8082:8081"  # ao invés de 8081:8081
```

### Erro: Container não inicia
```bash
docker-compose logs -f backend
```

### Erro: Backend não encontra Firestore
```bash
# Verifique se emulator está rodando em outro terminal
bash start-firestore-emulator.sh
```

### Erro: Frontend não acessa Backend
- Verificar se usando `http://backend:3000` (dentro Docker)
- Não usar `localhost` de dentro do container
- Verificar CORS: `http://frontend:8081`

## 📊 Verificação Final

Após iniciar com `docker-compose up --build`:

```bash
# 1. Verificar containers rodando
docker ps

# 2. Verificar logs
docker-compose logs

# 3. Testar Backend
curl http://localhost:3000/health

# 4. Testar no navegador
# Ir para http://localhost:8081
```

## 🎯 Recursos Úteis

| Recurso | URL |
|---------|-----|
| Docker Docs | https://docs.docker.com |
| Docker Compose | https://docs.docker.com/compose/ |
| Firebase Emulator | https://firebase.google.com/docs/emulator-suite |
| Expo Docs | https://docs.expo.dev |

## 💡 Dicas de Desenvolvimento

1. **Live Reload do Backend**:
   ```yaml
   volumes:
     - ./snack/backend/src:/app/src
   ```

2. **Live Reload do Frontend**:
   ```yaml
   volumes:
     - ./snack:/app
   ```

3. **Entrar em um container**:
   ```bash
   docker-compose exec backend sh
   docker-compose exec frontend sh
   ```

4. **Ver recursos utilizados**:
   ```bash
   docker stats
   ```

5. **Limpar tudo e recomeçar**:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

## 🎓 Aprendizado

Este setup demonstra:
- ✅ Docker containerização
- ✅ Docker Compose orquestração
- ✅ Network Docker (bridge)
- ✅ Comunicação interna entre containers
- ✅ Volume mounting para live reload
- ✅ Variáveis de ambiente
- ✅ CORS configuration
- ✅ Multi-stage development (Dev/Prod)

## ✨ Conclusão

Sua aplicação agora tem:
- 🐳 **Containerização completa** - Fácil deploy
- 🔌 **Comunicação interna** - Serviços falam entre si
- 🚀 **Pronto para produção** - Use Firebase real em prod
- 🛠️ **Ambiente de dev** - Use Firestore Emulator em dev
- 📚 **Bem documentado** - Vários guias inclusos

---

**Status**: ✅ Pronto para usar!

Para começar: `docker-compose up --build`
