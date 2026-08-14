import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { app } from "../src/app.js";

async function request({ method, path, body, headers = {} }) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : null;

  if (!port) {
    throw new Error("Porta de teste inválida");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        ...(body ? { "content-type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return {
      status: response.status,
      json: await response.json(),
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function clearFirebaseCredentials() {
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
}

test("CT-COLAB-001: GET / responde com metadados da API", async () => {
  const result = await request({ method: "GET", path: "/" });

  assert.equal(result.status, 200);
  assert.equal(result.json.ok, true);
  assert.equal(result.json.message, "Meets Mobile Backend");
  assert.equal(result.json.api, "/api");
});

test("CT-COLAB-002: GET /api/ping retorna pong", async () => {
  const result = await request({ method: "GET", path: "/api/ping" });

  assert.equal(result.status, 200);
  assert.equal(result.json.ok, true);
  assert.equal(result.json.message, "pong");
  assert.ok(result.json.timestamp);
});

test("CT-COLAB-003: GET /api/users/me usa fallback local sem credenciais", async () => {
  clearFirebaseCredentials();
  const result = await request({ method: "GET", path: "/api/users/me" });

  assert.equal(result.status, 200);
  assert.equal(result.json.ok, true);
  assert.equal(result.json.source, "local-fallback");
  assert.equal(result.json.data.id, "me");
});

test("CT-COLAB-004: PUT /api/users/me persiste dados no fallback local", async () => {
  clearFirebaseCredentials();

  const updatePayload = {
    name: "Colab QA",
    city: "Ferraz de Vasconcelos, BR",
    role: "Colaborador Técnico",
  };

  const putResult = await request({
    method: "PUT",
    path: "/api/users/me",
    body: updatePayload,
  });

  assert.equal(putResult.status, 200);
  assert.equal(putResult.json.ok, true);
  assert.equal(putResult.json.source, "local-fallback");
  assert.equal(putResult.json.data.name, updatePayload.name);
  assert.equal(putResult.json.data.city, updatePayload.city);
  assert.equal(putResult.json.data.role, updatePayload.role);

  const getResult = await request({ method: "GET", path: "/api/users/me" });
  assert.equal(getResult.status, 200);
  assert.equal(getResult.json.data.name, updatePayload.name);
});

test("CT-COLAB-005: GET /api/health retorna status do serviço", async () => {
  const result = await request({ method: "GET", path: "/api/health" });

  assert.equal(result.status, 200);
  assert.equal(result.json.ok, true);
  assert.equal(result.json.service, "snack-backend");
  assert.ok(typeof result.json.uptime === "number");
  assert.ok(result.json.uptime >= 0);
});

test("CT-COLAB-006: GET /health (root level) retorna status do serviço", async () => {
  const result = await request({ method: "GET", path: "/health" });

  assert.equal(result.status, 200);
  assert.equal(result.json.ok, true);
  assert.equal(result.json.service, "snack-backend");
  assert.ok(typeof result.json.uptime === "number");
});

test("CT-COLAB-007: PUT /api/users/me com payload vazio", async () => {
  clearFirebaseCredentials();

  const putResult = await request({
    method: "PUT",
    path: "/api/users/me",
    body: {},
  });

  assert.equal(putResult.status, 200);
  assert.equal(putResult.json.ok, true);
  assert.equal(putResult.json.source, "local-fallback");
  assert.ok(putResult.json.data);
});

test("CT-COLAB-008: PUT /api/users/me mantém dados padrão quando não fornecidos", async () => {
  clearFirebaseCredentials();

  const updatePayload = {
    name: "Novo Nome",
  };

  const putResult = await request({
    method: "PUT",
    path: "/api/users/me",
    body: updatePayload,
  });

  assert.equal(putResult.status, 200);
  assert.equal(putResult.json.data.name, updatePayload.name);
  assert.equal(putResult.json.data.avatar, "🧑‍💻");
  assert.equal(putResult.json.data.rating, 4.9);
});

test("CT-COLAB-009: PUT /api/users/me com múltiplos campos", async () => {
  clearFirebaseCredentials();

  const updatePayload = {
    name: "Test User",
    city: "São Paulo, BR",
    role: "Desenvolvedor",
    bio: "Testando o backend",
    avatar: "👨‍💻",
  };

  const putResult = await request({
    method: "PUT",
    path: "/api/users/me",
    body: updatePayload,
  });

  assert.equal(putResult.status, 200);
  assert.equal(putResult.json.ok, true);
  Object.entries(updatePayload).forEach(([key, value]) => {
    assert.equal(putResult.json.data[key], value);
  });
});

test("CT-COLAB-010: GET / inclui todos os campos de metadados", async () => {
  const result = await request({ method: "GET", path: "/" });

  assert.equal(result.status, 200);
  assert.ok(result.json.ok);
  assert.ok(result.json.message);
  assert.ok(result.json.health);
  assert.ok(result.json.api);
  assert.equal(result.json.health, "/health");
  assert.equal(result.json.api, "/api");
});

test("CT-COLAB-011: GET /api/ping inclui timestamp", async () => {
  const beforeTest = new Date();
  const result = await request({ method: "GET", path: "/api/ping" });
  const afterTest = new Date();

  assert.equal(result.status, 200);
  assert.ok(result.json.timestamp);
  
  const responseTime = new Date(result.json.timestamp);
  assert.ok(responseTime >= beforeTest);
  assert.ok(responseTime <= afterTest);
});

test("CT-COLAB-012: Múltiplas requisições GET /api/users/me retornam mesmo estado", async () => {
  clearFirebaseCredentials();

  const updatePayload = { name: "Persistência Test" };

  await request({
    method: "PUT",
    path: "/api/users/me",
    body: updatePayload,
  });

  const result1 = await request({ method: "GET", path: "/api/users/me" });
  const result2 = await request({ method: "GET", path: "/api/users/me" });

  assert.equal(result1.json.data.name, result2.json.data.name);
  assert.equal(result1.json.data.name, updatePayload.name);
});

test("CT-COLAB-013: Resposta JSON tem estrutura correta", async () => {
  const result = await request({ method: "GET", path: "/api/users/me" });

  assert.ok(result.json.data);
  assert.ok(typeof result.json.data === "object");
  assert.ok(result.json.data.id);
  assert.ok(result.json.data.name);
  assert.ok(result.json.data.role);
  assert.ok(result.json.data.city);
});

test("CT-COLAB-014: /api/users/me usa fallback local quando X-Dev-User-Id é enviado", async () => {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

  const result = await request({
    method: "GET",
    path: "/api/users/me",
    headers: { "x-dev-user-id": "dev-user-42" },
  });

  assert.equal(result.status, 200);
  assert.equal(result.json.ok, true);
  assert.equal(result.json.source, "local-fallback");
  assert.equal(result.json.data.id, "dev-user-42");

  delete process.env.FIRESTORE_EMULATOR_HOST;
});
