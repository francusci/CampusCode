import crypto from 'node:crypto';
import { db } from './db.js';

export function newId(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70);
}

export function uniqueSlug(base) {
  const slug = slugify(base) || 'registro';
  let candidate = slug;
  let counter = 2;
  while (db.prepare('SELECT 1 FROM companies WHERE slug = ?').get(candidate)) {
    candidate = `${slug}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export function createNotification(userId, title, body, link = null) {
  db.prepare(
    'INSERT INTO notifications (id, user_id, title, body, link) VALUES (?, ?, ?, ?, ?)',
  ).run(newId('notif'), userId, title, body, link);
}

export function logActivity(userId, type, entityType, entityId, metadata = {}) {
  db.prepare(
    'INSERT INTO activity_log (user_id, type, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?)',
  ).run(userId, type, entityType, entityId ?? null, JSON.stringify(metadata));
}

export function parseList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
