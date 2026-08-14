# 🎯 COMEÇAR AGORA - Passo a Passo

## ⏱️ Tempo Total: 5 minutos

Siga estes passos para ter seu ambiente funcionando em minutos.

---

## ✅ Pré-requisitos (1 minuto)

Verifique se você tem instalado:

```bash
# Docker
docker --version          # Docker 20.10+

# Docker Compose
docker-compose --version  # Docker Compose 2.0+

# Node.js
node --version           # Node 18+

# npm
npm --version            # npm 8+

# Firebase CLI (opcional, mas recomendado para dev)
firebase --version       # Instale se não tiver
```

Se faltar algo:
```bash
# Instalar Firebase CLI
npm install -g firebase-tools
```

---

## 🚀 Iniciar (2 minutos)

### Opção A: Recomendada para Desenvolvimento ⭐

**Terminal 1** - Firestore Emulator:
```bash
cd /workspaces/Meets_Mobile
bash start-firestore-emulator.sh
```

Espere aparecer:
```
✔  Firestore Emulator running on 127.0.0.1:8080
```

**Terminal 2** - Docker:
```bash
cd /workspaces/Meets_Mobile
docker-compose up --build
```

Espere aparecer:
```
🚀 Meets Mobile Backend
Porta: 3000
```

---

### Opção B: Tudo Automatizado

```bash
bash start-dev-full.sh
```

Isso inicia Firestore + Docker tudo junto.

---

### Opção C: Usar Make

```bash
make dev
```

---

## 🌐 Acessar (1 minuto)

Abra no seu navegador:

```
http://localhost:8081    ← Frontend (Expo)
http://localhost:3000    ← Backend (API)
http://localhost:8080    ← Firestore Emulator (dev tools)
```

---

## ✅ Verificar se Funcionou (1 minuto)

### Backend respondendo?

```bash
curl http://localhost:3000/health
```

Deve aparecer:
```json
{
  "status": "ok",
  "timestamp": "2026-05-18T...",
  "environment": "production"
}
```

### Frontend acessível?

Abra http://localhost:8081 no navegador.

### Logs aparecendo?

```bash
docker-compose logs -f
```

---

## 🎯 Próximos Passos

### 1. Integrar sua API (5 minutos)

Ver exemplos em: `API-INTEGRATION-EXAMPLES.md`

```javascript
// Frontend
import { apiRequest } from './data/apiConfig';

async function fetchUsers() {
  const data = await apiRequest('/users');
  console.log(data);
}
```

### 2. Criar suas rotas (10 minutos)

Ver exemplo em: `snack/backend/src/routes/users.js`

```javascript
// Backend
app.get('/users', async (req, res) => {
  const users = await db.collection('users').get();
  res.json(users);
});
```

### 3. Testar comunicação

```bash
curl http://localhost:3000/api/users
```

---

## 🛑 Parar Tudo

```bash
# Terminal com Docker: CTRL+C
# Terminal com Firestore: CTRL+C

# Ou parar com comando
docker-compose down
```

---

## 📋 Checklist de Sucesso

- [ ] Dois terminais abertos (Firestore + Docker)
- [ ] Docker containers rodando (`docker ps` mostra 2 containers)
- [ ] Firestore Emulator respondendo
- [ ] Frontend acessível em http://localhost:8081
- [ ] Backend respondendo em http://localhost:3000/health
- [ ] Logs aparecendo nos terminais
- [ ] Arquivos de documentação disponíveis

---

## 📚 Documentação Disponível

Se tiver dúvidas em qualquer momento:

| Situação | Arquivo |
|----------|---------|
| Quer entender a arquitetura | `README.DOCKER.md` |
| Quer ver exemplos de API | `API-INTEGRATION-EXAMPLES.md` |
| Quer usar Firebase Real | `FIRESTORE-OPTIONS.md` |
| Tem problema | `SETUP-CHECKLIST.md` |
| Quer mais opções | `QUICK-START.md` |
| Quer overview | `INDEX.md` |

---

## 🆘 Problemas Comuns

### ❌ Erro: "Porta 3000 já em uso"

Mude em `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Mude 3000 para 3001
```

### ❌ Erro: "Backend não conecta"

Verifique:
1. Docker está rodando? `docker ps`
2. Logs: `docker-compose logs backend`
3. Reinicie: `docker-compose restart backend`

### ❌ Erro: "Firestore Emulator não conecta"

Verifique:
1. Emulator está rodando em outro terminal?
2. Port 8080 está livre? `lsof -i :8080`
3. Reinicie: `bash start-firestore-emulator.sh`

### ❌ Erro: "Frontend não acessa Backend"

Verifique:
1. Está usando `http://backend:3000` (dentro Docker) ou `http://localhost:3000` (fora)?
2. CORS está configurado? Ver `snack/backend/src/app.js`

---

## 💡 Dicas Úteis

### Ver logs em tempo real
```bash
docker-compose logs -f backend
```

### Entrar em um container
```bash
docker-compose exec backend sh
```

### Executar comando em um container
```bash
docker-compose exec backend bun --version
```

### Ver recursos utilizados
```bash
docker stats
```

### Reconstruir imagens
```bash
docker-compose up --build
```

---

## 🔄 Workflow Típico

```
1. Abrir 2 terminais

   Terminal 1: bash start-firestore-emulator.sh
   Terminal 2: docker-compose up --build

2. Abrir navegador em http://localhost:8081

3. Editar código em seu IDE

4. Mudanças aparecem em live reload

5. Ver logs em qualquer um dos terminais

6. CTRL+C para parar
```

---

## 🎓 O que você tem agora

✅ **Containerização**: Toda aplicação em containers
✅ **Comunicação**: Frontend ↔ Backend ↔ Firestore
✅ **Desenvolvimento**: Firestore Emulator grátis
✅ **Produção**: Firebase Real com credenciais
✅ **Scripts**: Helpers para facilitar tudo
✅ **Documentação**: 9 guias completos
✅ **Exemplos**: API CRUD pronta
✅ **Pronto**: Para deploy em qualquer lugar

---

## 🚀 Ready?

Escolha um comando e execute:

```bash
# Opção 1: Recomendada
bash start-firestore-emulator.sh  # Terminal 1
docker-compose up --build         # Terminal 2

# Opção 2: Automática
bash start-dev-full.sh

# Opção 3: Make
make dev

# Depois acesse
http://localhost:8081
```

---

## 📞 Suporte

Documentação disponível:
- `DOCKER-START-HERE.md` - Este arquivo
- `QUICK-START.md` - Opções alternativas
- `README.DOCKER.md` - Tudo em detalhes
- `API-INTEGRATION-EXAMPLES.md` - Exemplos práticos

---

**Status**: ✅ Tudo pronto!

Divirta-se desenvolvendo! 🎉
