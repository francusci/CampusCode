import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import {
  answerMatches,
  asDate,
  asInt,
  asOneOf,
  asString,
  httpError,
  parseJson,
} from '../validate.js';
import { logActivity, newId, parseList } from '../utils.js';

const router = Router();

const DIFFICULTIES = ['basico', 'intermedio', 'avanzado'];
const TYPES = ['multiple', 'abierta', 'codigo'];

router.get('/public-summary', (_req, res) => {
  const row = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM careers) AS careers,
        (SELECT COUNT(*) FROM subjects WHERE is_published = 1) AS subjects,
        (SELECT COUNT(*) FROM exercises WHERE is_published = 1) AS exercises,
        (SELECT COUNT(*) FROM challenges WHERE status = 'open') AS challenges,
        (SELECT COUNT(*) FROM companies) AS companies,
        (SELECT COUNT(*) FROM topics) AS topics,
        (SELECT COUNT(*) FROM computers) AS computers_total,
        (SELECT COUNT(*) FROM computers WHERE status = 'available') AS computers_available,
        (SELECT COUNT(*) FROM computers WHERE status = 'in_use') AS computers_in_use,
        (SELECT COUNT(*) FROM computers WHERE status = 'maintenance') AS computers_maintenance,
        (SELECT COUNT(*) FROM computer_loans) AS loans_total,
        (SELECT COUNT(*) FROM computer_loans WHERE date(entry_at) = date('now', 'localtime')) AS loans_today,
        (SELECT COUNT(*) FROM vacancies WHERE status = 'open') AS active_vacancies,
        (SELECT COUNT(*) FROM technical_tests WHERE status = 'published') AS technical_tests`,
    )
    .get();
  const counts = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, Number(value)]),
  );
  res.json({
    careers: counts.careers,
    subjects: counts.subjects,
    exercises: counts.exercises,
    challenges: counts.challenges,
    companies: counts.companies,
    topics: counts.topics,
    activeVacancies: counts.active_vacancies,
    technicalTests: counts.technical_tests,
    demo: true,
    notice: 'Cifras calculadas sobre el catálogo y los registros de demostración de CampusCode.',
    campus: {
      isDemo: true,
      notice: 'Datos ficticios de demostración. No representan estadísticas oficiales de la universidad.',
      computersTotal: counts.computers_total,
      computersAvailable: counts.computers_available,
      computersInUse: counts.computers_in_use,
      computersMaintenance: counts.computers_maintenance,
      loansTotal: counts.loans_total,
      loansToday: counts.loans_today,
      activeVacancies: counts.active_vacancies,
      technicalTests: counts.technical_tests,
    },
  });
});

function mapExercise(row, { detail = false } = {}) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    statement: row.statement,
    difficulty: row.difficulty,
    type: row.type,
    options: parseList(row.options),
    tags: parseList(row.tags),
    author: row.author,
    source: row.source,
    publishedAt: row.published_at,
    isDemo: Boolean(row.is_demo),
    topic: { id: row.topic_id, name: row.topic_name, slug: row.topic_slug },
    subject: { id: row.subject_id, name: row.subject_name, slug: row.subject_slug },
    career: { id: row.career_id, name: row.career_name, slug: row.career_slug },
    userState: {
      status: row.user_status || null,
      attempts: row.attempts || 0,
      isFavorite: Boolean(row.favorite_id),
    },
    ...(detail
      ? {
          hint: row.hint,
          procedure: parseList(row.procedure),
          explanation: row.explanation,
        }
      : {}),
  };
}

function careerRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    faculty: row.faculty,
    description: row.description,
    icon: row.icon,
    color: row.color,
    isDemo: Boolean(row.is_demo),
    counts: {
      subjects: Number(row.subject_count || 0),
      topics: Number(row.topic_count || 0),
      exercises: Number(row.exercise_count || 0),
    },
  };
}

// ---------------------------------------------------------------------------
// Catálogo académico
// ---------------------------------------------------------------------------
router.get('/careers', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const params = [];
  let where = '';
  if (q) {
    where = `WHERE c.name LIKE ? OR c.faculty LIKE ? OR c.description LIKE ? OR EXISTS (
      SELECT 1 FROM subjects sx WHERE sx.career_id = c.id AND sx.name LIKE ? AND sx.is_published = 1
    )`;
    const term = `%${q}%`;
    params.push(term, term, term, term);
  }
  const rows = db
    .prepare(
      `SELECT c.*,
        COUNT(DISTINCT s.id) AS subject_count,
        COUNT(DISTINCT t.id) AS topic_count,
        COUNT(DISTINCT e.id) AS exercise_count
      FROM careers c
      LEFT JOIN subjects s ON s.career_id = c.id AND s.is_published = 1
      LEFT JOIN topics t ON t.subject_id = s.id
      LEFT JOIN exercises e ON e.topic_id = t.id AND e.is_published = 1
      ${where}
      GROUP BY c.id
      ORDER BY c.name`,
    )
    .all(...params);
  res.json({ items: rows.map(careerRow) });
});

router.get('/careers/:slug', (req, res) => {
  const career = db
    .prepare('SELECT * FROM careers WHERE slug = ? OR id = ?')
    .get(req.params.slug, req.params.slug);
  if (!career) throw httpError(404, 'Carrera no encontrada.', 'NOT_FOUND');

  const subjects = db
    .prepare(
      `SELECT s.*, COUNT(DISTINCT e.id) AS exercise_count, COUNT(DISTINCT t.id) AS topic_count
       FROM subjects s
       LEFT JOIN topics t ON t.subject_id = s.id
       LEFT JOIN exercises e ON e.topic_id = t.id AND e.is_published = 1
       WHERE s.career_id = ? AND s.is_published = 1
       GROUP BY s.id
       ORDER BY s.semester, s.name`,
    )
    .all(career.id)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      semester: row.semester,
      credits: row.credits,
      isDemo: Boolean(row.is_demo),
      counts: { exercises: Number(row.exercise_count), topics: Number(row.topic_count) },
    }));

  const recent = db
    .prepare(
      `SELECT e.*, t.id AS topic_id, t.name AS topic_name, t.slug AS topic_slug,
              s.id AS subject_id, s.name AS subject_name, s.slug AS subject_slug,
              c.id AS career_id, c.name AS career_name, c.slug AS career_slug
       FROM exercises e
       JOIN topics t ON t.id = e.topic_id
       JOIN subjects s ON s.id = t.subject_id
       JOIN careers c ON c.id = s.career_id
       WHERE c.id = ? AND e.is_published = 1
       ORDER BY e.published_at DESC LIMIT 4`,
    )
    .all(career.id);

  res.json({ career: careerRow({ ...career, subject_count: subjects.length, exercise_count: subjects.reduce((acc, s) => acc + s.counts.exercises, 0) }), subjects, exercises: recent.map((row) => mapExercise(row)) });
});

router.get('/subjects', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const career = typeof req.query.career === 'string' ? req.query.career.trim() : '';
  const params = [];
  const conditions = ['s.is_published = 1'];
  if (career) {
    conditions.push('(c.slug = ? OR c.id = ?)');
    params.push(career, career);
  }
  if (q) {
    conditions.push('(s.name LIKE ? OR s.description LIKE ? OR c.name LIKE ? OR EXISTS (SELECT 1 FROM topics tx WHERE tx.subject_id = s.id AND tx.name LIKE ?))');
    const term = `%${q}%`;
    params.push(term, term, term, term);
  }
  const rows = db
    .prepare(
      `SELECT s.*, c.name AS career_name, c.slug AS career_slug, c.color AS career_color,
              COUNT(DISTINCT e.id) AS exercise_count, COUNT(DISTINCT t.id) AS topic_count
       FROM subjects s
       JOIN careers c ON c.id = s.career_id
       LEFT JOIN topics t ON t.subject_id = s.id
       LEFT JOIN exercises e ON e.topic_id = t.id AND e.is_published = 1
       WHERE ${conditions.join(' AND ')}
       GROUP BY s.id
       ORDER BY c.name, s.semester, s.name`,
    )
    .all(...params)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      semester: row.semester,
      credits: row.credits,
      career: { id: row.career_id, name: row.career_name, slug: row.career_slug, color: row.career_color },
      counts: { exercises: Number(row.exercise_count), topics: Number(row.topic_count) },
      isDemo: Boolean(row.is_demo),
    }));
  res.json({ items: rows });
});

router.get('/subjects/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT s.*, c.name AS career_name, c.slug AS career_slug, c.id AS career_id
       FROM subjects s JOIN careers c ON c.id = s.career_id
       WHERE (s.id = ? OR s.slug = ?) AND s.is_published = 1`,
    )
    .get(req.params.id, req.params.id);
  if (!row) throw httpError(404, 'Materia no encontrada.', 'NOT_FOUND');

  const topics = db
    .prepare(
      `SELECT t.*, COUNT(DISTINCT e.id) AS exercise_count
       FROM topics t LEFT JOIN exercises e ON e.topic_id = t.id AND e.is_published = 1
       WHERE t.subject_id = ?
       GROUP BY t.id ORDER BY t.position, t.name`,
    )
    .all(row.id)
    .map((topic) => ({
      id: topic.id,
      slug: topic.slug,
      name: topic.name,
      description: topic.description,
      position: topic.position,
      exerciseCount: Number(topic.exercise_count),
    }));

  const exercises = db
    .prepare(
      `SELECT e.*, t.id AS topic_id, t.name AS topic_name, t.slug AS topic_slug,
              s.id AS subject_id, s.name AS subject_name, s.slug AS subject_slug,
              c.id AS career_id, c.name AS career_name, c.slug AS career_slug
       FROM exercises e
       JOIN topics t ON t.id = e.topic_id
       JOIN subjects s ON s.id = t.subject_id
       JOIN careers c ON c.id = s.career_id
       WHERE s.id = ? AND e.is_published = 1
       ORDER BY e.published_at DESC LIMIT 6`,
    )
    .all(row.id);

  res.json({
    subject: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      semester: row.semester,
      credits: row.credits,
      isDemo: Boolean(row.is_demo),
      career: { id: row.career_id, name: row.career_name, slug: row.career_slug },
    },
    topics,
    exercises: exercises.map((exercise) => mapExercise(exercise)),
  });
});

