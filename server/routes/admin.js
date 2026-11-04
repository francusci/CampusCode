import { Router } from 'express';
import { db } from '../db.js';
import { requireRole } from '../auth.js';
import { asInt, asOneOf, asString, httpError } from '../validate.js';
import { newId, parseList, slugify } from '../utils.js';

const router = Router();
router.use(requireRole('admin'));

router.get('/overview', (_req, res) => {
  const counts = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
        (SELECT COUNT(*) FROM users WHERE role = 'company') AS companies,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins,
        (SELECT COUNT(*) FROM careers) AS careers,
        (SELECT COUNT(*) FROM subjects) AS subjects,
        (SELECT COUNT(*) FROM exercises) AS exercises,
        (SELECT COUNT(*) FROM challenges) AS challenges,
        (SELECT COUNT(*) FROM challenges WHERE status = 'open') AS open_challenges,
        (SELECT COUNT(*) FROM applications) AS applications,
        (SELECT COUNT(*) FROM reports WHERE status = 'open') AS open_reports,
        (SELECT COUNT(*) FROM conversations) AS conversations`,
    )
    .get();
  const recentUsers = db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.role, u.is_active, u.created_at
       FROM users u ORDER BY u.created_at DESC LIMIT 6`,
    )
    .all();
  const recentReports = db
    .prepare(
      `SELECT r.*, u.full_name AS reporter_name FROM reports r
       LEFT JOIN users u ON u.id = r.reporter_id
       ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END, r.created_at DESC LIMIT 6`,
    )
    .all();
  const recentActivity = db
    .prepare(
      `SELECT a.type, a.created_at, u.full_name, a.metadata FROM activity_log a
       JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 8`,
    )
    .all()
    .map((row) => ({ ...row, metadata: JSON.parse(row.metadata || '{}') }));

  res.json({
    counts: Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(value)])),
    recentUsers,
    reports: recentReports.map((row) => ({ ...row, read: undefined })),
    recentActivity,
  });
});

