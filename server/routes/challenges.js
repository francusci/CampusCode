import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { asString, httpError } from '../validate.js';
import { createNotification, logActivity, newId, parseList } from '../utils.js';

const router = Router();

function mapChallenge(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    problem: row.problem,
    skills: parseList(row.skills),
    category: row.category,
    publishedAt: row.published_at,
    deadline: row.deadline,
    deliverables: row.deliverables,
    requirements: row.requirements,
    status: row.status,
    featured: Boolean(row.featured),
    isDemo: Boolean(row.is_demo),
    company: {
      id: row.company_id,
      name: row.company_name,
      slug: row.company_slug,
      sector: row.company_sector,
      logoColor: row.company_logo_color,
      verified: Boolean(row.company_verified),
      isDemo: Boolean(row.company_is_demo),
    },
  };
}

function isPastDeadline(deadline) {
  return deadline < new Date().toISOString().slice(0, 10);
}

router.get('/challenges', (req, res) => {
  const conditions = ["ch.status != 'draft'"];
  const params = [];
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const skill = typeof req.query.skill === 'string' ? req.query.skill.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

  if (q) {
    conditions.push('(ch.title LIKE ? OR ch.summary LIKE ? OR ch.problem LIKE ? OR ch.skills LIKE ? OR c.name LIKE ?)');
    const term = `%${q}%`;
    params.push(term, term, term, term, term);
  }
  if (category) {
    conditions.push('ch.category = ?');
    params.push(category);
  }
  if (skill) {
    conditions.push('ch.skills LIKE ?');
    params.push(`%${skill}%`);
  }
  if (status) {
    if (!['open', 'closed'].includes(status)) throw httpError(400, 'Estado de reto no válido.', 'VALIDATION_ERROR');
    conditions.push('ch.status = ?');
    params.push(status);
  }

  const rows = db
    .prepare(
      `SELECT ch.*, c.name AS company_name, c.slug AS company_slug, c.sector AS company_sector,
              c.logo_color AS company_logo_color, c.verified AS company_verified, c.is_demo AS company_is_demo
       FROM challenges ch JOIN companies c ON c.id = ch.company_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ch.featured DESC, ch.published_at DESC`,
    )
    .all(...params);

  const categories = db
    .prepare("SELECT DISTINCT category FROM challenges WHERE status != 'draft' ORDER BY category")
    .all()
    .map((row) => row.category);
  const skillRows = db.prepare("SELECT skills FROM challenges WHERE status != 'draft'").all();
  const skills = [...new Set(skillRows.flatMap((row) => parseList(row.skills)))].sort((a, b) => a.localeCompare(b));

  res.json({
    items: rows.map(mapChallenge),
    total: rows.length,
    facets: { categories, skills },
    demoNotice: 'Los retos y empresas de esta sección son ejemplos ficticios para demostración.',
  });
});

