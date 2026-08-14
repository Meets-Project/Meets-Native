# GUIA DE EXECUÇÃO TÉCNICA - MEETS MOBILE

## Instruções Passo a Passo para Executar os Testes

---

## 1. PRÉ-REQUISITOS

### Ambiente Local

- ✅ Node.js v24.x ou superior
- ✅ npm v10.x ou superior
- ✅ Git
- ✅ VS Code (recomendado)
- ✅ Emulador Android ou dispositivo físico (para testes de UI)

### Verificar Instalação

```bash
# Verificar Node.js
node --version
# Output esperado: v24.14.0 (ou similar)

# Verificar npm
npm --version
# Output esperado: 10.x.x (ou similar)
```

---

## 2. CLONAR E CONFIGURAR REPOSITÓRIO

```bash
# Clonar o repositório
git clone https://github.com/Organization-Meets/Meets_Mobile.git
cd Meets_Mobile

# Selecionar a branch correta
git checkout gabriel-snack
```

---

## 3. INSTALAR DEPENDÊNCIAS

### Backend

```bash
# Navegar para o diretório do backend
cd snack/backend

# Instalar todas as dependências
npm install

# Verificar se Jest está instalado
npm list jest
```

### Frontend (Opcional para testes UI)

```bash
cd ../
# A partir do diretório snack/

npm install
```

---

## 4. CONFIGURAR VARIÁVEIS DE AMBIENTE

### Arquivo `.env` para Backend

Criar arquivo `snack/backend/.env`:

```env
# Configuração do Node.js
NODE_ENV=development
PORT=3000

# Firebase - Opção 1: Emulador Local
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_PROJECT_ID=snack-local

# Firebase - Opção 2: Credenciais Reais (comentado)
# FIREBASE_SERVICE_ACCOUNT_BASE64=<sua-chave-codificada>

# Frontend
FRONTEND_ORIGIN=http://localhost:8081
JSON_BODY_LIMIT=50mb
```

---

## 5. EXECUTAR TESTES AUTOMATIZADOS

### Teste Completo (Backend)

```bash
# A partir de: snack/backend/

npm test
```

**Output esperado:**
```
✔ CT-COLAB-001: GET / responde com metadados da API (58.546ms)
✔ CT-COLAB-002: GET /api/ping retorna pong (10.045ms)
✔ CT-COLAB-003: GET /api/users/me usa fallback local sem credenciais (8.935ms)
... (10 testes adicionais)
✔ CT-COLAB-013: Resposta JSON tem estrutura correta (5.559ms)

ℹ tests 13
ℹ pass 13
ℹ fail 0
ℹ duration_ms 753.664
```

### Teste Individual

```bash
# Executar apenas um arquivo de teste
npm test -- tests/colab.test.js

# Executar um teste específico por nome
npm test -- --grep "CT-COLAB-001"
```

### Modo Watch (Desenvolvimento)

```bash
# Reexecutar testes ao salvar arquivos
npm test -- --watch
```

---

## 6. INICIAR O SERVIDOR BACKEND

### Desenvolvimento Local

```bash
# A partir de: snack/backend/

# Instalar dependência de desenvolvimento (opcional)
npm install --save-dev nodemon

# Executar com nodemon (auto-restart)
npx nodemon src/server.js

# Ou simplesmente:
node src/server.js
```

**Output esperado:**
```
Server running on http://localhost:3000
```

### Testar Endpoints com cURL

```bash
# Test 1: GET /
curl http://localhost:3000/

# Test 2: GET /api/ping
curl http://localhost:3000/api/ping

# Test 3: GET /api/users/me
curl http://localhost:3000/api/users/me

# Test 4: PUT /api/users/me (atualizar perfil)
curl -X PUT http://localhost:3000/api/users/me \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "city": "São Paulo, BR",
    "role": "Desenvolvedor"
  }'

# Test 5: GET /health
curl http://localhost:3000/health
```

---

## 7. EXECUTAR COM DOCKER

### Build da Imagem

```bash
# A partir do diretório raiz do projeto

# Construir imagem do backend
docker build -t meets-backend:latest snack/backend/

# Construir imagem do frontend
docker build -t meets-frontend:latest snack/
```

### Executar com Docker Compose

```bash
# A partir do diretório docker/

docker-compose up -d

# Verificar status dos containers
docker-compose ps

# Ver logs do backend
docker-compose logs backend

# Ver logs do frontend
docker-compose logs frontend

# Parar os serviços
docker-compose down
```

