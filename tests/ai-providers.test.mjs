import assert from 'node:assert/strict';
import http from 'node:http';
import { after, test } from 'node:test';
import { once } from 'node:events';

// Servidor local que imita dos proveedores. No se llama a ninguna red externa.
const requests = [];
const provider = http.createServer((req, res) => {
  let raw = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', () => {
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = raw;
    }
    requests.push({ url: req.url, headers: req.headers, body });
    res.setHeader('content-type', 'application/json');
    if (req.url?.endsWith('/messages')) {
      res.end(JSON.stringify({ content: [{ type: 'text', text: 'Respuesta Anthropic de prueba' }] }));
    } else if (req.url?.endsWith('/chat/completions')) {
      res.end(JSON.stringify({ choices: [{ message: { content: 'Respuesta OpenAI de prueba' } }] }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'not found' }));
    }
  });
});
provider.listen(0, '127.0.0.1');
await once(provider, 'listening');
const port = provider.address().port;

after(() => {
  provider.close();
});

test('modo live: proveedor compatible con OpenAI', { concurrency: false }, async () => {
  process.env.AI_API_KEY = 'test-openai-key';
  process.env.AI_MODE = 'live';
  process.env.AI_PROVIDER = 'openai';
  process.env.AI_BASE_URL = `http://127.0.0.1:${port}/v1`;
  process.env.AI_MODEL = 'test-model';

  const module = await import(`../server/ai.js?provider=openai&t=${Date.now()}`);
  assert.equal(module.aiStatus().configured, true);
  assert.equal(module.aiStatus().provider, 'openai-compatible');

  const reply = await module.generateAiReply({
    messages: [{ role: 'user', content: '¿Qué es una derivada?' }],
    subjectName: 'Cálculo Diferencial',
  });

  assert.equal(reply.provider, 'openai-compatible');
  assert.equal(reply.content, 'Respuesta OpenAI de prueba');
  assert.equal(reply.configured, true);

  const request = requests.at(-1);
  assert.equal(request.url, '/v1/chat/completions');
  assert.equal(request.headers.authorization, 'Bearer test-openai-key');
  assert.equal(request.body.model, 'test-model');
  assert.equal(request.body.messages[0].role, 'system');
  assert.match(request.body.messages[0].content, /CampusCode/);
  assert.ok(request.body.messages.some((message) => message.content.includes('Cálculo Diferencial')));
});

test('modo live: API nativa de Anthropic', { concurrency: false }, async () => {
  process.env.AI_API_KEY = 'test-anthropic-key';
  process.env.AI_MODE = 'live';
  process.env.AI_PROVIDER = 'anthropic';
  process.env.AI_BASE_URL = `http://127.0.0.1:${port}/v1`;
  process.env.AI_MODEL = 'test-claude-model';

  const module = await import(`../server/ai.js?provider=anthropic&t=${Date.now()}`);
  assert.equal(module.aiStatus().configured, true);
  assert.equal(module.aiStatus().provider, 'anthropic');

  const reply = await module.generateAiReply({
    messages: [{ role: 'user', content: 'Explícame la recursión' }],
  });

  assert.equal(reply.provider, 'anthropic');
  assert.equal(reply.content, 'Respuesta Anthropic de prueba');
  assert.equal(reply.configured, true);

  const request = requests.at(-1);
  assert.equal(request.url, '/v1/messages');
  assert.equal(request.headers['x-api-key'], 'test-anthropic-key');
  assert.equal(request.headers['anthropic-version'], '2023-06-01');
  assert.equal(request.body.model, 'test-claude-model');
  assert.match(request.body.system, /CampusCode/);
  assert.equal(request.body.messages[0].role, 'user');
});