router.get('/companies', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, COUNT(ch.id) AS challenge_count
       FROM companies c
       LEFT JOIN challenges ch ON ch.company_id = c.id AND ch.status = 'open'
       GROUP BY c.id ORDER BY c.name`,
    )
    .all();
  res.json({
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sector: row.sector,
      description: row.description,
      website: row.website,
      location: row.location,
      logoColor: row.logo_color,
      verified: Boolean(row.verified),
      isDemo: Boolean(row.is_demo),
      openChallenges: Number(row.challenge_count),
    })),
    demoNotice: 'Empresas de demostración. No representan alianzas reales con CampusCode.',
  });
});

router.get('/challenges/:slug', (req, res) => {
  const row = db
    .prepare(
      `SELECT ch.*, c.name AS company_name, c.slug AS company_slug, c.sector AS company_sector,
              c.logo_color AS company_logo_color, c.verified AS company_verified, c.is_demo AS company_is_demo,
              c.owner_id AS company_owner_id
       FROM challenges ch JOIN companies c ON c.id = ch.company_id
       WHERE ch.slug = ? OR ch.id = ?`,
    )
    .get(req.params.slug, req.params.slug);
  if (!row) throw httpError(404, 'Reto no encontrado.', 'NOT_FOUND');

  const isOwner = req.user && (req.user.id === row.company_owner_id || req.user.role === 'admin');
  if (row.status === 'draft' && !isOwner) throw httpError(404, 'Reto no encontrado.', 'NOT_FOUND');

  let application = null;
  if (req.user?.role === 'student') {
    const app = db
      .prepare('SELECT * FROM applications WHERE challenge_id = ? AND user_id = ?')
      .get(row.id, req.user.id);
    if (app) {
      application = {
        id: app.id,
        status: app.status,
        message: app.message,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
        deliverables: db
          .prepare('SELECT id, title, url, notes, created_at FROM deliverables WHERE application_id = ? ORDER BY created_at DESC')
          .all(app.id),
      };
    }
  }

  res.json({
    challenge: mapChallenge(row),
    application,
    applicationsCount: isOwner
      ? Number(db.prepare('SELECT COUNT(*) AS total FROM applications WHERE challenge_id = ?').get(row.id).total)
      : undefined,
    isPastDeadline: isPastDeadline(row.deadline),
    demoNotice: 'Reto de demostración. La empresa y el caso son ficticios.',
  });
});

router.post('/challenges/:id/applications', requireAuth, (req, res) => {
  if (req.user.role !== 'student') {
    throw httpError(403, 'Solo las cuentas de estudiante pueden postularse a retos.', 'FORBIDDEN');
  }
  const challenge = db
    .prepare(
      `SELECT ch.*, c.owner_id AS owner_id, c.name AS company_name
       FROM challenges ch JOIN companies c ON c.id = ch.company_id
       WHERE ch.id = ?`,
    )
    .get(req.params.id);
  if (!challenge) throw httpError(404, 'Reto no encontrado.', 'NOT_FOUND');
  if (challenge.status !== 'open') throw httpError(409, 'Este reto no está abierto para postulaciones.', 'CHALLENGE_CLOSED');
  if (isPastDeadline(challenge.deadline)) throw httpError(409, 'La fecha límite de este reto ya pasó.', 'CHALLENGE_EXPIRED');

  const existing = db
    .prepare('SELECT id FROM applications WHERE challenge_id = ? AND user_id = ?')
    .get(challenge.id, req.user.id);
  if (existing) throw httpError(409, 'Ya tienes una postulación registrada para este reto.', 'DUPLICATE_APPLICATION');

  const message = req.body.message
    ? asString(req.body.message, 'mensaje de postulación', { max: 1200 })
    : null;
  const id = newId('app');

  db.exec('BEGIN');
  try {
    db.prepare(
      'INSERT INTO applications (id, challenge_id, user_id, message) VALUES (?, ?, ?, ?)',
    ).run(id, challenge.id, req.user.id, message);
    createNotification(
      req.user.id,
      'Postulación registrada',
      `Tu postulación a "${challenge.title}" fue registrada. Puedes seguir su estado en Mis retos.`,
      '/mis-retos',
    );
    createNotification(
      challenge.owner_id,
      'Nueva postulación recibida',
      `${req.user.fullName} se postuló al reto "${challenge.title}".`,
      `/empresa/retos/${challenge.id}`,
    );
    logActivity(req.user.id, 'application', 'challenge', challenge.id, {
      title: challenge.title,
      company: challenge.company_name,
    });
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    if (String(error.message).includes('UNIQUE')) {
      throw httpError(409, 'Ya tienes una postulación registrada para este reto.', 'DUPLICATE_APPLICATION');
    }
    throw error;
  }

  res.status(201).json({
    application: { id, challengeId: challenge.id, status: 'submitted', message },
    message: 'Postulación enviada. La empresa revisará tu perfil y entregables.',
  });
});

router.get('/me/applications', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.*, ch.title, ch.slug, ch.deadline, ch.status AS challenge_status, ch.category,
              c.name AS company_name, c.logo_color AS company_logo_color
       FROM applications a
       JOIN challenges ch ON ch.id = a.challenge_id
       JOIN companies c ON c.id = ch.company_id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`,
    )
    .all(req.user.id);
  const items = rows.map((row) => ({
    id: row.id,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    challenge: {
      id: row.challenge_id,
      title: row.title,
      slug: row.slug,
      deadline: row.deadline,
      status: row.challenge_status,
      category: row.category,
    },
    company: { name: row.company_name, logoColor: row.company_logo_color },
    deliverables: db
      .prepare('SELECT id, title, url, notes, created_at FROM deliverables WHERE application_id = ? ORDER BY created_at DESC')
      .all(row.id),
  }));
  res.json({ items });
});

