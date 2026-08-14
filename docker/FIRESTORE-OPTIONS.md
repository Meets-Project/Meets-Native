# Firestore Configuration - Opções

Existem 3 formas de usar Firestore com o projeto Docker:

## 1️⃣ Opção A: Firebase Real (Recomendado para Produção)

Usar credenciais reais do Firebase.

### Setup:

1. Vá em [Firebase Console](https://console.firebase.google.com)
2. Crie um novo projeto ou selecione existente
3. Baixe a Service Account key (JSON)
4. Encode em base64:

```bash
cat path/to/serviceAccountKey.json | base64
```

5. Adicione ao `.env.docker`:

```bash
FIREBASE_SERVICE_ACCOUNT_BASE64=<sua_chave_base64>
FIRESTORE_EMULATOR_HOST=  # Deixar vazio
```

6. Inicie os containers:

```bash
docker-compose up --build
```

### Variáveis:

```javascript
// Backend detecta automaticamente
const isUsingEmulator = !process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
```

---

## 2️⃣ Opção B: Firestore Emulator Local (Recomendado para Desenvolvimento)

Rodar o Firestore Emulator **fora do Docker** em `localhost:8080`.

### Setup:

1. Instale Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Inicialize Firebase (se não feito):

```bash
firebase init
```

3. Inicie o emulator:

```bash
firebase emulators:start --only firestore
```

**Resultado esperado:**
```
┌─────────────────────────────────────┐
│ ✔  Firestore Emulator running on 127.0.0.1:8080 │
└─────────────────────────────────────┘
```

4. Em outro terminal, inicie Docker:

```bash
docker-compose up --build
```

### Variáveis:

Backend já está configurado com:
```
FIRESTORE_EMULATOR_HOST=localhost:8080
```

---

## 3️⃣ Opção C: Docker + Emulator (Complexo, não recomendado)

Se quiser rodar o emulator dentro do Docker:

### Criar `docker-compose-with-emulator.yml`:

```yaml
version: '3.9'

services:
  backend:
    # ... configuração padrão ...
    depends_on:
      - firestore-emulator
    environment:
      - FIRESTORE_EMULATOR_HOST=firestore-emulator:8080

  firestore-emulator:
    image: google/cloud-sdk:emulators
    container_name: meets_firestore_emulator
    ports:
      - "8080:8080"
    command: gcloud beta emulators firestore start --host-port=0.0.0.0:8080
    networks:
      - meets_network
```

### Executar:

```bash
docker-compose -f docker-compose-with-emulator.yml up --build
```

---

## 🔄 Como Usar Cada Opção

### Desenvolvimento Local (recomendado)

```bash
# Terminal 1: Firestore Emulator
firebase emulators:start --only firestore

# Terminal 2: Docker (Frontend + Backend)
docker-compose up --build
```

- Backend acessa: `localhost:8080`
- Frontend acessa: `http://localhost:3000`

### Desenvolvimento com Docker Completo

```bash
# Se usar Opção C (Emulator no Docker)
docker-compose -f docker-compose-with-emulator.yml up --build
```

- Backend acessa: `firestore-emulator:8080`
- Frontend acessa: `http://localhost:3000`

### Produção

```bash
# Usar Firebase real
docker-compose up --build

# Com credenciais no .env.docker
FIREBASE_SERVICE_ACCOUNT_BASE64=...
FIRESTORE_EMULATOR_HOST=  # vazio
```

---

## ✅ Verificar Conexão

### Backend conectado ao Firestore?

```bash
# Entrar no container
docker-compose exec backend sh

# Testar conexão
curl http://localhost:8080
```

### Frontend conectado ao Backend?

Abrir DevTools no navegador:
```javascript
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(console.log)
```

---

## 📊 Comparação

| Aspecto | Firebase Real | Emulator Local | Emulator Docker |
|---------|---------------|----------------|-----------------|
| Setup | Requer credenciais | Apenas CLI | Docker SDK |
| Custo | $ | Grátis | Grátis |
| Velocidade | Rede | Local | Localhost |
| Dados Persistem | ✅ Cloud | ❌ Sessão | ❌ Container |
| Usar em Produção | ✅ Sim | ❌ Não | ❌ Não |
| Complexidade | Baixa | Muito Baixa | Média |

---

## 🎯 Recomendação

**Para Desenvolvimento**: Use **Opção B** (Emulator Local)
- Setup mais rápido
- Não polui Docker
- Fácil debug
- Dados limpos a cada restart

**Para Produção**: Use **Opção A** (Firebase Real)
- Dados persistem
- Seguro
- Escalável