// ---------------------------------------------------------------------------
// Banco de ejercicios
// ---------------------------------------------------------------------------
router.get('/exercises', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 48);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const params = [];
  const conditions = ['e.is_published = 1'];
  const joinParams = [];
  let joins = '';

  if (req.user) {
    joins = `LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = ?
             LEFT JOIN favorites f ON f.exercise_id = e.id AND f.user_id = ?`;
    joinParams.push(req.user.id, req.user.id);
  }

  const career = typeof req.query.career === 'string' ? req.query.career.trim() : '';
  const subject = typeof req.query.subject === 'string' ? req.query.subject.trim() : '';
  const topic = typeof req.query.topic === 'string' ? req.query.topic.trim() : '';
  const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty.trim() : '';
  const type = typeof req.query.type === 'string' ? req.query.type.trim() : '';
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const saved = req.query.saved === '1' || req.query.saved === 'true';

  if (career) {
    conditions.push('(c.slug = ? OR c.id = ?)');
    params.push(career, career);
  }
  if (subject) {
    conditions.push('(s.id = ? OR s.slug = ?)');
    params.push(subject, subject);
  }
  if (topic) {
    conditions.push('(t.id = ? OR t.slug = ?)');
    params.push(topic, topic);
  }
  if (difficulty) {
    asOneOf(difficulty, DIFFICULTIES, 'dificultad');
    conditions.push('e.difficulty = ?');
    params.push(difficulty);
  }
  if (type) {
    asOneOf(type, TYPES, 'tipo');
    conditions.push('e.type = ?');
    params.push(type);
  }
  if (q) {
    conditions.push('(e.title LIKE ? OR e.statement LIKE ? OR e.tags LIKE ? OR t.name LIKE ? OR s.name LIKE ?)');
    const term = `%${q}%`;
    params.push(term, term, term, term, term);
  }
  if (status) {
    if (!req.user) throw httpError(401, 'Inicia sesión para filtrar por tu progreso.', 'AUTH_REQUIRED');
    asOneOf(status, ['completed', 'in_progress', 'pending'], 'estado');
    if (status === 'pending') conditions.push("(p.status IS NULL OR p.status != 'completed')");
    else conditions.push('p.status = ?') && params.push(status);
  }
  if (saved) {
    if (!req.user) throw httpError(401, 'Inicia sesión para ver tus favoritos.', 'AUTH_REQUIRED');
    conditions.push('f.user_id IS NOT NULL');
  }

  const select = `SELECT e.*, t.id AS topic_id, t.name AS topic_name, t.slug AS topic_slug,
      s.id AS subject_id, s.name AS subject_name, s.slug AS subject_slug,
      c.id AS career_id, c.name AS career_name, c.slug AS career_slug,
      ${req.user ? 'p.status AS user_status, p.attempts, f.user_id AS favorite_id' : 'NULL AS user_status, 0 AS attempts, NULL AS favorite_id'}
    FROM exercises e
    JOIN topics t ON t.id = e.topic_id
    JOIN subjects s ON s.id = t.subject_id
    JOIN careers c ON c.id = s.career_id
    ${joins}
    WHERE ${conditions.join(' AND ')}`;

  const sort = req.query.sort === 'title' ? 'e.title ASC' : req.query.sort === 'difficulty' ? "CASE e.difficulty WHEN 'basico' THEN 1 WHEN 'intermedio' THEN 2 ELSE 3 END" : 'e.published_at DESC';
  const rows = db.prepare(`${select} ORDER BY ${sort} LIMIT ? OFFSET ?`).all(...joinParams, ...params, limit, offset);

  const countRow = db
    .prepare(
      `SELECT COUNT(DISTINCT e.id) AS total
       FROM exercises e
       JOIN topics t ON t.id = e.topic_id
       JOIN subjects s ON s.id = t.subject_id
       JOIN careers c ON c.id = s.career_id
       ${joins}
       WHERE ${conditions.join(' AND ')}`,
    )
    .get(...joinParams, ...params);

  res.json({
    items: rows.map((row) => mapExercise(row)),
    total: Number(countRow.total),
    limit,
    offset,
    hasMore: offset + rows.length < Number(countRow.total),
  });
});