**Portas disponíveis após docker-compose up:**
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:8081`

---

## 8. TESTAR ENDPOINTS COM FERRAMENTAS

### Opção 1: Postman

1. Importar coleção:
   - Arquivo: `docs/Meets_Mobile.postman_collection.json` (criar se necessário)
   - Criar requisições para cada endpoint

2. Endpoints principais:
   ```
   GET  http://localhost:3000/
   GET  http://localhost:3000/api/ping
   GET  http://localhost:3000/api/health
   GET  http://localhost:3000/api/users/me
   PUT  http://localhost:3000/api/users/me
   ```

### Opção 2: VS Code REST Client

Criar arquivo `test-requests.http`:

```http
### Teste 1: Metadados da API
GET http://localhost:3000/

### Teste 2: Ping
GET http://localhost:3000/api/ping

### Teste 3: Obter usuário
GET http://localhost:3000/api/users/me

### Teste 4: Atualizar usuário
PUT http://localhost:3000/api/users/me
Content-Type: application/json

{
  "name": "Teste User",
  "city": "São Paulo, BR",
  "role": "Tester"
}

### Teste 5: Health Check
GET http://localhost:3000/health
```

Instalar extensão "REST Client" no VS Code e clicar "Send Request".

---

## 9. EXECUTAR TESTES DE UI (FRONTEND)

### Iniciar Servidor de Desenvolvimento

```bash
# A partir de: snack/

# Instalar dependências (primeira vez)
npm install

# Iniciar Expo
npm start

# Escolher plataforma:
# - Pressionar 'a' para Android
# - Pressionar 'i' para iOS
# - Pressionar 'w' para Web
```

### Abrir em Emulador Android

```bash
# Em outro terminal
cd snack/

# Instalar app no emulador (se existente)
expo run:android

# Ou usar Expo Go app manualmente
# 1. Baixar Expo Go do Play Store
# 2. Escanear QR code exibido no terminal
```

### Executar Fluxos Manuais

| Fluxo | Passos |
|-------|--------|
| **CT-UI-001: Login** | 1. Abrir app → 2. Inserir email/senha → 3. Clicar "Entrar" → 4. Verificar redirecionamento para Home |
| **CT-UI-002: Perfil** | 1. Ir para Settings → 2. Editar Perfil → 3. Alterar nome/cidade → 4. Salvar → 5. Verificar persistência |
| **CT-UI-003: Descoberta** | 1. Ir para Home → 2. Visualizar feed de eventos → 3. Filtrar por localização → 4. Verificar carregamento |
| **CT-UI-004: Favoritos** | 1. Abrir evento → 2. Clicar coração → 3. Ir para Favoritos → 4. Verificar listagem |
| **CT-UI-005: Compartilhar** | 1. Abrir perfil → 2. Clicar "Compartilhar" → 3. Selecionar app → 4. Verificar link |

---

## 10. INTEGRAÇÃO COM CI/CD

### GitHub Actions Workflow

Criar arquivo `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, gabriel-snack ]
  pull_request:
    branches: [ main, gabriel-snack ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '24'
    
    - name: Install dependencies
      working-directory: snack/backend
      run: npm install
    
    - name: Run tests
      working-directory: snack/backend
      run: npm test
    
    - name: Check coverage
      working-directory: snack/backend
      run: npm run test:coverage
```

---

## 11. TROUBLESHOOTING

### Erro: "Cannot find package 'cors'"

```bash
# Solução: Instalar dependências novamente
cd snack/backend
npm install
```

### Erro: "Port 3000 is already in use"

```bash
# Encontrar processo usando porta 3000
lsof -i :3000

# Matar processo (substitua PID pelo valor encontrado)
kill -9 <PID>

# Ou usar porta diferente
PORT=3001 node src/server.js
```

### Erro: "FIREBASE_PROJECT_ID is not defined"

```bash
# Verificar arquivo .env
cat snack/backend/.env

# Certifique-se de que tem:
FIREBASE_PROJECT_ID=snack-local
FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Erro: "Connection refused" ao conectar com Firestore

```bash
# Iniciar emulador Firestore em outro terminal
firebase emulators:start --only firestore

# Ou usar Firestore Studio
firebase emulators:start
```

---

## 12. CHECKLIST DE EXECUÇÃO

- [ ] Clonar repositório
- [ ] Instalar Node.js v24+
- [ ] npm install no backend
- [ ] Criar arquivo .env
- [ ] Executar npm test
- [ ] Verificar 13/13 testes passando
- [ ] Iniciar servidor com node src/server.js
- [ ] Testar endpoints com curl/Postman
- [ ] Executar frontend com npm start
- [ ] Validar fluxos manuais no emulador
- [ ] Documentar resultados

---

## 13. PRÓXIMOS PASSOS

1. **Testes E2E**: Configurar Cypress ou Appium
2. **Cobertura**: npm run test:coverage
3. **Performance**: Medir tempo de resposta com Artillery
4. **Segurança**: Executar OWASP checks
5. **Deploy**: Configurar pipeline CI/CD

---

**Última atualização:** Junho de 2026  
**Próxima revisão:** Agosto de 2026
