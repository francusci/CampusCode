import { Router } from 'express';
import { db } from '../db.js';
import { aiStatus, generateAiReply } from '../ai.js';
import { rateLimit, requireAuth } from '../auth.js';
import { asString, httpError } from '../validate.js';
import { newId } from '../utils.js';

const router = Router();

function mapConversation(row) {
  return {
    id: row.id,
    title: row.title,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    isDemo: Boolean(row.is_demo),
    messageCount: Number(row.message_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getConversation(id, userId) {
  const row = db
    .prepare(
      `SELECT c.*, s.name AS subject_name,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count
       FROM conversations c LEFT JOIN subjects s ON s.id = c.subject_id
       WHERE c.id = ? AND c.user_id = ?`,
    )
    .get(id, userId);
  if (!row) throw httpError(404, 'Conversación no encontrada.', 'NOT_FOUND');
  return row;
}

router.get('/ai/status', (_req, res) => {
  res.json(aiStatus());
});

router.post(
  '/ai/guest',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 12, keyPrefix: 'ai-guest' }),
  async (req, res) => {
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    if (messages.length === 0) throw httpError(400, 'Escribe una pregunta para continuar.', 'VALIDATION_ERROR');
    const sanitized = messages
      .filter((message) => message && message.role === 'user' && typeof message.content === 'string')
      .slice(-6)
      .map((message) => ({ role: 'user', content: asString(message.content, 'mensaje', { min: 1, max: 3000 }) }));
    if (sanitized.length === 0) throw httpError(400, 'Escribe una pregunta para continuar.', 'VALIDATION_ERROR');

    const reply = await generateAiReply({ messages: sanitized, subjectName: null });
    res.json({
      reply,
      persisted: false,
      notice: 'Modo visitante: la conversación no se guarda. Inicia sesión para conservar tu historial.',
    });
  },
);

router.get('/conversations', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, s.name AS subject_name,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count
       FROM conversations c LEFT JOIN subjects s ON s.id = c.subject_id
       WHERE c.user_id = ? ORDER BY c.updated_at DESC`,
    )
    .all(req.user.id);
  res.json({ items: rows.map(mapConversation) });
});

router.post('/conversations', requireAuth, (req, res) => {
  const subjectId = req.body.subjectId ? asString(req.body.subjectId, 'materia', { max: 80 }) : null;
  if (subjectId && !db.prepare('SELECT 1 FROM subjects WHERE id = ?').get(subjectId)) {
    throw httpError(400, 'La materia seleccionada no existe.', 'VALIDATION_ERROR');
  }
  const title = req.body.title ? asString(req.body.title, 'título', { min: 2, max: 90 }) : 'Nueva conversación';
  const id = newId('conv');
  db.prepare('INSERT INTO conversations (id, user_id, subject_id, title) VALUES (?, ?, ?, ?)').run(
    id,
    req.user.id,
    subjectId,
    title,
  );
  res.status(201).json({ conversation: mapConversation(getConversation(id, req.user.id)), messages: [] });
});

router.get('/conversations/:id', requireAuth, (req, res) => {
  const conversation = getConversation(req.params.id, req.user.id);
  const messages = db
    .prepare('SELECT id, role, content, provider, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at, id')
    .all(conversation.id);
  res.json({ conversation: mapConversation(conversation), messages });
});

router.patch('/conversations/:id', requireAuth, (req, res) => {
  const conversation = getConversation(req.params.id, req.user.id);
  const title = req.body.title ? asString(req.body.title, 'título', { min: 2, max: 90 }) : conversation.title;
  const subjectId = req.body.subjectId === undefined
    ? conversation.subject_id
    : req.body.subjectId
      ? asString(req.body.subjectId, 'materia', { max: 80 })
      : null;
  if (subjectId && !db.prepare('SELECT 1 FROM subjects WHERE id = ?').get(subjectId)) {
    throw httpError(400, 'La materia seleccionada no existe.', 'VALIDATION_ERROR');
  }
  db.prepare("UPDATE conversations SET title = ?, subject_id = ?, updated_at = datetime('now') WHERE id = ?").run(
    title,
    subjectId,
    conversation.id,
  );
  res.json({ conversation: mapConversation(getConversation(conversation.id, req.user.id)) });
});

router.delete('/conversations/:id', requireAuth, (req, res) => {
  const conversation = getConversation(req.params.id, req.user.id);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(conversation.id);
  res.json({ ok: true });
});

router.post(
  '/conversations/:id/messages',
  requireAuth,
  rateLimit({ windowMs: 60 * 60 * 1000, max: 40, keyPrefix: 'ai-user' }),
  async (req, res) => {
    const conversation = getConversation(req.params.id, req.user.id);
    const content = asString(req.body.content, 'mensaje', { min: 1, max: 4000 });

    const userMessage = {
      id: newId('msg'),
      role: 'user',
      content,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    db.prepare('INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)').run(
      userMessage.id,
      conversation.id,
      'user',
      content,
      userMessage.created_at,
    );

    const history = db
      .prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at, id')
      .all(conversation.id);

    let reply;
    try {
      reply = await generateAiReply({
        messages: history,
        subjectName: conversation.subject_name,
      });
    } catch (error) {
      // La pregunta del usuario queda guardada para que pueda reintentar.
      db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conversation.id);
      throw error;
    }

    const assistantMessage = {
      id: newId('msg'),
      role: 'assistant',
      content: reply.content,
      provider: reply.provider,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, provider, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(assistantMessage.id, conversation.id, 'assistant', assistantMessage.content, assistantMessage.provider, assistantMessage.created_at);

    const title = conversation.title === 'Nueva conversación'
      ? content.replace(/\s+/g, ' ').slice(0, 68) + (content.length > 68 ? '…' : '')
      : conversation.title;
    db.prepare("UPDATE conversations SET title = ?, updated_at = datetime('now') WHERE id = ?").run(title, conversation.id);

    res.status(201).json({
      userMessage,
      reply: assistantMessage,
      configured: reply.configured,
      conversation: mapConversation(getConversation(conversation.id, req.user.id)),
    });
  },
);

export default router;