router.get('/exercises/:id', (req, res) => {
  const params = [req.params.id];
  let joins = '';
  if (req.user) {
    joins = `LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = ?
             LEFT JOIN favorites f ON f.exercise_id = e.id AND f.user_id = ?`;
    params.unshift(req.user.id, req.user.id);
  }
  const row = db
    .prepare(
      `SELECT e.*, t.id AS topic_id, t.name AS topic_name, t.slug AS topic_slug,
              s.id AS subject_id, s.name AS subject_name, s.slug AS subject_slug,
              c.id AS career_id, c.name AS career_name, c.slug AS career_slug,
              ${req.user ? 'p.status AS user_status, p.attempts, f.user_id AS favorite_id' : 'NULL AS user_status, 0 AS attempts, NULL AS favorite_id'}
       FROM exercises e
       JOIN topics t ON t.id = e.topic_id
       JOIN subjects s ON s.id = t.subject_id
       JOIN careers c ON c.id = s.career_id
       ${joins}
       WHERE e.id = ? AND e.is_published = 1`,
    )
    .get(...params);
  if (!row) throw httpError(404, 'Ejercicio no encontrado.', 'NOT_FOUND');

  const related = db
    .prepare(
      `SELECT e.*, t.id AS topic_id, t.name AS topic_name, t.slug AS topic_slug,
              s.id AS subject_id, s.name AS subject_name, s.slug AS subject_slug,
              c.id AS career_id, c.name AS career_name, c.slug AS career_slug
       FROM exercises e
       JOIN topics t ON t.id = e.topic_id
       JOIN subjects s ON s.id = t.subject_id
       JOIN careers c ON c.id = s.career_id
       WHERE e.topic_id = ? AND e.id != ? AND e.is_published = 1
       ORDER BY e.published_at DESC LIMIT 4`,
    )
    .all(row.topic_id, row.id);

  res.json({ exercise: mapExercise(row, { detail: true }), related: related.map((item) => mapExercise(item)) });
});