router.get('/users', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const role = typeof req.query.role === 'string' ? req.query.role.trim() : '';
  const conditions = ['1 = 1'];
  const params = [];
  if (q) {
    conditions.push('(u.full_name LIKE ? OR u.email LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (role) {
    asOneOf(role, ['student', 'company', 'admin'], 'rol');
    conditions.push('u.role = ?');
    params.push(role);
  }
  const rows = db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.role, u.is_active, u.created_at, u.last_login_at,
              p.headline, p.semester, c.name AS career_name, co.name AS company_name
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN careers c ON c.id = p.career_id
       LEFT JOIN companies co ON co.owner_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY CASE u.role WHEN 'admin' THEN 0 WHEN 'company' THEN 1 ELSE 2 END, u.created_at DESC`,
    )
    .all(...params);
  res.json({
    items: rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
      headline: row.headline,
      semester: row.semester,
      careerName: row.career_name,
      companyName: row.company_name,
    })),
  });
});

router.patch('/users/:id', (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) throw httpError(404, 'Usuario no encontrado.', 'NOT_FOUND');
  if (target.id === req.user.id && (req.body.role || req.body.isActive === false)) {
    throw httpError(409, 'No puedes cambiar tu propio rol ni desactivar tu cuenta.', 'SELF_ACTION_BLOCKED');
  }
  const role = req.body.role ? asOneOf(req.body.role, ['student', 'company', 'admin'], 'rol') : target.role;
  const isActive = req.body.isActive === undefined ? target.is_active : req.body.isActive ? 1 : 0;

  if (target.role === 'admin' && (role !== 'admin' || isActive === 0)) {
    const admins = db.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1").get();
    if (Number(admins.total) <= 1) {
      throw httpError(409, 'Debe existir al menos un administrador activo.', 'LAST_ADMIN');
    }
  }
  if (role === 'company' && target.role !== 'company') {
    const hasCompany = db.prepare('SELECT 1 FROM companies WHERE owner_id = ?').get(target.id);
    if (!hasCompany) {
      throw httpError(409, 'Crea el perfil empresarial antes de asignar este rol.', 'COMPANY_PROFILE_REQUIRED');
    }
  }
  db.prepare("UPDATE users SET role = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?").run(role, isActive, target.id);
  res.json({ ok: true });
});

router.get('/catalog', (_req, res) => {
  const careers = db
    .prepare(
      `SELECT c.*, COUNT(DISTINCT s.id) AS subject_count,
              COUNT(DISTINCT e.id) AS exercise_count
       FROM careers c
       LEFT JOIN subjects s ON s.career_id = c.id
       LEFT JOIN topics t ON t.subject_id = s.id
       LEFT JOIN exercises e ON e.topic_id = t.id
       GROUP BY c.id ORDER BY c.name`,
    )
    .all()
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      faculty: row.faculty,
      description: row.description,
      icon: row.icon,
      color: row.color,
      isDemo: Boolean(row.is_demo),
      subjectCount: Number(row.subject_count),
      exerciseCount: Number(row.exercise_count),
    }));
  const subjects = db
    .prepare(
      `SELECT s.*, c.name AS career_name, COUNT(DISTINCT e.id) AS exercise_count
       FROM subjects s JOIN careers c ON c.id = s.career_id
       LEFT JOIN topics t ON t.subject_id = s.id
       LEFT JOIN exercises e ON e.topic_id = t.id
       GROUP BY s.id ORDER BY c.name, s.semester, s.name`,
    )
    .all();
  res.json({ careers, subjects });
});

router.post('/careers', (req, res) => {
  const name = asString(req.body.name, 'nombre', { min: 4, max: 100 });
  const faculty = asString(req.body.faculty, 'facultad', { min: 4, max: 120 });
  const description = asString(req.body.description, 'descripción', { min: 10, max: 500 });
  const icon = asString(req.body.icon || 'Compass', 'icono', { max: 30 });
  const color = asOneOf(req.body.color || 'blue', ['blue', 'cyan', 'amber', 'rose', 'emerald', 'violet', 'slate'], 'color');
  const id = newId('car');
  const base = slugify(name);
  let slug = base;
  let counter = 2;
  while (db.prepare('SELECT 1 FROM careers WHERE slug = ?').get(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  db.prepare(
    'INSERT INTO careers (id, slug, name, faculty, description, icon, color, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
  ).run(id, slug, name, faculty, description, icon, color);
  res.status(201).json({ item: { id, slug, name } });
});

router.post('/subjects', (req, res) => {
  const careerId = asString(req.body.careerId, 'carrera', { max: 80 });
  if (!db.prepare('SELECT 1 FROM careers WHERE id = ?').get(careerId)) {
    throw httpError(400, 'La carrera no existe.', 'VALIDATION_ERROR');
  }
  const name = asString(req.body.name, 'nombre', { min: 4, max: 100 });
  const description = asString(req.body.description, 'descripción', { min: 10, max: 500 });
  const semester = asInt(req.body.semester, 'semestre', { min: 1, max: 12, optional: true });
  const credits = asInt(req.body.credits, 'créditos', { min: 1, max: 12, optional: true });
  const id = newId('sub');
  const base = slugify(name);
  let slug = base;
  let counter = 2;
  while (db.prepare('SELECT 1 FROM subjects WHERE career_id = ? AND slug = ?').get(careerId, slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  db.prepare(
    'INSERT INTO subjects (id, career_id, slug, name, description, semester, credits, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
  ).run(id, careerId, slug, name, description, semester, credits);
  res.status(201).json({ item: { id, slug, name } });
});

router.patch('/subjects/:id', (req, res) => {
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
  if (!subject) throw httpError(404, 'Materia no encontrada.', 'NOT_FOUND');
  const isPublished = req.body.isPublished === undefined ? subject.is_published : req.body.isPublished ? 1 : 0;
  db.prepare('UPDATE subjects SET is_published = ? WHERE id = ?').run(isPublished, subject.id);
  res.json({ isPublished: Boolean(isPublished) });
});

router.get('/exercises', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const params = [];
  let where = '1 = 1';
  if (q) {
    where += ' AND (e.title LIKE ? OR s.name LIKE ? OR t.name LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const rows = db
    .prepare(
      `SELECT e.id, e.title, e.difficulty, e.type, e.is_published, e.is_demo, e.published_at,
              e.author, s.name AS subject_name, t.name AS topic_name, c.name AS career_name
       FROM exercises e
       JOIN topics t ON t.id = e.topic_id
       JOIN subjects s ON s.id = t.subject_id
       JOIN careers c ON c.id = s.career_id
       WHERE ${where}
       ORDER BY e.published_at DESC`,
    )
    .all(...params);
  res.json({ items: rows.map((row) => ({ ...row, isPublished: Boolean(row.is_published), isDemo: Boolean(row.is_demo) })) });
});

router.patch('/exercises/:id', (req, res) => {
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!exercise) throw httpError(404, 'Ejercicio no encontrado.', 'NOT_FOUND');
  const isPublished = req.body.isPublished === undefined ? exercise.is_published : req.body.isPublished ? 1 : 0;
  db.prepare("UPDATE exercises SET is_published = ?, updated_at = datetime('now') WHERE id = ?").run(isPublished, exercise.id);
  res.json({ isPublished: Boolean(isPublished) });
});

router.get('/challenges', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const params = [];
  let where = '1 = 1';
  if (q) {
    where += ' AND (ch.title LIKE ? OR c.name LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  const rows = db
    .prepare(
      `SELECT ch.*, c.name AS company_name,
              (SELECT COUNT(*) FROM applications a WHERE a.challenge_id = ch.id) AS applications_count
       FROM challenges ch JOIN companies c ON c.id = ch.company_id
       WHERE ${where}
       ORDER BY ch.created_at DESC`,
    )
    .all(...params);
  res.json({
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      companyName: row.company_name,
      category: row.category,
      status: row.status,
      featured: Boolean(row.featured),
      isDemo: Boolean(row.is_demo),
      deadline: row.deadline,
      applicationsCount: Number(row.applications_count),
      createdAt: row.created_at,
    })),
  });
});

router.patch('/challenges/:id', (req, res) => {
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  if (!challenge) throw httpError(404, 'Reto no encontrado.', 'NOT_FOUND');
  const status = req.body.status ? asOneOf(req.body.status, ['draft', 'open', 'closed'], 'estado') : challenge.status;
  const featured = req.body.featured === undefined ? challenge.featured : req.body.featured ? 1 : 0;
  db.prepare("UPDATE challenges SET status = ?, featured = ?, updated_at = datetime('now') WHERE id = ?").run(
    status,
    featured,
    challenge.id,
  );
  res.json({ status, featured: Boolean(featured) });
});

router.get('/reports', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const params = [];
  let where = '1 = 1';
  if (status) {
    asOneOf(status, ['open', 'reviewed', 'dismissed'], 'estado');
    where = 'r.status = ?';
    params.push(status);
  }
  const rows = db
    .prepare(
      `SELECT r.*, u.full_name AS reporter_name, u.email AS reporter_email
       FROM reports r LEFT JOIN users u ON u.id = r.reporter_id
       WHERE ${where} ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END, r.created_at DESC`,
    )
    .all(...params);
  res.json({ items: rows });
});

router.patch('/reports/:id', (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) throw httpError(404, 'Reporte no encontrado.', 'NOT_FOUND');
  const status = asOneOf(req.body.status, ['open', 'reviewed', 'dismissed'], 'estado');
  db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, report.id);
  res.json({ status });
});

export default router;