router.post('/applications/:id/deliverables', requireAuth, (req, res) => {
  if (req.user.role !== 'student') {
    throw httpError(403, 'Solo el estudiante autor puede registrar entregables.', 'FORBIDDEN');
  }
  const application = db
    .prepare(
      `SELECT a.*, ch.title, ch.company_id, c.owner_id
       FROM applications a
       JOIN challenges ch ON ch.id = a.challenge_id
       JOIN companies c ON c.id = ch.company_id
       WHERE a.id = ? AND a.user_id = ?`,
    )
    .get(req.params.id, req.user.id);
  if (!application) throw httpError(404, 'Postulación no encontrada.', 'NOT_FOUND');
  if (application.status === 'withdrawn') {
    throw httpError(409, 'No puedes registrar entregables en una postulación retirada.', 'APPLICATION_WITHDRAWN');
  }
  const title = asString(req.body.title, 'título del entregable', { min: 3, max: 120 });
  const url = asString(req.body.url, 'enlace del entregable', { min: 10, max: 500 });
  if (!/^https?:\/\/[^\s]+$/i.test(url)) {
    throw httpError(400, 'El enlace debe comenzar por http:// o https://.', 'VALIDATION_ERROR');
  }
  const notes = req.body.notes ? asString(req.body.notes, 'notas', { max: 1000 }) : null;
  const id = newId('del');
  db.prepare('INSERT INTO deliverables (id, application_id, title, url, notes) VALUES (?, ?, ?, ?, ?)').run(
    id,
    application.id,
    title,
    url,
    notes,
  );
  createNotification(
    application.owner_id,
    'Nuevo entregable recibido',
    `${req.user.fullName} registró un entregable en "${application.title}".`,
    `/empresa/retos/${application.challenge_id}`,
  );
  logActivity(req.user.id, 'deliverable', 'application', application.id, {
    title,
    challenge: application.title,
  });
  res.status(201).json({ id, message: 'Entregable registrado.' });
});

router.post('/applications/:id/withdraw', requireAuth, (req, res) => {
  const application = db
    .prepare(
      `SELECT a.*, ch.title, c.owner_id
       FROM applications a JOIN challenges ch ON ch.id = a.challenge_id
       JOIN companies c ON c.id = ch.company_id
       WHERE a.id = ? AND a.user_id = ?`,
    )
    .get(req.params.id, req.user.id);
  if (!application) throw httpError(404, 'Postulación no encontrada.', 'NOT_FOUND');
  if (application.status === 'withdrawn') throw httpError(409, 'La postulación ya está retirada.', 'ALREADY_WITHDRAWN');
  db.prepare("UPDATE applications SET status = 'withdrawn', updated_at = datetime('now') WHERE id = ?").run(application.id);
  createNotification(
    application.owner_id,
    'Postulación retirada',
    `${req.user.fullName} retiró su postulación a "${application.title}".`,
    `/empresa/retos/${application.challenge_id}`,
  );
  res.json({ status: 'withdrawn', message: 'Postulación retirada.' });
});

export default router;
