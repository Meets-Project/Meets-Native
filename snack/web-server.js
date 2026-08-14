const http = require('http');
const net = require('net');
const { spawn } = require('child_process');
const { URL } = require('url');

const proxyPort = Number(process.env.PORT) || 8081;
const expoPort = Number(process.env.EXPO_WEB_PORT) || 8082;
const apiTarget = new URL(process.env.API_PROXY_TARGET || 'http://backend:3000');
const appTarget = new URL(`http://127.0.0.1:${expoPort}`);

function createForwardHeaders(originalHeaders, targetUrl) {
  const headers = { ...originalHeaders };
  headers.host = targetUrl.host;
  headers.connection = 'close';
  delete headers['content-length'];
  return headers;
}

function proxyRequest(clientReq, clientRes, targetUrl) {
  const requestUrl = new URL(clientReq.url || '/', `http://${clientReq.headers.host || 'localhost'}`);
  const upstreamPath = requestUrl.pathname;
  const forwardPath = `${upstreamPath}${requestUrl.search}`;

  const upstreamReq = http.request(
    {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      method: clientReq.method,
      path: forwardPath,
      headers: createForwardHeaders(clientReq.headers, targetUrl),
    },
    (upstreamRes) => {
      const headers = { ...upstreamRes.headers };
      if (headers.location && typeof headers.location === 'string') {
        headers.location = headers.location.replace(targetUrl.origin, '');
      }

      clientRes.writeHead(upstreamRes.statusCode || 502, headers);
      upstreamRes.pipe(clientRes);
    },
  );

  upstreamReq.on('error', (error) => {
    clientRes.statusCode = 502;
    clientRes.setHeader('Content-Type', 'application/json');
    clientRes.end(JSON.stringify({ ok: false, message: 'Proxy failure', error: error.message }));
  });

  clientReq.pipe(upstreamReq);
}

function proxyUpgrade(clientReq, clientSocket, clientHead, targetUrl) {
  const upstreamSocket = net.connect(Number(targetUrl.port), targetUrl.hostname, () => {
    const headers = {
      ...clientReq.headers,
      host: targetUrl.host,
    };

    const headerLines = Object.entries(headers).map(([name, value]) => `${name}: ${value}`);
    const requestLine = `${clientReq.method} ${clientReq.url} HTTP/1.1`;
    upstreamSocket.write(`${requestLine}\r\n${headerLines.join('\r\n')}\r\n\r\n`);
    if (clientHead && clientHead.length > 0) {
      upstreamSocket.write(clientHead);
    }

    clientSocket.pipe(upstreamSocket).pipe(clientSocket);
  });

  upstreamSocket.on('error', (error) => {
    try {
      clientSocket.destroy(error);
    } catch (_error) {}
  });

  clientSocket.on('error', () => {
    upstreamSocket.destroy();
  });
}

const expoProcess = spawn(
  'npx',
  ['expo', 'start', '--web', '--host', 'localhost', '--port', String(expoPort)],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_NO_TELEMETRY: '1',
    },
  },
);

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const target = requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/') ? apiTarget : appTarget;
  proxyRequest(req, res, target);
});

server.on('upgrade', (req, socket, head) => {
  proxyUpgrade(req, socket, head, appTarget);
});

server.listen(proxyPort, '0.0.0.0', () => {
  console.log(`Frontend proxy listening on ${proxyPort}`);
  console.log(`Expo web target on ${expoPort}`);
  console.log(`API proxy target: ${apiTarget.origin}`);
});

function shutdown(signal) {
  server.close(() => {
    if (!expoProcess.killed) {
      expoProcess.kill(signal);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
