# Snack Backend (Express + Bun + Firestore)

Backend em Express rodando com Bun, integrado ao Cloud Firestore via Firebase Admin SDK.

## Requisitos

- Bun instalado
- Opcao A: Firestore real com service account
- Opcao B: Firestore Emulator (sem credencial)

## Configuracao

1. Entre na pasta backend:

   cd snack/backend

2. Instale dependencias:

   bun install

3. Crie o arquivo .env a partir do exemplo:

   cp .env.example .env

4. Escolha um modo:

- Firestore real:
  - FIREBASE_SERVICE_ACCOUNT_JSON em linha unica, ou
  - FIREBASE_SERVICE_ACCOUNT_BASE64 em base64
- Firestore emulator:
  - FIREBASE_PROJECT_ID=snack-local
  - FIRESTORE_EMULATOR_HOST=127.0.0.1:8080

## Executar

- Desenvolvimento com Firestore real:

  bun run dev

- Desenvolvimento com Firestore Emulator:

  bun run firestore:emulator
  bun run dev:emulator

- Producao:

  bun run start

## Rotas

- GET /health
- GET /api/ping
- GET /api/users/:id
- PUT /api/users/:id

Exemplo de update:

curl -X PUT http://localhost:3333/api/users/user_1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria","city":"SP"}'
