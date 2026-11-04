import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { asInt, asOneOf, asString, httpError } from '../validate.js';
import { newId } from '../utils.js';

const router = Router();

// La autenticación se limita a las rutas del campus para no interceptar
// otros routers montados sobre /api (por ejemplo, estado de IA o catálogo).
router.use(['/my-subjects', '/computers', '/computer-loans'], requireAuth);

const CONDITIONS = ['excelente', 'bueno', 'con_detalles', 'mantenimiento'];

function mapMySubject(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    semester: row.user_semester ?? row.semester,
    credits: row.user_credits ?? row.credits,
    status: row.status,
    addedAt: row.created_at,
    career: {
      id: row.career_id,
      name: row.career_name,
      slug: row.career_slug,
      color: row.career_color,
    },
    counts: {
      topics: Number(row.topics_count || 0),
      exercises: Number(row.exercises_count || 0),
    },
  };
}

function mySubjectsQuery(where = 'WHERE us.user_id = ?') {
  return `
    SELECT us.id, us.subject_id, us.semester AS user_semester, us.credits AS user_credits,
           us.status, us.created_at, s.name, s.slug, s.description, s.semester, s.credits,
           c.id AS career_id, c.name AS career_name, c.slug AS career_slug, c.color AS career_color,
           (SELECT COUNT(*) FROM topics t WHERE t.subject_id = s.id) AS topics_count,
           (SELECT COUNT(*) FROM exercises e JOIN topics t ON t.id = e.topic_id WHERE t.subject_id = s.id) AS exercises_count
    FROM user_subjects us
    JOIN subjects s ON s.id = us.subject_id
    JOIN careers c ON c.id = s.career_id
    ${where}
  `;
}

router.get('/my-subjects', (req, res) => {
  const items = db
    .prepare(`${mySubjectsQuery()} ORDER BY us.created_at DESC`)
    .all(req.user.id)
    .map(mapMySubject);
  res.json({ items });
});

router.post('/my-subjects', (req, res) => {
  const subjectId = asString(req.body.subjectId, 'materia', { min: 1, max: 80 });
  const subject = db
    .prepare('SELECT * FROM subjects WHERE id = ? AND is_published = 1')
    .get(subjectId);
  if (!subject) throw httpError(404, 'La materia no existe o no está publicada.', 'SUBJECT_NOT_FOUND');

  const semester = req.body.semester === undefined || req.body.semester === ''
    ? subject.semester
    : asInt(req.body.semester, 'semestre', { min: 1, max: 12 });
  const credits = req.body.credits === undefined || req.body.credits === ''
    ? subject.credits
    : asInt(req.body.credits, 'créditos', { min: 1, max: 12 });

  const duplicate = db
    .prepare('SELECT id FROM user_subjects WHERE user_id = ? AND subject_id = ?')
    .get(req.user.id, subjectId);
  if (duplicate) {
    throw httpError(409, 'Ya tienes esta materia en tu tablero.', 'DUPLICATE_SUBJECT');
  }

  const id = newId('usub');
  db.prepare(
    `INSERT INTO user_subjects (id, user_id, subject_id, semester, credits, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
  ).run(id, req.user.id, subjectId, semester, credits);

  const item = db.prepare(`${mySubjectsQuery('WHERE us.id = ? AND us.user_id = ?')}`).get(id, req.user.id);
  res.status(201).json({ item: mapMySubject(item), message: 'Materia agregada a tu tablero.' });
});

router.delete('/my-subjects/:id', (req, res) => {
  const item = db
    .prepare('SELECT * FROM user_subjects WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!item) throw httpError(404, 'Materia no encontrada en tu tablero.', 'NOT_FOUND');
  db.prepare('DELETE FROM user_subjects WHERE id = ? AND user_id = ?').run(item.id, req.user.id);
  res.json({ ok: true, message: 'Materia eliminada de tu tablero.' });
});

function mapComputer(row) {
  return {
    id: row.id,
    room: row.room,
    equipmentNumber: row.equipment_number,
    condition: row.condition,
    status: row.status,
    notes: row.notes,
    activeLoan: Number(row.active_loans || 0) > 0,
    isDemo: Boolean(row.is_demo),
  };
}

function mapLoan(row) {
  return {
    id: row.id,
    room: row.room,
    equipmentNumber: row.equipment_number,
    entryAt: row.entry_at,
    exitAt: row.exit_at,
    condition: row.condition,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    computer: row.computer_id
      ? { id: row.computer_id, room: row.room, equipmentNumber: row.equipment_number }
      : null,
  };
}

function localDateTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function normalizeDateTime(value, field) {
  const raw = asString(value, field, { min: 16, max: 25 });
  const normalized = raw.replace('T', ' ');
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
    throw httpError(400, `El campo ${field} debe incluir fecha y hora válidas.`, 'VALIDATION_ERROR');
  }
  const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized;
  if (Number.isNaN(Date.parse(withSeconds.replace(' ', 'T')))) {
    throw httpError(400, `El campo ${field} debe incluir una fecha válida.`, 'VALIDATION_ERROR');
  }
  return withSeconds;
}

router.get('/computers', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*,
         (SELECT COUNT(*) FROM computer_loans l WHERE l.computer_id = c.id AND l.status = 'active') AS active_loans
       FROM computers c
       ORDER BY c.room, c.equipment_number`,
    )
    .all();
  res.json({
    items: rows.map(mapComputer),
    rooms: [...new Set(rows.map((row) => row.room))],
  });
});