router.post('/exercises/:id/check', (req, res) => {
  const row = db
    .prepare(
      `SELECT e.*, s.name AS subject_name FROM exercises e
       JOIN topics t ON t.id = e.topic_id
       JOIN subjects s ON s.id = t.subject_id
       WHERE e.id = ? AND e.is_published = 1`,
    )
    .get(req.params.id);
  if (!row) throw httpError(404, 'Ejercicio no encontrado.', 'NOT_FOUND');

  const answer = asString(req.body.answer, 'respuesta', { min: 1, max: 2000 });
  const correct = answerMatches(answer, row.correct_answer, row.type);

  if (req.user) {
    const existing = db
      .prepare('SELECT * FROM progress WHERE user_id = ? AND exercise_id = ?')
      .get(req.user.id, row.id);
    const alreadyCompleted = existing?.status === 'completed';
    const attempts = (existing?.attempts || 0) + 1;
    const status = correct || alreadyCompleted ? 'completed' : 'in_progress';
    db.prepare(
      `INSERT INTO progress (user_id, exercise_id, status, attempts, last_answer, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, exercise_id) DO UPDATE SET
         status = excluded.status,
         attempts = excluded.attempts,
         last_answer = excluded.last_answer,
         completed_at = COALESCE(progress.completed_at, excluded.completed_at),
         updated_at = datetime('now')`,
    ).run(
      req.user.id,
      row.id,
      status,
      attempts,
      answer,
      correct ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
    );

    if (correct && !alreadyCompleted) {
      logActivity(req.user.id, 'exercise_completed', 'exercise', row.id, {
        title: row.title,
        difficulty: row.difficulty,
        subject: row.subject_name,
      });
    } else if (!existing) {
      logActivity(req.user.id, 'exercise_attempt', 'exercise', row.id, { title: row.title });
    }
  }

  res.json({
    correct,
    message: correct
      ? '¡Correcto! Revisa el procedimiento para consolidar el razonamiento.'
      : 'Todavía no es correcto. Revisa la pista y vuelve a intentarlo; también puedes consultar la solución explicada.',
  });
});

