const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const dataFile = path.join(rootDir, 'data', 'budgets.json');

function readBudgets() {
  try {
    if (!fs.existsSync(dataFile)) return [];
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeBudgets(list) {
  fs.writeFileSync(dataFile, JSON.stringify(list, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/api/budgets') {
    sendJson(res, 200, readBudgets());
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/budgets') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '[]');
        const budgets = readBudgets();
        const index = budgets.findIndex(b => b.clientData && b.clientData.docId === payload.clientData?.docId);
        if (index >= 0) budgets[index] = payload; else budgets.push(payload);
        writeBudgets(budgets);
        sendJson(res, 200, { ok: true, budgets });
      } catch (error) {
        sendJson(res, 400, { ok: false, error: 'Invalid payload' });
      }
    });
    return;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/budgets/')) {
    const docId = decodeURIComponent(url.pathname.split('/').pop());
    const budgets = readBudgets().filter(b => (b.clientData && b.clientData.docId) !== docId);
    writeBudgets(budgets);
    sendJson(res, 200, { ok: true, budgets });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor pronto em http://localhost:${PORT}`);
});
