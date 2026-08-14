# 🔌 Exemplos de Comunicação API

Exemplos práticos de como o Frontend se comunica com o Backend via Docker.

---

## 📡 Configuração Base

### Frontend - Config da API

Arquivo: `snack/data/apiConfig.js`

```javascript
// Detectar ambiente
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://backend:3000/api',
  TIMEOUT: 5000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// Função genérica para fetch
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...API_CONFIG.HEADERS,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}
```

---

## 🔄 Exemplos de Requisições

### 1. Health Check

**Frontend**:
```javascript
import { apiRequest } from './data/apiConfig';

export async function checkBackendHealth() {
  try {
    const response = await fetch('http://backend:3000/health'); // Direto, sem /api
    const data = await response.json();
    console.log('✅ Backend está vivo:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend não respondeu:', error);
    return false;
  }
}
```

**Backend**:
```javascript
// src/server.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});
```

---

### 2. GET - Buscar Usuários

**Frontend** (em um componente):
```javascript
import { apiRequest } from '../data/apiConfig';
import { useState, useEffect } from 'react';

export function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await apiRequest('/users');
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  if (loading) return <Text>Carregando...</Text>;
  if (error) return <Text>Erro: {error}</Text>;

  return (
    <View>
      {users.map(user => (
        <Text key={user.id}>{user.name}</Text>
      ))}
    </View>
  );
}
```

**Backend**:
```javascript
// src/routes/users.js
import express from 'express';
import { getFirestore } from '../firebase.js';

export const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    const db = getFirestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 3. POST - Criar Usuário

**Frontend**:
```javascript
import { apiRequest } from '../data/apiConfig';

export async function createUser(userData) {
  try {
    const response = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        createdAt: new Date().toISOString(),
      }),
    });
    
    console.log('✅ Usuário criado:', response);
    return response;
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    throw error;
  }
}

// Uso em um formulário
export function CreateUserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await createUser({ name, email });
      alert('✅ Usuário criado com sucesso!');
      setName('');
      setEmail('');
    } catch (error) {
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <TextInput
        placeholder="Nome"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <Button
        title={loading ? 'Criando...' : 'Criar'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </View>
  );
}
```

**Backend**:
```javascript
// src/routes/users.js
router.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const db = getFirestore();
    const docRef = await db.collection('users').add({
      name,
      email,
      createdAt: new Date(),
    });

    res.status(201).json({
      id: docRef.id,
      message: 'Usuário criado com sucesso',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 4. PUT - Atualizar Usuário

**Frontend**:
```javascript
export async function updateUser(userId, updates) {
  try {
    const response = await apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response;
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    throw error;
  }
}
```

**Backend**:
```javascript
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const db = getFirestore();
    await db.collection('users').doc(id).update({
      ...updates,
      updatedAt: new Date(),
    });

    res.json({ message: 'Usuário atualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 5. DELETE - Deletar Usuário

**Frontend**:
```javascript
export async function deleteUser(userId) {
  try {
    const response = await apiRequest(`/users/${userId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Erro ao deletar:', error);
    throw error;
  }
}
```

**Backend**:
```javascript
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getFirestore();
    await db.collection('users').doc(id).delete();
    res.json({ message: 'Usuário deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🌐 URLs Diferentes por Ambiente

```javascript
// development (local, sem Docker)
const API_DEV = 'http://localhost:3000/api';

// development (com Docker)
const API_DOCKER = 'http://backend:3000/api';

// production (Firebase real)
const API_PROD = 'https://seu-backend.com/api';

// Use variáveis de ambiente
const BASE_URL = process.env.REACT_APP_API_URL || 'http://backend:3000/api';
```

---

## 🔐 Tratamento de Erros

```javascript
export async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(url, options);

    // Não é JSON = erro
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    // Timeout
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Conexão recusada. Backend não está respondendo.');
    }
    
    // Parse error
    if (error instanceof SyntaxError) {
      throw new Error('Resposta do servidor inválida');
    }
    
    throw error;
  }
}
```

---

## 🚨 Debugging

### Ver requisições no DevTools

```javascript
// Frontend - inspecionar requisição
window.addEventListener('fetch', (event) => {
  console.log('Requisição:', event.request.url);
});

// Ou adicionar logging manual
const response = await fetch(url);
console.log('Response status:', response.status);
console.log('Response headers:', response.headers);
```

### Ver logs no Backend

```bash
docker-compose logs -f backend
```

### Teste manual com curl

```bash
# Health check
curl http://localhost:3000/health

# Listar usuários
curl http://localhost:3000/api/users

# Criar usuário
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@example.com"}'

# Atualizar usuário
curl -X PUT http://localhost:3000/api/users/123 \
  -H "Content-Type: application/json" \
  -d '{"name":"João Silva"}'

# Deletar usuário
curl -X DELETE http://localhost:3000/api/users/123
```

---

## 📊 Estrutura Completa (Backend)

```javascript
// src/server.js
import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`Backend rodando em :${process.env.PORT || 3000}`);
});
```

```javascript
// src/app.js
import cors from 'cors';
import express from 'express';
import { router } from './routes/index.js';

export const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'backend' });
});

app.use('/api', router);
```

```javascript
// src/routes/index.js
import express from 'express';
import { router as usersRouter } from './users.js';

export const router = express.Router();
router.use('', usersRouter);
```

---

## ✅ Checklist de Integração

- [ ] Instalar dependências do backend: `cd snack/backend && bun install`
- [ ] Instalar dependências do frontend: `cd snack && npm install`
- [ ] Criar arquivo `apiConfig.js` no frontend
- [ ] Criar rota `/users` no backend
- [ ] Testar health check: `curl http://localhost:3000/health`
- [ ] Testar listar usuários: `curl http://localhost:3000/api/users`
- [ ] Integrar no componente do frontend
- [ ] Testar fluxo completo (create, read, update, delete)

---

**Pronto para integrar sua API! 🚀**