router.post('/exercises/:id/favorite', requireAuth, (req, res) => {
  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    throw httpError(403, 'Solo las cuentas de estudiante pueden guardar favoritos.', 'FORBIDDEN');
  }
  const exercise = db.prepare('SELECT id, title FROM exercises WHERE id = ? AND is_published = 1').get(req.params.id);
  if (!exercise) throw httpError(404, 'Ejercicio no encontrado.', 'NOT_FOUND');

  const existing = db
    .prepare('SELECT 1 FROM favorites WHERE user_id = ? AND exercise_id = ?')
    .get(req.user.id, exercise.id);
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND exercise_id = ?').run(req.user.id, exercise.id);
    return res.json({ favorite: false });
  }
  db.prepare('INSERT INTO favorites (user_id, exercise_id) VALUES (?, ?)').run(req.user.id, exercise.id);
  logActivity(req.user.id, 'favorite', 'exercise', exercise.id, { title: exercise.title });
  res.json({ favorite: true });
});

router.post('/exercises/:id/complete', requireAuth, (req, res) => {
  const exercise = db.prepare('SELECT id, title, difficulty FROM exercises WHERE id = ? AND is_published = 1').get(req.params.id);
  if (!exercise) throw httpError(404, 'Ejercicio no encontrado.', 'NOT_FOUND');
  const existing = db
    .prepare('SELECT status FROM progress WHERE user_id = ? AND exercise_id = ?')
    .get(req.user.id, exercise.id);
  db.prepare(
    `INSERT INTO progress (user_id, exercise_id, status, completed_at, updated_at)
     VALUES (?, ?, 'completed', datetime('now'), datetime('now'))
     ON CONFLICT(user_id, exercise_id) DO UPDATE SET status = 'completed',
       completed_at = COALESCE(progress.completed_at, datetime('now')), updated_at = datetime('now')`,
  ).run(req.user.id, exercise.id);
  if (existing?.status !== 'completed') {
    logActivity(req.user.id, 'exercise_completed', 'exercise', exercise.id, {
      title: exercise.title,
      difficulty: exercise.difficulty,
      manual: true,
    });
  }
  res.json({ completed: true });
});

router.get('/me/favorites', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT e.*, t.id AS topic_id, t.name AS topic_name, t.slug AS topic_slug,
              s.id AS subject_id, s.name AS subject_name, s.slug AS subject_slug,
              c.id AS career_id, c.name AS career_name, c.slug AS career_slug,
              f.user_id AS favorite_id, p.status AS user_status, p.attempts
       FROM favorites f
       JOIN exercises e ON e.id = f.exercise_id AND e.is_published = 1
       JOIN topics t ON t.id = e.topic_id
       JOIN subjects s ON s.id = t.subject_id
       JOIN careers c ON c.id = s.career_id
       LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = f.user_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
    )
    .all(req.user.id);
  res.json({ items: rows.map((row) => mapExercise(row)) });
});

