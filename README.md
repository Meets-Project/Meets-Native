# Meets — Native & Web

Plataforma de eventos, encontros, salas ao vivo e avaliação de apresentações em comunidade.

---

## 📁 Estrutura do Projeto

```
Meets-Native/
├── backend/                  # API Node.js / Express com PostgreSQL
│   ├── migrations/           # Migrações SQL (001, 002, 003)
│   ├── src/                  # Código-fonte da API (app, repo, auth, db)
│   └── test/                 # Testes automatizados (Vitest + pg-mem)
├── snack/                    # App Mobile / Web (React Native + Expo)
│   ├── components/           # Componentes visuais
│   ├── data/                 # Dados e configurações
│   ├── navigation/           # Navegação do App (React Navigation)
│   ├── screens/              # Telas (Home, Perfil, Avaliações, etc.)
│   ├── services/             # Integração com a API REST
│   └── styles/               # Estilizações globais e componentes
├── docker-compose.yml        # Orquestração do PostgreSQL, Backend, Adminer e Frontend
├── MERGE_IMPLEMENTADO.md     # Detalhes das funcionalidades integradas
└── README-POSTGRES.md        # Documentação do backend e banco de dados
```

---

## 🚀 Como Iniciar

### Com Docker Compose (Recomendado)

```bash
docker compose up --build
```

- **Frontend (Web):** `http://localhost:8080`
- **Backend API:** `http://localhost:3334`
- **Adminer (Banco):** `http://localhost:8081` (servidor: `postgres`, banco: `meets`, usuário: `postgres`, senha: `postgres`)

---

## 📱 Executando o App Mobile / Frontend (Expo)

```bash
cd snack
npm install
npx expo start
```

---

## ⚙️ Executando o Backend localmente

```bash
cd backend
npm install
npm run migrate
npm run dev
```

Para rodar os testes automatizados do backend:
```bash
npm test
```

## Deploy no Render

Consulte [RENDER.md](RENDER.md) para publicar o PostgreSQL, a API e o frontend Expo Web usando o repositório público do GitHub.