router.get('/computer-loans', (req, res) => {
  const rows = db
    .prepare(
      `SELECT l.*, c.id AS linked_computer_id
       FROM computer_loans l
       LEFT JOIN computers c ON c.id = l.computer_id
       WHERE l.user_id = ?
       ORDER BY CASE l.status WHEN 'active' THEN 0 ELSE 1 END, l.entry_at DESC`,
    )
    .all(req.user.id);
  res.json({ items: rows.map(mapLoan) });
});

router.post('/computer-loans', (req, res) => {
  const room = asString(req.body.room, 'sala', { min: 2, max: 60 });
  const equipmentNumber = asString(req.body.equipmentNumber, 'número de equipo', { min: 1, max: 30 });
  const entryAt = normalizeDateTime(req.body.entryAt, 'hora de entrada');
  const exitAt = req.body.exitAt ? normalizeDateTime(req.body.exitAt, 'hora de salida') : null;
  const condition = asOneOf(req.body.condition, CONDITIONS, 'estado del PC');
  const notes = asString(req.body.notes, 'observaciones', { max: 500, optional: true });

  const computer = db
    .prepare('SELECT * FROM computers WHERE room = ? AND equipment_number = ?')
    .get(room, equipmentNumber);
  if (!computer) throw httpError(404, 'El equipo no existe en la sala indicada.', 'COMPUTER_NOT_FOUND');
  if (computer.status === 'maintenance') {
    throw httpError(409, 'Este equipo está en mantenimiento y no se puede prestar.', 'COMPUTER_MAINTENANCE');
  }
  const active = db
    .prepare("SELECT id FROM computer_loans WHERE computer_id = ? AND status = 'active'")
    .get(computer.id);
  if (active) {
    throw httpError(409, 'Este equipo ya tiene un préstamo activo.', 'COMPUTER_IN_USE');
  }
  if (exitAt && Date.parse(exitAt.replace(' ', 'T')) <= Date.parse(entryAt.replace(' ', 'T'))) {
    throw httpError(400, 'La hora de salida debe ser posterior a la hora de entrada.', 'VALIDATION_ERROR');
  }

  const id = newId('loan');
  const status = exitAt ? 'returned' : 'active';
  const nextComputerStatus = exitAt
    ? condition === 'mantenimiento' ? 'maintenance' : 'available'
    : 'in_use';

  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO computer_loans (
        id, user_id, computer_id, room, equipment_number, entry_at, exit_at,
        condition, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      req.user.id,
      computer.id,
      room,
      equipmentNumber,
      entryAt,
      exitAt,
      condition,
      status,
      notes,
    );
    db.prepare(
      `UPDATE computers SET status = ?, condition = ?,
        notes = COALESCE(?, notes) WHERE id = ?`,
    ).run(nextComputerStatus, condition, notes, computer.id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  const item = db
    .prepare("SELECT l.*, c.id AS linked_computer_id FROM computer_loans l LEFT JOIN computers c ON c.id = l.computer_id WHERE l.id = ?")
    .get(id);
  res.status(201).json({
    item: mapLoan(item),
    message: status === 'returned'
      ? 'Préstamo registrado con salida incluida.'
      : 'Préstamo activo registrado. Recuerda registrar la salida al terminar.',
  });
});

router.patch('/computer-loans/:id/return', (req, res) => {
  const loan = db
    .prepare('SELECT * FROM computer_loans WHERE id = ? AND (user_id = ? OR ? = ?)')
    .get(req.params.id, req.user.id, req.user.role, 'admin');
  if (!loan) throw httpError(404, 'Préstamo no encontrado.', 'NOT_FOUND');
  if (loan.status !== 'active') {
    throw httpError(409, 'Este préstamo ya fue cerrado.', 'LOAN_CLOSED');
  }
  const exitAt = req.body.exitAt
    ? normalizeDateTime(req.body.exitAt, 'hora de salida')
    : localDateTime();
  if (Date.parse(exitAt.replace(' ', 'T')) <= Date.parse(loan.entry_at.replace(' ', 'T'))) {
    throw httpError(400, 'La hora de salida debe ser posterior a la hora de entrada.', 'VALIDATION_ERROR');
  }
  const condition = req.body.condition
    ? asOneOf(req.body.condition, CONDITIONS, 'estado del PC')
    : loan.condition;
  const nextComputerStatus = condition === 'mantenimiento' ? 'maintenance' : 'available';

  db.exec('BEGIN');
  try {
    db.prepare(
      "UPDATE computer_loans SET exit_at = ?, condition = ?, status = 'returned' WHERE id = ?",
    ).run(exitAt, condition, loan.id);
    if (loan.computer_id) {
      db.prepare('UPDATE computers SET status = ?, condition = ? WHERE id = ?').run(
        nextComputerStatus,
        condition,
        loan.computer_id,
      );
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  const item = db
    .prepare("SELECT l.*, c.id AS linked_computer_id FROM computer_loans l LEFT JOIN computers c ON c.id = l.computer_id WHERE l.id = ?")
    .get(loan.id);
  res.json({ item: mapLoan(item), message: 'Salida registrada. El equipo vuelve a estar disponible.' });
});

export default router;