// ---------------------------------------------------------------------------
// Progreso, actividad, objetivos y dashboard
// ---------------------------------------------------------------------------
function goalRows(userId) {
  const goals = db
    .prepare(
      `SELECT g.*, s.name AS subject_name FROM study_goals g
       LEFT JOIN subjects s ON s.id = g.subject_id
       WHERE g.user_id = ? AND g.status != 'archived'
       ORDER BY CASE g.status WHEN 'active' THEN 0 ELSE 1 END, g.created_at DESC`,
    )
    .all(userId);
  return goals.map((goal) => {
    const current = db
      .prepare(
        `SELECT COUNT(*) AS total FROM progress p
         JOIN exercises e ON e.id = p.exercise_id
         JOIN topics t ON t.id = e.topic_id
         WHERE p.user_id = ? AND p.status = 'completed'
           AND p.completed_at >= ?
           ${goal.subject_id ? 'AND t.subject_id = ?' : ''}`,
      )
      .get(...(goal.subject_id ? [userId, goal.created_at, goal.subject_id] : [userId, goal.created_at]));
    const value = Number(current.total);
    return {
      id: goal.id,
      title: goal.title,
      targetCount: goal.target_count,
      current: value,
      percent: Math.min(100, Math.round((value / goal.target_count) * 100)),
      dueDate: goal.due_date,
      status: goal.status,
      subjectId: goal.subject_id,
      subjectName: goal.subject_name,
      createdAt: goal.created_at,
      completedAt: goal.completed_at,
    };
  });
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildSeries(userId, days) {
  // La base guarda timestamps en UTC. Agrupamos por fecha local para que el
  // último día de la serie coincida con el "hoy" que ve la persona.
  const rows = db
    .prepare(
      `SELECT date(created_at, 'localtime') AS day, COUNT(*) AS total
       FROM activity_log
       WHERE user_id = ? AND type = 'exercise_completed'
         AND date(created_at, 'localtime') >= date('now', 'localtime', ?)
       GROUP BY date(created_at, 'localtime')`,
    )
    .all(userId, `-${days - 1} days`);
  const map = new Map(rows.map((row) => [row.day, Number(row.total)]));
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = localDateKey(date);
    series.push({ date: key, count: map.get(key) || 0 });
  }
  return series;
}

function subjectProgress(userId) {
  return db
    .prepare(
      `SELECT s.id, s.name, s.slug, c.name AS career_name,
              COUNT(DISTINCT e.id) AS total,
              COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN e.id END) AS completed,
              COUNT(DISTINCT CASE WHEN p.status = 'in_progress' THEN e.id END) AS in_progress
       FROM subjects s
       JOIN careers c ON c.id = s.career_id
       JOIN topics t ON t.subject_id = s.id
       JOIN exercises e ON e.topic_id = t.id AND e.is_published = 1
       LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = ?
       WHERE s.is_published = 1
       GROUP BY s.id
       ORDER BY completed DESC, total DESC`,
    )
    .all(userId)
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      careerName: row.career_name,
      total: Number(row.total),
      completed: Number(row.completed),
      inProgress: Number(row.in_progress),
      percent: Number(row.total) ? Math.round((Number(row.completed) / Number(row.total)) * 100) : 0,
    }));
}

