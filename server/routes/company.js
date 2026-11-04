import { Router } from 'express';
import { db } from '../db.js';
import { ownedCompany, requireRole } from '../auth.js';
import {
  asDate,
  asInt,
  asOneOf,
  asString,
  asStringArray,
  httpError,
} from '../validate.js';
import { createNotification, logActivity, newId, parseList, slugify } from '../utils.js';

const router = Router();
router.use(requireRole('company'));

function getCompany(req) {
  const company = ownedCompany(req.user.id);
  if (!company) throw httpError(404, 'No se encontró el perfil empresarial.', 'COMPANY_NOT_FOUND');
  return company;
}

function mapCompany(row) {
  return {
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
  };
}

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    applicationsCount: Number(row.applications_count || 0),
    newApplications: Number(row.new_applications || 0),
  };
}

function uniqueChallengeSlug(title, currentId = null) {
  const base = slugify(title) || 'reto';
  let candidate = base;
  let counter = 2;
  while (true) {
    const found = db.prepare('SELECT id FROM challenges WHERE slug = ?').get(candidate);
    if (!found || found.id === currentId) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

function ensureOwnedChallenge(req) {
  const company = getCompany(req);
  const challenge = db
    .prepare('SELECT * FROM challenges WHERE id = ? AND company_id = ?')
    .get(req.params.id, company.id);
  if (!challenge) throw httpError(404, 'Reto no encontrado o no pertenece a tu empresa.', 'NOT_FOUND');
  return { company, challenge };
}

function mapVacancy(row) {
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
    updatedAt: row.updated_at,
    testsCount: Number(row.tests_count || 0),
  };
}

function mapTechnicalTest(row) {
  const questions = parseList(row.questions);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    instructions: row.instructions,
    durationMinutes: Number(row.duration_minutes),
    passingScore: Number(row.passing_score),
    questions,
    questionCount: questions.length,
    status: row.status,
    isDemo: Boolean(row.is_demo),
    vacancyId: row.vacancy_id,
    vacancyTitle: row.vacancy_title ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function uniqueVacancySlug(title, currentId = null) {
  const base = slugify(title) || 'vacante';
  let candidate = base;
  let counter = 2;
  while (true) {
    const found = db.prepare('SELECT id FROM vacancies WHERE slug = ?').get(candidate);
    if (!found || found.id === currentId) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

function ensureOwnedVacancy(req) {
  const company = getCompany(req);
  const vacancy = db
    .prepare('SELECT * FROM vacancies WHERE id = ? AND company_id = ?')
    .get(req.params.id, company.id);
  if (!vacancy) throw httpError(404, 'Vacante no encontrada o no pertenece a tu empresa.', 'NOT_FOUND');
  return { company, vacancy };
}

function ensureOwnedTechnicalTest(req) {
  const company = getCompany(req);
  const test = db
    .prepare(
      `SELECT tt.*, v.title AS vacancy_title
       FROM technical_tests tt
       LEFT JOIN vacancies v ON v.id = tt.vacancy_id
       WHERE tt.id = ? AND tt.company_id = ?`,
    )
    .get(req.params.id, company.id);
  if (!test) throw httpError(404, 'Prueba técnica no encontrada.', 'NOT_FOUND');
  return { company, test };
}

function listCompanyVacancies(companyId) {
  return db
    .prepare(
      `SELECT v.*,
        (SELECT COUNT(*) FROM technical_tests tt WHERE tt.vacancy_id = v.id) AS tests_count
       FROM vacancies v WHERE v.company_id = ?
       ORDER BY CASE v.status WHEN 'open' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, v.updated_at DESC`,
    )
    .all(companyId)
    .map(mapVacancy);
}

function listCompanyTests(companyId) {
  return db
    .prepare(
      `SELECT tt.*, v.title AS vacancy_title
       FROM technical_tests tt
       LEFT JOIN vacancies v ON v.id = tt.vacancy_id
       WHERE tt.company_id = ?
       ORDER BY CASE tt.status WHEN 'published' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, tt.updated_at DESC`,
    )
    .all(companyId)
    .map(mapTechnicalTest);
}

router.get('/overview', (req, res) => {
  const company = getCompany(req);
  const stats = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM challenges WHERE company_id = ? AND status = 'open') AS open_challenges,
        (SELECT COUNT(*) FROM challenges WHERE company_id = ? AND status = 'draft') AS draft_challenges,
        (SELECT COUNT(*) FROM applications a JOIN challenges ch ON ch.id = a.challenge_id WHERE ch.company_id = ?) AS applications,
        (SELECT COUNT(*) FROM applications a JOIN challenges ch ON ch.id = a.challenge_id WHERE ch.company_id = ? AND a.status = 'submitted') AS new_applications,
        (SELECT COUNT(*) FROM applications a JOIN challenges ch ON ch.id = a.challenge_id WHERE ch.company_id = ? AND a.status = 'accepted') AS accepted,
        (SELECT COUNT(*) FROM vacancies WHERE company_id = ? AND status = 'open') AS open_vacancies,
        (SELECT COUNT(*) FROM vacancies WHERE company_id = ?) AS total_vacancies,
        (SELECT COUNT(*) FROM technical_tests WHERE company_id = ? AND status = 'published') AS published_tests,
        (SELECT COUNT(*) FROM technical_tests WHERE company_id = ?) AS total_tests`,
    )
    .get(
      company.id,
      company.id,
      company.id,
      company.id,
      company.id,
      company.id,
      company.id,
      company.id,
      company.id,
    );

  const challenges = db
    .prepare(
      `SELECT ch.*,
        (SELECT COUNT(*) FROM applications a WHERE a.challenge_id = ch.id) AS applications_count,
        (SELECT COUNT(*) FROM applications a WHERE a.challenge_id = ch.id AND a.status = 'submitted') AS new_applications
       FROM challenges ch WHERE ch.company_id = ?
       ORDER BY CASE ch.status WHEN 'open' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, ch.updated_at DESC`,
    )
    .all(company.id)
    .map(mapChallenge);

  const recentApplications = db
    .prepare(
      `SELECT a.*, ch.title AS challenge_title, ch.id AS challenge_id,
              u.full_name AS student_name, u.email AS student_email,
              p.headline, p.semester, ca.name AS career_name
       FROM applications a
       JOIN challenges ch ON ch.id = a.challenge_id
       JOIN users u ON u.id = a.user_id
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN careers ca ON ca.id = p.career_id
       WHERE ch.company_id = ?
       ORDER BY a.created_at DESC LIMIT 6`,
    )
    .all(company.id)
    .map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.created_at,
      message: row.message,
      challenge: { id: row.challenge_id, title: row.challenge_title },
      student: {
        name: row.student_name,
        email: row.student_email,
        headline: row.headline,
        semester: row.semester,
        careerName: row.career_name,
      },
    }));

  res.json({
    company: mapCompany(company),
    stats: {
      openChallenges: Number(stats.open_challenges),
      draftChallenges: Number(stats.draft_challenges),
      applications: Number(stats.applications),
      newApplications: Number(stats.new_applications),
      accepted: Number(stats.accepted),
      openVacancies: Number(stats.open_vacancies),
      totalVacancies: Number(stats.total_vacancies),
      publishedTests: Number(stats.published_tests),
      totalTests: Number(stats.total_tests),
    },
    challenges,
    vacancies: listCompanyVacancies(company.id).slice(0, 5),
    technicalTests: listCompanyTests(company.id).slice(0, 5),
    recentApplications,
  });
});

router.get('/profile', (req, res) => {
  const company = getCompany(req);
  res.json({ company: mapCompany(company) });
});

router.patch('/profile', (req, res) => {
  const company = getCompany(req);
  const name = asString(req.body.name, 'nombre de la empresa', { min: 2, max: 120 });
  const sector = asString(req.body.sector, 'sector', { min: 2, max: 80 });
  const description = asString(req.body.description, 'descripción', { max: 1500, optional: true }) || '';
  const location = asString(req.body.location, 'ubicación', { max: 120, optional: true });
  const website = req.body.website ? asString(req.body.website, 'sitio web', { max: 220 }) : null;
  if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) {
    throw httpError(400, 'El sitio web debe ser una URL válida.', 'VALIDATION_ERROR');
  }
  const logoColor = asOneOf(req.body.logoColor || company.logo_color, ['blue', 'indigo', 'violet', 'cyan', 'emerald', 'amber', 'rose'], 'color');
  db.prepare(
    `UPDATE companies SET name = ?, sector = ?, description = ?, location = ?, website = ?, logo_color = ?,
      updated_at = datetime('now') WHERE id = ?`,
  ).run(name, sector, description, location, website, logoColor, company.id);
  res.json({
    company: mapCompany(db.prepare('SELECT * FROM companies WHERE id = ?').get(company.id)),
    message: 'Perfil empresarial actualizado.',
  });
});

router.get('/challenges', (req, res) => {
  const company = getCompany(req);
  const rows = db
    .prepare(
      `SELECT ch.*,
        (SELECT COUNT(*) FROM applications a WHERE a.challenge_id = ch.id) AS applications_count,
        (SELECT COUNT(*) FROM applications a WHERE a.challenge_id = ch.id AND a.status = 'submitted') AS new_applications
       FROM challenges ch WHERE ch.company_id = ?
       ORDER BY CASE ch.status WHEN 'open' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, ch.updated_at DESC`,
    )
    .all(company.id);
  res.json({ items: rows.map(mapChallenge) });
});

function challengePayload(body, { partial = false, current = null } = {}) {
  const get = (field, fallback) => (partial && body[field] === undefined ? fallback : body[field]);
  const title = asString(get('title', current?.title), 'título', { min: 8, max: 140 });
  const summary = asString(get('summary', current?.summary), 'resumen', { min: 20, max: 400 });
  const description = asString(get('description', current?.description), 'descripción', { min: 30, max: 4000 });
  const problem = asString(get('problem', current?.problem), 'problema', { min: 20, max: 2500 });
  const skills = asStringArray(get('skills', current ? parseList(current.skills) : []), 'habilidades', { maxItems: 10, maxLength: 40 });
  if (skills.length === 0) throw httpError(400, 'Agrega al menos una habilidad requerida.', 'VALIDATION_ERROR');
  const category = asString(get('category', current?.category), 'categoría', { min: 3, max: 60 });
  const deadline = asDate(get('deadline', current?.deadline), 'fecha límite');
  const deliverables = asString(get('deliverables', current?.deliverables), 'entregables', { min: 10, max: 2000 });
  const requirements = asString(get('requirements', current?.requirements), 'requisitos', { min: 10, max: 2000 });
  const status = asOneOf(get('status', current?.status || 'draft'), ['draft', 'open', 'closed'], 'estado');
  return { title, summary, description, problem, skills, category, deadline, deliverables, requirements, status };
}

router.post('/challenges', (req, res) => {
  const company = getCompany(req);
  const data = challengePayload(req.body);
  const id = newId('cha');
  const slug = uniqueChallengeSlug(data.title);
  db.prepare(
    `INSERT INTO challenges (
      id, company_id, title, slug, summary, description, problem, skills, category,
      deadline, deliverables, requirements, status, published_at, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
  ).run(
    id,
    company.id,
    data.title,
    slug,
    data.summary,
    data.description,
    data.problem,
    JSON.stringify(data.skills),
    data.category,
    data.deadline,
    data.deliverables,
    data.requirements,
    data.status,
    new Date().toISOString().slice(0, 10),
  );
  res.status(201).json({
    item: mapChallenge(db.prepare('SELECT * FROM challenges WHERE id = ?').get(id)),
    message: data.status === 'open' ? 'Reto publicado.' : 'Borrador guardado.',
  });
});

router.patch('/challenges/:id', (req, res) => {
  const { challenge } = ensureOwnedChallenge(req);
  const data = challengePayload(req.body, { partial: true, current: challenge });
  const slug = uniqueChallengeSlug(data.title, challenge.id);
  db.prepare(
    `UPDATE challenges SET title = ?, slug = ?, summary = ?, description = ?, problem = ?, skills = ?,
      category = ?, deadline = ?, deliverables = ?, requirements = ?, status = ?, updated_at = datetime('now')
     WHERE id = ? AND company_id = ?`,
  ).run(
    data.title,
    slug,
    data.summary,
    data.description,
    data.problem,
    JSON.stringify(data.skills),
    data.category,
    data.deadline,
    data.deliverables,
    data.requirements,
    data.status,
    challenge.id,
    challenge.company_id,
  );
  res.json({
    item: mapChallenge(db.prepare('SELECT * FROM challenges WHERE id = ?').get(challenge.id)),
    message: data.status === 'open' ? 'Reto actualizado y publicado.' : 'Reto actualizado.',
  });
});

router.delete('/challenges/:id', (req, res) => {
  const { challenge } = ensureOwnedChallenge(req);
  const applications = db.prepare('SELECT COUNT(*) AS total FROM applications WHERE challenge_id = ?').get(challenge.id);
  if (Number(applications.total) > 0) {
    throw httpError(409, 'No puedes eliminar un reto con postulaciones. Ciérralo en su lugar.', 'CHALLENGE_HAS_APPLICATIONS');
  }
  db.prepare('DELETE FROM challenges WHERE id = ? AND company_id = ?').run(challenge.id, challenge.company_id);
  res.json({ ok: true });
});

function vacancyPayload(body, { partial = false, current = null } = {}) {
  const get = (field, fallback) => (partial && body[field] === undefined ? fallback : body[field]);
  const title = asString(get('title', current?.title), 'título de la vacante', { min: 6, max: 140 });
  const type = asOneOf(get('type', current?.type || 'junior'), ['empleo', 'practica', 'junior'], 'tipo de vacante');
  const description = asString(get('description', current?.description), 'descripción', { min: 30, max: 4000 });
  const requirements = asString(get('requirements', current?.requirements), 'requisitos', { min: 10, max: 2500 });
  const location = asString(get('location', current?.location), 'ubicación', { max: 120, optional: true });
  const modality = asOneOf(get('modality', current?.modality || 'presencial'), ['presencial', 'hibrido', 'remoto'], 'modalidad');
  const salaryRange = asString(get('salaryRange', current?.salary_range), 'rango salarial', { max: 100, optional: true });
  const deadline = asDate(get('deadline', current?.deadline), 'fecha límite');
  const status = asOneOf(get('status', current?.status || 'draft'), ['draft', 'open', 'closed'], 'estado');
  return { title, type, description, requirements, location, modality, salaryRange, deadline, status };
}

router.get('/vacancies', (req, res) => {
  const company = getCompany(req);
  res.json({ items: listCompanyVacancies(company.id) });
});

router.get('/vacancies/:id', (req, res) => {
  const { vacancy } = ensureOwnedVacancy(req);
  const item = db
    .prepare(
      `SELECT v.*,
        (SELECT COUNT(*) FROM technical_tests tt WHERE tt.vacancy_id = v.id) AS tests_count
       FROM vacancies v WHERE v.id = ?`,
    )
    .get(vacancy.id);
  res.json({ item: mapVacancy(item) });
});

router.post('/vacancies', (req, res) => {
  const company = getCompany(req);
  const data = vacancyPayload(req.body);
  const id = newId('vac');
  const slug = uniqueVacancySlug(data.title);
  db.prepare(
    `INSERT INTO vacancies (
      id, company_id, title, slug, type, description, requirements, location,
      modality, salary_range, deadline, status, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
  ).run(
    id,
    company.id,
    data.title,
    slug,
    data.type,
    data.description,
    data.requirements,
    data.location,
    data.modality,
    data.salaryRange,
    data.deadline,
    data.status,
  );
  const item = db
    .prepare(
      `SELECT v.*,
        (SELECT COUNT(*) FROM technical_tests tt WHERE tt.vacancy_id = v.id) AS tests_count
       FROM vacancies v WHERE v.id = ?`,
    )
    .get(id);
  res.status(201).json({
    item: mapVacancy(item),
    message: data.status === 'open' ? 'Vacante publicada.' : 'Borrador de vacante guardado.',
  });
});

router.patch('/vacancies/:id', (req, res) => {
  const { vacancy } = ensureOwnedVacancy(req);
  const data = vacancyPayload(req.body, { partial: true, current: vacancy });
  const slug = uniqueVacancySlug(data.title, vacancy.id);
  db.prepare(
    `UPDATE vacancies SET title = ?, slug = ?, type = ?, description = ?, requirements = ?,
      location = ?, modality = ?, salary_range = ?, deadline = ?, status = ?,
      updated_at = datetime('now') WHERE id = ? AND company_id = ?`,
  ).run(
    data.title,
    slug,
    data.type,
    data.description,
    data.requirements,
    data.location,
    data.modality,
    data.salaryRange,
    data.deadline,
    data.status,
    vacancy.id,
    vacancy.company_id,
  );
  const item = db
    .prepare(
      `SELECT v.*,
        (SELECT COUNT(*) FROM technical_tests tt WHERE tt.vacancy_id = v.id) AS tests_count
       FROM vacancies v WHERE v.id = ?`,
    )
    .get(vacancy.id);
  res.json({
    item: mapVacancy(item),
    message: data.status === 'open' ? 'Vacante actualizada y publicada.' : 'Vacante actualizada.',
  });
});

router.delete('/vacancies/:id', (req, res) => {
  const { vacancy } = ensureOwnedVacancy(req);
  db.prepare('DELETE FROM vacancies WHERE id = ? AND company_id = ?').run(vacancy.id, vacancy.company_id);
  res.json({ ok: true, message: 'Vacante eliminada. Las pruebas asociadas quedaron sin vacante.' });
});

function normalizeQuestions(value) {
  if (!Array.isArray(value)) throw httpError(400, 'Las preguntas deben ser una lista.', 'VALIDATION_ERROR');
  if (value.length > 30) throw httpError(400, 'La prueba admite máximo 30 preguntas.', 'VALIDATION_ERROR');
  return value.map((question, index) => {
    const prompt = asString(question?.prompt, `pregunta ${index + 1}`, { min: 5, max: 1200 });
    const type = asOneOf(question?.type, ['multiple', 'open'], `tipo de la pregunta ${index + 1}`);
    const options = type === 'multiple'
      ? asStringArray(question?.options, `opciones de la pregunta ${index + 1}`, { maxItems: 6, maxLength: 180 })
      : [];
    if (type === 'multiple' && options.length < 2) {
      throw httpError(400, `La pregunta ${index + 1} necesita al menos dos opciones.`, 'VALIDATION_ERROR');
    }
    const answer = question?.answer
      ? asString(question.answer, `respuesta de la pregunta ${index + 1}`, { max: 1200, optional: true })
      : null;
    return { prompt, type, options, answer };
  });
}

function technicalTestPayload(body, { partial = false, current = null, company } = {}) {
  const get = (field, fallback) => (partial && body[field] === undefined ? fallback : body[field]);
  const title = asString(get('title', current?.title), 'título de la prueba', { min: 6, max: 140 });
  const description = asString(get('description', current?.description), 'descripción', { min: 20, max: 2500 });
  const instructions = asString(get('instructions', current?.instructions), 'instrucciones', { max: 3000, optional: true });
  const durationMinutes = asInt(get('durationMinutes', current?.duration_minutes ?? 30), 'duración', { min: 5, max: 240 });
  const passingScore = asInt(get('passingScore', current?.passing_score ?? 70), 'puntaje mínimo', { min: 0, max: 100 });
  const status = asOneOf(get('status', current?.status || 'draft'), ['draft', 'published', 'archived'], 'estado');
  const vacancyId = get('vacancyId', current?.vacancy_id ?? null) || null;
  if (vacancyId) {
    const owned = db
      .prepare('SELECT id FROM vacancies WHERE id = ? AND company_id = ?')
      .get(vacancyId, company.id);
    if (!owned) throw httpError(400, 'La vacante seleccionada no pertenece a tu empresa.', 'VALIDATION_ERROR');
  }
  const questionsValue = get('questions', current ? parseList(current.questions) : []);
  const questions = normalizeQuestions(questionsValue);
  if (status === 'published' && questions.length === 0) {
    throw httpError(400, 'Agrega al menos una pregunta antes de publicar la prueba.', 'VALIDATION_ERROR');
  }
  return {
    title,
    description,
    instructions,
    durationMinutes,
    passingScore,
    status,
    vacancyId,
    questions,
  };
}

router.get('/technical-tests', (req, res) => {
  const company = getCompany(req);
  res.json({ items: listCompanyTests(company.id) });
});

router.get('/technical-tests/:id', (req, res) => {
  const { test } = ensureOwnedTechnicalTest(req);
  res.json({ item: mapTechnicalTest(test) });
});

router.post('/technical-tests', (req, res) => {
  const company = getCompany(req);
  const data = technicalTestPayload(req.body, { company });
  const id = newId('test');
  db.prepare(
    `INSERT INTO technical_tests (
      id, company_id, vacancy_id, title, description, instructions,
      duration_minutes, passing_score, questions, status, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
  ).run(
    id,
    company.id,
    data.vacancyId,
    data.title,
    data.description,
    data.instructions,
    data.durationMinutes,
    data.passingScore,
    JSON.stringify(data.questions),
    data.status,
  );
  const item = db
    .prepare(
      `SELECT tt.*, v.title AS vacancy_title
       FROM technical_tests tt LEFT JOIN vacancies v ON v.id = tt.vacancy_id
       WHERE tt.id = ?`,
    )
    .get(id);
  res.status(201).json({
    item: mapTechnicalTest(item),
    message: data.status === 'published' ? 'Prueba técnica publicada.' : 'Borrador de prueba guardado.',
  });
});

router.patch('/technical-tests/:id', (req, res) => {
  const { company, test } = ensureOwnedTechnicalTest(req);
  const data = technicalTestPayload(req.body, { partial: true, current: test, company });
  db.prepare(
    `UPDATE technical_tests SET vacancy_id = ?, title = ?, description = ?, instructions = ?,
      duration_minutes = ?, passing_score = ?, questions = ?, status = ?,
      updated_at = datetime('now') WHERE id = ? AND company_id = ?`,
  ).run(
    data.vacancyId,
    data.title,
    data.description,
    data.instructions,
    data.durationMinutes,
    data.passingScore,
    JSON.stringify(data.questions),
    data.status,
    test.id,
    company.id,
  );
  const item = db
    .prepare(
      `SELECT tt.*, v.title AS vacancy_title
       FROM technical_tests tt LEFT JOIN vacancies v ON v.id = tt.vacancy_id
       WHERE tt.id = ?`,
    )
    .get(test.id);
  res.json({
    item: mapTechnicalTest(item),
    message: data.status === 'published' ? 'Prueba actualizada y publicada.' : 'Prueba actualizada.',
  });
});

router.delete('/technical-tests/:id', (req, res) => {
  const { company, test } = ensureOwnedTechnicalTest(req);
  db.prepare('DELETE FROM technical_tests WHERE id = ? AND company_id = ?').run(test.id, company.id);
  res.json({ ok: true, message: 'Prueba técnica eliminada.' });
});

router.get('/challenges/:id/applications', (req, res) => {
  const { challenge } = ensureOwnedChallenge(req);
  const applications = db
    .prepare(
      `SELECT a.*, u.full_name AS student_name, u.email AS student_email,
              p.headline, p.bio, p.semester, p.linkedin, p.avatar_color,
              ca.name AS career_name
       FROM applications a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN careers ca ON ca.id = p.career_id
       WHERE a.challenge_id = ?
       ORDER BY a.created_at DESC`,
    )
    .all(challenge.id)
    .map((row) => ({
      id: row.id,
      status: row.status,
      message: row.message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      student: {
        id: row.user_id,
        name: row.student_name,
        email: row.student_email,
        headline: row.headline,
        bio: row.bio,
        semester: row.semester,
        linkedin: row.linkedin,
        careerName: row.career_name,
        avatarColor: row.avatar_color,
      },
      deliverables: db
        .prepare('SELECT id, title, url, notes, created_at FROM deliverables WHERE application_id = ? ORDER BY created_at DESC')
        .all(row.id),
    }));
  res.json({ challenge: mapChallenge(challenge), items: applications });
});

router.get('/applications', (req, res) => {
  const company = getCompany(req);
  const rows = db
    .prepare(
      `SELECT a.*, ch.title AS challenge_title, ch.id AS challenge_id, ch.is_demo AS challenge_is_demo,
              u.full_name AS student_name, u.email AS student_email, p.headline, ca.name AS career_name
       FROM applications a
       JOIN challenges ch ON ch.id = a.challenge_id
       JOIN users u ON u.id = a.user_id
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN careers ca ON ca.id = p.career_id
       WHERE ch.company_id = ?
       ORDER BY a.created_at DESC`,
    )
    .all(company.id);
  res.json({
    items: rows.map((row) => ({
      id: row.id,
      status: row.status,
      message: row.message,
      createdAt: row.created_at,
      challenge: { id: row.challenge_id, title: row.challenge_title, isDemo: Boolean(row.challenge_is_demo) },
      student: { name: row.student_name, email: row.student_email, headline: row.headline, careerName: row.career_name },
      deliverables: db
        .prepare('SELECT id, title, url, notes, created_at FROM deliverables WHERE application_id = ?')
        .all(row.id),
    })),
  });
});

router.patch('/applications/:id', (req, res) => {
  const company = getCompany(req);
  const application = db
    .prepare(
      `SELECT a.*, ch.company_id, ch.id AS challenge_id, ch.title AS challenge_title
       FROM applications a JOIN challenges ch ON ch.id = a.challenge_id
       WHERE a.id = ? AND ch.company_id = ?`,
    )
    .get(req.params.id, company.id);
  if (!application) throw httpError(404, 'Postulación no encontrada.', 'NOT_FOUND');
  const status = asOneOf(req.body.status, ['submitted', 'reviewing', 'accepted', 'rejected'], 'estado');
  db.prepare("UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, application.id);
  const labels = {
    submitted: 'recibida',
    reviewing: 'en revisión',
    accepted: 'aceptada',
    rejected: 'no seleccionada',
  };
  createNotification(
    application.user_id,
    'Actualización de tu postulación',
    `Tu postulación a "${application.challenge_title}" ahora está ${labels[status]}.`,
    '/mis-retos',
  );
  res.json({ status, message: 'Estado de la postulación actualizado.' });
});

export default router;
