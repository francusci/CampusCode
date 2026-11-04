import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import {
  JWT_SECRET,
  attachUser,
  clearSessionCookie,
  findUserByEmail,
  findUserById,
  publicUser,
  rateLimit,
  requireAuth,
  setSessionCookie,
  signSession,
} from '../auth.js';
import { asEmail, asInt, asOneOf, asPassword, asString, httpError } from '../validate.js';
import { createNotification, newId, uniqueSlug } from '../utils.js';

const router = Router();

const AVATAR_COLORS = ['blue', 'indigo', 'violet', 'cyan', 'emerald', 'amber', 'rose', 'slate'];

function validateUrl(value, field) {
  if (!value) return null;
  const url = asString(value, field, { max: 220 });
  if (!/^https?:\/\/[^\s]+\.[^\s]+$/i.test(url)) {
    throw httpError(400, `El campo ${field} debe ser una URL válida que comience por http:// o https://.`, 'VALIDATION_ERROR');
  }
  return url;
}

router.post(
  '/register',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 12, keyPrefix: 'register' }),
  (req, res) => {
    const fullName = asString(req.body.fullName, 'nombre completo', { min: 3, max: 100 });
    const email = asEmail(req.body.email);
    const password = asPassword(req.body.password);
    const role = asOneOf(req.body.role, ['student', 'company'], 'rol');
    const careerId = req.body.careerId ? asString(req.body.careerId, 'carrera', { max: 80 }) : null;
    const companyName = role === 'company'
      ? asString(req.body.companyName, 'nombre de la empresa', { min: 2, max: 120 })
      : null;
    const sector = role === 'company'
      ? asString(req.body.sector, 'sector', { min: 2, max: 80 })
      : 'Sin definir';

    if (findUserByEmail(email)) {
      throw httpError(409, 'Ya existe una cuenta con este correo electrónico.', 'EMAIL_IN_USE');
    }
    if (careerId && !db.prepare('SELECT 1 FROM careers WHERE id = ?').get(careerId)) {
      throw httpError(400, 'La carrera seleccionada no existe.', 'VALIDATION_ERROR');
    }

    const userId = newId('usr');
    const hash = bcrypt.hashSync(password, 12);

    db.exec('BEGIN');
    try {
      db.prepare(
        'INSERT INTO users (id, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)',
      ).run(userId, email, hash, role, fullName);
      db.prepare(
        'INSERT INTO profiles (user_id, career_id, semester, avatar_color) VALUES (?, ?, ?, ?)',
      ).run(userId, role === 'student' ? careerId : null, null, role === 'company' ? 'cyan' : 'blue');

      if (role === 'company') {
        db.prepare(
          `INSERT INTO companies (id, owner_id, name, slug, sector, description, is_demo)
           VALUES (?, ?, ?, ?, ?, ?, 0)`,
        ).run(
          newId('cmp'),
          userId,
          companyName,
          uniqueSlug(companyName),
          sector,
          `${companyName} se unió a CampusCode para publicar retos académicos.`,
        );
      }

      createNotification(
        userId,
        'Bienvenido a CampusCode',
        role === 'student'
          ? 'Completa tu perfil, elige una materia y resuelve tu primer ejercicio para empezar.'
          : 'Completa el perfil de tu empresa y publica tu primer reto cuando estés listo.',
        role === 'student' ? '/perfil' : '/empresa/perfil',
      );

      const created = findUserById(userId);
      setSessionCookie(res, signSession(created));
      db.exec('COMMIT');
      res.status(201).json({ user: publicUser(created) });
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  },
);

router.post(
  '/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'login' }),
  (req, res) => {
    const email = asEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const row = findUserByEmail(email);

    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      throw httpError(401, 'Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');
    }
    if (!row.is_active) {
      throw httpError(403, 'Esta cuenta está desactivada. Contacta a la administración.', 'ACCOUNT_DISABLED');
    }

    db.prepare("UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(row.id);
    const user = publicUser(findUserById(row.id));
    setSessionCookie(res, signSession(row));
    res.json({ user });
  },
);

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', attachUser, (req, res) => {
  res.json({ user: req.user || null });
});

router.patch('/me/profile', requireAuth, (req, res) => {
  const fullName = asString(req.body.fullName, 'nombre completo', { min: 3, max: 100 });
  const headline = asString(req.body.headline, 'titular', { max: 140, optional: true });
  const bio = asString(req.body.bio, 'biografía', { max: 1200, optional: true });
  const careerId = req.body.careerId ? asString(req.body.careerId, 'carrera', { max: 80 }) : null;
  const semester = asInt(req.body.semester, 'semestre', { min: 1, max: 12, optional: true });
  const website = validateUrl(req.body.website, 'sitio web');
  const linkedin = validateUrl(req.body.linkedin, 'LinkedIn');
  const avatarColor = asOneOf(req.body.avatarColor || 'blue', AVATAR_COLORS, 'color de avatar');

  if (careerId && !db.prepare('SELECT 1 FROM careers WHERE id = ?').get(careerId)) {
    throw httpError(400, 'La carrera seleccionada no existe.', 'VALIDATION_ERROR');
  }
  if (req.user.role === 'company') {
    throw httpError(403, 'El perfil empresarial se edita desde el panel de empresa.', 'FORBIDDEN');
  }

  db.prepare('UPDATE users SET full_name = ?, updated_at = datetime(\'now\') WHERE id = ?').run(fullName, req.user.id);
  db.prepare(
    `UPDATE profiles
     SET headline = ?, bio = ?, career_id = ?, semester = ?, website = ?, linkedin = ?, avatar_color = ?, updated_at = datetime('now')
     WHERE user_id = ?`,
  ).run(headline, bio, careerId, semester, website, linkedin, avatarColor, req.user.id);

  res.json({ user: publicUser(findUserById(req.user.id)) });
});

router.patch('/me/password', requireAuth, (req, res) => {
  const current = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
  const next = asPassword(req.body.newPassword);
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current, row.password_hash)) {
    throw httpError(401, 'La contraseña actual no es correcta.', 'INVALID_CREDENTIALS');
  }
  const hash = bcrypt.hashSync(next, 12);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, req.user.id);
  res.json({ ok: true, message: 'Contraseña actualizada.' });
});

router.delete('/me', requireAuth, (req, res) => {
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(password, row.password_hash)) {
    throw httpError(401, 'La contraseña no es correcta.', 'INVALID_CREDENTIALS');
  }
  db.prepare("UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(req.user.id);
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me/notifications', requireAuth, (req, res) => {
  const items = db
    .prepare(
      'SELECT id, title, body, link, read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 40',
    )
    .all(req.user.id)
    .map((row) => ({ ...row, read: Boolean(row.read) }));
  res.json({ items, unread: items.filter((item) => !item.read).length });
});

router.post('/me/notifications/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

router.patch('/me/notifications/:id/read', requireAuth, (req, res) => {
  const result = db
    .prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  if (result.changes === 0) throw httpError(404, 'Notificación no encontrada.', 'NOT_FOUND');
  res.json({ ok: true });
});

// Expuesto solo para que el arranque falle de forma explícita si falta el
// secreto en producción (se comprueba en index.js).
export const hasConfiguredSecret = Boolean(process.env.JWT_SECRET) && JWT_SECRET !== 'campuscode-dev-only-secret-change-me';

export default router;