router.get('/me/progress', requireAuth, (req, res) => {
  const totals = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM progress WHERE user_id = ? AND status = 'completed') AS completed,
        (SELECT COUNT(*) FROM progress WHERE user_id = ? AND status = 'in_progress') AS in_progress,
        (SELECT COUNT(*) FROM favorites WHERE user_id = ?) AS favorites,
        (SELECT COUNT(*) FROM applications WHERE user_id = ? AND status != 'withdrawn') AS applications,
        (SELECT COUNT(*) FROM exercises WHERE is_published = 1) AS available,
        (SELECT COUNT(DISTINCT date(created_at, 'localtime')) FROM activity_log WHERE user_id = ? AND type = 'exercise_completed') AS study_days`,
    )
    .get(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

  const subjects = subjectProgress(req.user.id);
  const difficulties = db
    .prepare(
      `SELECT e.difficulty, COUNT(DISTINCT e.id) AS total,
              COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN e.id END) AS completed
       FROM exercises e
       LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = ?
       WHERE e.is_published = 1
       GROUP BY e.difficulty`,
    )
    .all(req.user.id)
    .map((row) => ({
      difficulty: row.difficulty,
      total: Number(row.total),
      completed: Number(row.completed),
      percent: Number(row.total) ? Math.round((Number(row.completed) / Number(row.total)) * 100) : 0,
    }));

  const recent = db
    .prepare(
      `SELECT a.id, a.type, a.entity_type, a.entity_id, a.metadata, a.created_at
       FROM activity_log a WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 12`,
    )
    .all(req.user.id)
    .map((row) => ({ ...row, metadata: parseJson(row.metadata, {}) }));

  const practicedSubjects = subjects.filter((subject) => subject.completed > 0 || subject.inProgress > 0);
  const strengths = [...practicedSubjects]
    .filter((subject) => subject.completed > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);
  const needsPractice = practicedSubjects
    .filter((subject) => subject.percent < 100)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);

  const goals = goalRows(req.user.id);
  res.json({
    totals: {
      completed: Number(totals.completed),
      inProgress: Number(totals.in_progress),
      favorites: Number(totals.favorites),
      applications: Number(totals.applications),
      available: Number(totals.available),
      studyDays: Number(totals.study_days),
    },
    subjects,
    practicedSubjects,
    difficulties,
    series: buildSeries(req.user.id, 30),
    strengths,
    needsPractice,
    recent,
    goals,
  });
});

router.get('/me/activity', requireAuth, (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const items = db
    .prepare(
      `SELECT id, type, entity_type, entity_id, metadata, created_at
       FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(req.user.id, limit)
    .map((row) => ({ ...row, metadata: parseJson(row.metadata, {}) }));
  res.json({ items });
});

router.get('/me/goals', requireAuth, (req, res) => {
  res.json({ items: goalRows(req.user.id) });
});

