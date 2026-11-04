import { Router } from 'express';
import { db } from '../db.js';
import { httpError, parseJson } from '../validate.js';

const router = Router();

function mapCompany(row) {
  return {
    id: row.company_id,
    name: row.company_name,
    slug: row.company_slug,
    sector: row.company_sector,
    logoColor: row.company_logo_color,
    verified: Boolean(row.company_verified),
    isDemo: Boolean(row.company_is_demo),
  };
}

function mapVacancy(row, { detail = false } = {}) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    type: row.type,
    description: row.description,
    requirements: row.requirements,
    location: row.location,
    modality: row.modality,
    salaryRange: row.salary_range,
    deadline: row.deadline,
    status: row.status,
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    company: mapCompany(row),
    testsCount: Number(row.tests_count || 0),
    ...(detail ? { tests: [] } : {}),
  };
}

function mapTest(row, { detail = false } = {}) {
  const questions = parseJson(row.questions, []);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    instructions: row.instructions,
    durationMinutes: Number(row.duration_minutes),
    passingScore: Number(row.passing_score),
    status: row.status,
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    questionCount: questions.length,
    company: mapCompany(row),
    vacancy: row.vacancy_id
      ? { id: row.vacancy_id, title: row.vacancy_title, slug: row.vacancy_slug }
      : null,
    ...(detail
      ? {
          questions: questions.map((question) => ({
            prompt: question.prompt,
            type: question.type,
            options: Array.isArray(question.options) ? question.options : [],
          })),
        }
      : {}),
  };
}

const VACANCY_QUERY = `
  SELECT v.*, co.id AS company_id, co.name AS company_name, co.slug AS company_slug,
         co.sector AS company_sector, co.logo_color AS company_logo_color,
         co.verified AS company_verified, co.is_demo AS company_is_demo,
         (SELECT COUNT(*) FROM technical_tests tt WHERE tt.vacancy_id = v.id AND tt.status = 'published') AS tests_count
  FROM vacancies v
  JOIN companies co ON co.id = v.company_id
`;

const TEST_QUERY = `
  SELECT tt.*, co.id AS company_id, co.name AS company_name, co.slug AS company_slug,
         co.sector AS company_sector, co.logo_color AS company_logo_color,
         co.verified AS company_verified, co.is_demo AS company_is_demo,
         v.title AS vacancy_title, v.slug AS vacancy_slug
  FROM technical_tests tt
  JOIN companies co ON co.id = tt.company_id
  LEFT JOIN vacancies v ON v.id = tt.vacancy_id
`;

router.get('/vacancies', (req, res) => {
  const type = typeof req.query.type === 'string' ? req.query.type.trim() : '';
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const conditions = ["v.status = 'open'"];
  const params = [];
  if (['empleo', 'practica', 'junior'].includes(type)) {
    conditions.push('v.type = ?');
    params.push(type);
  }
  if (q) {
    conditions.push('(v.title LIKE ? OR v.description LIKE ? OR co.name LIKE ?)');
    const term = `%${q}%`;
    params.push(term, term, term);
  }
  const rows = db
    .prepare(
      `${VACANCY_QUERY} WHERE ${conditions.join(' AND ')}
       ORDER BY CASE v.type WHEN 'junior' THEN 0 WHEN 'practica' THEN 1 ELSE 2 END, v.deadline`,
    )
    .all(...params);
  res.json({ items: rows.map((row) => mapVacancy(row)) });
});

router.get('/vacancies/:slug', (req, res) => {
  const row = db
    .prepare(`${VACANCY_QUERY} WHERE (v.slug = ? OR v.id = ?) AND v.status = 'open'`)
    .get(req.params.slug, req.params.slug);
  if (!row) throw httpError(404, 'Vacante no encontrada o cerrada.', 'NOT_FOUND');
  const vacancy = mapVacancy(row, { detail: true });
  vacancy.tests = db
    .prepare(`${TEST_QUERY} WHERE tt.vacancy_id = ? AND tt.status = 'published' ORDER BY tt.created_at DESC`)
    .all(row.id)
    .map((test) => mapTest(test));
  res.json({ vacancy });
});

router.get('/technical-tests', (req, res) => {
  const conditions = ["tt.status = 'published'"];
  const params = [];
  if (typeof req.query.vacancy === 'string' && req.query.vacancy) {
    conditions.push('(v.slug = ? OR v.id = ?)');
    params.push(req.query.vacancy, req.query.vacancy);
  }
  const rows = db
    .prepare(`${TEST_QUERY} WHERE ${conditions.join(' AND ')} ORDER BY tt.created_at DESC`)
    .all(...params);
  res.json({ items: rows.map((row) => mapTest(row)) });
});

router.get('/technical-tests/:id', (req, res) => {
  const row = db
    .prepare(`${TEST_QUERY} WHERE tt.id = ? AND tt.status = 'published'`)
    .get(req.params.id);
  if (!row) throw httpError(404, 'Prueba técnica no encontrada o no publicada.', 'NOT_FOUND');
  res.json({ test: mapTest(row, { detail: true }) });
});

export default router;