router.post('/me/goals', requireAuth, (req, res) => {
  const title = asString(req.body.title, 'título del objetivo', { min: 4, max: 120 });
  const targetCount = asInt(req.body.targetCount, 'meta', { min: 1, max: 200 });
  const dueDate = asDate(req.body.dueDate, 'fecha límite', { optional: true });
  const subjectId = req.body.subjectId ? asString(req.body.subjectId, 'materia', { max: 80 }) : null;
  if (subjectId && !db.prepare('SELECT 1 FROM subjects WHERE id = ?').get(subjectId)) {
    throw httpError(400, 'La materia seleccionada no existe.', 'VALIDATION_ERROR');
  }
  const id = newId('goal');
  db.prepare(
    'INSERT INTO study_goals (id, user_id, subject_id, title, target_count, due_date) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, req.user.id, subjectId, title, targetCount, dueDate);
  logActivity(req.user.id, 'goal_created', 'goal', id, { title });
  res.status(201).json({ item: goalRows(req.user.id).find((goal) => goal.id === id) });
});

router.patch('/me/goals/:id', requireAuth, (req, res) => {
  const goal = db.prepare('SELECT * FROM study_goals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!goal) throw httpError(404, 'Objetivo no encontrado.', 'NOT_FOUND');
  const status = req.body.status ? asOneOf(req.body.status, ['active', 'completed', 'archived'], 'estado') : goal.status;
  const title = req.body.title ? asString(req.body.title, 'título', { min: 4, max: 120 }) : goal.title;
  const targetCount = req.body.targetCount ? asInt(req.body.targetCount, 'meta', { min: 1, max: 200 }) : goal.target_count;
  const dueDate = req.body.dueDate !== undefined ? asDate(req.body.dueDate, 'fecha límite', { optional: true }) : goal.due_date;
  db.prepare(
    `UPDATE study_goals SET title = ?, target_count = ?, due_date = ?, status = ?,
       completed_at = CASE WHEN ? = 'completed' AND completed_at IS NULL THEN datetime('now') ELSE completed_at END
     WHERE id = ?`,
  ).run(title, targetCount, dueDate, status, status, goal.id);
  if (status === 'completed' && goal.status !== 'completed') {
    logActivity(req.user.id, 'goal_completed', 'goal', goal.id, { title });
  }
  res.json({ item: goalRows(req.user.id).find((item) => item.id === goal.id) });
});

router.delete('/me/goals/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM study_goals WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) throw httpError(404, 'Objetivo no encontrado.', 'NOT_FOUND');
  res.json({ ok: true });
});

router.get('/me/dashboard', requireAuth, (req, res) => {
  const totals = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM progress WHERE user_id = ? AND status = 'completed') AS completed,
        (SELECT COUNT(*) FROM progress WHERE user_id = ? AND status = 'in_progress') AS in_progress,
        (SELECT COUNT(*) FROM favorites WHERE user_id = ?) AS favorites,
        (SELECT COUNT(*) FROM applications WHERE user_id = ? AND status != 'withdrawn') AS applications,
        (SELECT COUNT(*) FROM exercises WHERE is_published = 1) AS available,
        (SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read = 0) AS unread,
        (SELECT COUNT(DISTINCT t.subject_id) FROM progress p
          JOIN exercises e ON e.id = p.exercise_id JOIN topics t ON t.id = e.topic_id
          WHERE p.user_id = ? AND p.status = 'completed') AS active_subjects`,
    )
    .get(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

  const continueExercise = db
    .prepare(
      `SELECT e.id, e.title, e.difficulty, s.name AS subject_name
       FROM progress p
       JOIN exercises e ON e.id = p.exercise_id
       JOIN topics t ON t.id = e.topic_id
       JOIN subjects s ON s.id = t.subject_id
       WHERE p.user_id = ? AND p.status = 'in_progress' AND e.is_published = 1
       ORDER BY p.updated_at DESC LIMIT 1`,
    )
    .get(req.user.id);
  const continueMapped = continueExercise
    ? {
        id: continueExercise.id,
        title: continueExercise.title,
        difficulty: continueExercise.difficulty,
        subjectName: continueExercise.subject_name,
      }
    : null;

  const careerId = req.user.profile?.careerId;
  const recommended = db
    .prepare(
      `SELECT e.id, e.title, e.difficulty, s.name AS subject_name
       FROM exercises e
       JOIN topics t ON t.id = e.topic_id
       JOIN subjects s ON s.id = t.subject_id
       WHERE e.is_published = 1
         ${careerId ? 'AND s.career_id = ?' : ''}
         AND NOT EXISTS (SELECT 1 FROM progress p WHERE p.exercise_id = e.id AND p.user_id = ? AND p.status = 'completed')
       ORDER BY e.published_at DESC LIMIT 3`,
    )
    .all(...(careerId ? [careerId, req.user.id] : [req.user.id]))
    .map((row) => ({
      id: row.id,
      title: row.title,
      difficulty: row.difficulty,
      subjectName: row.subject_name,
    }));

  const activity = db
    .prepare(
      `SELECT id, type, entity_type, entity_id, metadata, created_at
       FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 6`,
    )
    .all(req.user.id)
    .map((row) => ({ ...row, metadata: parseJson(row.metadata, {}) }));

  const challenges = db
    .prepare(
      `SELECT ch.id, ch.title, ch.slug, ch.summary, ch.deadline, ch.category, c.name AS company_name
       FROM challenges ch JOIN companies c ON c.id = ch.company_id
       WHERE ch.status = 'open' ORDER BY ch.featured DESC, ch.published_at DESC LIMIT 3`,
    )
    .all();

  const subjects = subjectProgress(req.user.id).filter((subject) => subject.completed > 0 || subject.inProgress > 0).slice(0, 4);
  const newUser = Number(totals.completed) === 0 && Number(totals.in_progress) === 0 && Number(totals.favorites) === 0;

  res.json({
    stats: {
      completed: Number(totals.completed),
      inProgress: Number(totals.in_progress),
      favorites: Number(totals.favorites),
      applications: Number(totals.applications),
      available: Number(totals.available),
      unread: Number(totals.unread),
      activeSubjects: Number(totals.active_subjects),
    },
    continueExercise: continueMapped,
    recommended,
    activity,
    challenges,
    subjects,
    goals: goalRows(req.user.id).slice(0, 2),
    series: buildSeries(req.user.id, 14),
    newUser,
  });
});

router.post('/reports', requireAuth, (req, res) => {
  const targetType = asOneOf(req.body.targetType, ['exercise', 'challenge', 'user'], 'tipo de reporte');
  const targetId = asString(req.body.targetId, 'elemento reportado', { max: 80 });
  const reason = asString(req.body.reason, 'motivo', { min: 10, max: 800 });
  const id = newId('report');
  db.prepare('INSERT INTO reports (id, reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?, ?)').run(
    id,
    req.user.id,
    targetType,
    targetId,
    reason,
  );
  res.status(201).json({ ok: true, id, message: 'Reporte enviado. El equipo administrador lo revisará.' });
});

export default router;
