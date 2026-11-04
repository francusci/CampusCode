import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { once } from 'node:events';

// La base de datos de prueba es independiente de data/campuscode.db y se
// elimina al terminar. El resto de variables fuerza el modo local de IA para
// no realizar llamadas externas durante las pruebas.
const dbPath = path.join(os.tmpdir(), `campuscode-test-${process.pid}-${Date.now()}.db`);
process.env.DB_PATH = dbPath;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-do-not-use-in-production';
process.env.APP_ORIGIN = 'http://127.0.0.1:5173';
process.env.AI_MODE = 'local';
delete process.env.AI_API_KEY;

const { db, initDatabase } = await import('../server/db.js');
const { seedDatabase } = await import('../server/seed-data.js');
const { createApp } = await import('../server/app.js');

initDatabase();
seedDatabase(db);

const server = createApp().listen(0, '127.0.0.1');
await once(server, 'listening');
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

after(() => {
  server.close();
  db.close();
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      fs.rmSync(`${dbPath}${suffix}`, { force: true });
    } catch {
      // La limpieza no debe ocultar el resultado de las pruebas.
    }
  }
});

async function api(pathname, { method = 'GET', body, cookie, origin } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (cookie) headers.cookie = cookie;
  if (origin) headers.origin = origin;
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  const rawCookie = response.headers.get('set-cookie');
  const setCookies = response.headers.getSetCookie?.() ?? (rawCookie ? [rawCookie] : []);
  return { status: response.status, body: payload, setCookies };
}

async function login(email, password = 'Campus123!') {
  const response = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  assert.equal(response.status, 200, `Login falló para ${email}: ${JSON.stringify(response.body)}`);
  const session = response.setCookies.find((value) => value.startsWith('cc_session='));
  assert.ok(session, 'La respuesta de login debe incluir la cookie de sesión');
  return { cookie: session.split(';')[0], user: response.body.user, setCookies: response.setCookies };
}

let student;
let company;
let admin;
let newStudent;
let targetExercise;

test('salud pública y catálogo de demostración', async () => {
  const health = await api('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.status, 'ok');

  const summary = await api('/api/public-summary');
  assert.equal(summary.status, 200);
  assert.equal(summary.body.demo, true);
  assert.ok(summary.body.exercises > 0);
  assert.match(summary.body.notice, /demostración/i);

  const exercises = await api('/api/exercises?limit=3');
  assert.equal(exercises.status, 200);
  assert.ok(exercises.body.items.length > 0);
  assert.equal(exercises.body.items.length, 3);
  targetExercise = exercises.body.items[0];

  const injection = await api(`/api/exercises?q=${encodeURIComponent("' OR 1=1 --")}`);
  assert.equal(injection.status, 200);
  assert.equal(injection.body.total, 0, 'La consulta debe usar parámetros y no interpretar SQL');
});

test('login, cookie httpOnly y sesión activa', async () => {
  const badPassword = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'estudiante@campuscode.co', password: 'Incorrecta123' },
  });
  assert.equal(badPassword.status, 401);
  assert.equal(badPassword.body.code, 'INVALID_CREDENTIALS');

  student = await login('estudiante@campuscode.co');
  assert.equal(student.user.role, 'student');
  const sessionCookie = student.setCookies.find((value) => value.startsWith('cc_session='));
  assert.match(sessionCookie, /HttpOnly/i);
  assert.match(sessionCookie, /SameSite=Lax/i);

  const me = await api('/api/auth/me', { cookie: student.cookie });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'estudiante@campuscode.co');
  assert.equal(me.body.user.role, 'student');
});

test('registro, roles y cambios de estado del administrador', async () => {
  const email = `nuevo.${Date.now()}@campuscode.co`;
  const registration = await api('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Cuenta de Prueba',
      email,
      password: 'Prueba12345!',
      role: 'student',
      careerId: 'car-ing-informatica',
    },
  });
  assert.equal(registration.status, 201, JSON.stringify(registration.body));
  assert.equal(registration.body.user.role, 'student');
  const newUserId = registration.body.user.id;
  const registeredSession = registration.setCookies.find((value) => value.startsWith('cc_session='));
  assert.ok(registeredSession, 'El registro debe iniciar sesión');
  newStudent = { cookie: registeredSession.split(';')[0], user: registration.body.user };

  const disabledLogin = await api('/api/auth/login', { method: 'POST', body: { email, password: 'Prueba12345!' } });
  assert.equal(disabledLogin.status, 200);

  admin = await login('admin@campuscode.co');
  assert.equal(admin.user.role, 'admin');

  const deactivate = await api(`/api/admin/users/${newUserId}`, {
    method: 'PATCH',
    cookie: admin.cookie,
    body: { isActive: false },
  });
  assert.equal(deactivate.status, 200);

  const blockedLogin = await api('/api/auth/login', { method: 'POST', body: { email, password: 'Prueba12345!' } });
  assert.equal(blockedLogin.status, 403);
  assert.equal(blockedLogin.body.code, 'ACCOUNT_DISABLED');

  const reactivate = await api(`/api/admin/users/${newUserId}`, {
    method: 'PATCH',
    cookie: admin.cookie,
    body: { isActive: true },
  });
  assert.equal(reactivate.status, 200);

  const selfDemotion = await api(`/api/admin/users/${admin.user.id}`, {
    method: 'PATCH',
    cookie: admin.cookie,
    body: { role: 'student' },
  });
  assert.equal(selfDemotion.status, 409);
  assert.equal(selfDemotion.body.code, 'SELF_ACTION_BLOCKED');
});

test('autorización por rol aplicada en el servidor', async () => {
  const studentToCompany = await api('/api/company/overview', { cookie: student.cookie });
  assert.equal(studentToCompany.status, 403);

  const studentToAdmin = await api('/api/admin/overview', { cookie: student.cookie });
  assert.equal(studentToAdmin.status, 403);

  const anonymousGoals = await api('/api/me/goals');
  assert.equal(anonymousGoals.status, 401);

  company = await login('empresa@campuscode.co');
  assert.equal(company.user.role, 'company');

  const companyToAdmin = await api('/api/admin/overview', { cookie: company.cookie });
  assert.equal(companyToAdmin.status, 403);

  const companyApply = await api('/api/challenges/cha-inventario/applications', {
    method: 'POST',
    cookie: company.cookie,
    body: { message: 'Intento no permitido' },
  });
  assert.equal(companyApply.status, 403);
});

test('favoritos, progreso y objetivos del estudiante', async () => {
  const before = await api('/api/me/dashboard', { cookie: student.cookie });
  assert.equal(before.status, 200);
  const favoritesBefore = before.body.stats.favorites;

  const favorite = await api(`/api/exercises/${targetExercise.id}/favorite`, {
    method: 'POST',
    cookie: student.cookie,
  });
  assert.equal(favorite.status, 200);
  assert.equal(favorite.body.favorite, true);

  const duplicateFavorite = await api(`/api/exercises/${targetExercise.id}/favorite`, {
    method: 'POST',
    cookie: student.cookie,
  });
  assert.equal(duplicateFavorite.status, 200);
  assert.equal(duplicateFavorite.body.favorite, false);

  const complete = await api(`/api/exercises/${targetExercise.id}/complete`, {
    method: 'POST',
    cookie: student.cookie,
  });
  assert.equal(complete.status, 200);
  assert.equal(complete.body.completed, true);

  const dashboard = await api('/api/me/dashboard', { cookie: student.cookie });
  assert.equal(dashboard.status, 200);
  assert.ok(dashboard.body.stats.completed >= 1);
  assert.equal(dashboard.body.stats.favorites, favoritesBefore, 'Guardar y quitar el favorito debe dejar el total inicial');

  const created = await api('/api/me/goals', {
    method: 'POST',
    cookie: student.cookie,
    body: { title: 'Objetivo de prueba automatizada', targetCount: 3, dueDate: '2026-12-31' },
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.item.targetCount, 3);

  const updated = await api(`/api/me/goals/${created.body.item.id}`, {
    method: 'PATCH',
    cookie: student.cookie,
    body: { status: 'completed' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.item.status, 'completed');

  const removed = await api(`/api/me/goals/${created.body.item.id}`, {
    method: 'DELETE',
    cookie: student.cookie,
  });
  assert.equal(removed.status, 200);
});

test('postulación a reto, duplicado y gestión por la empresa', async () => {
  const challenges = await api('/api/challenges?status=open');
  assert.equal(challenges.status, 200);
  const demoCompanyName = company.user.company?.name;
  assert.ok(demoCompanyName, 'La cuenta de empresa debe tener perfil empresarial');
  const available = challenges.body.items.find(
    (challenge) => challenge.deadline >= '2026-10-20' && challenge.company.name === demoCompanyName,
  );
  assert.ok(available, 'Debe existir al menos un reto abierto de la empresa demo');

  const application = await api(`/api/challenges/${available.id}/applications`, {
    method: 'POST',
    cookie: newStudent.cookie,
    body: { message: 'Postulación creada por la prueba automatizada.' },
  });
  assert.equal(application.status, 201, JSON.stringify(application.body));

  const duplicate = await api(`/api/challenges/${available.id}/applications`, {
    method: 'POST',
    cookie: newStudent.cookie,
    body: { message: 'Duplicado' },
  });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.code, 'DUPLICATE_APPLICATION');

  const companyApplications = await api('/api/company/applications', { cookie: company.cookie });
  assert.equal(companyApplications.status, 200);
  assert.ok(companyApplications.body.items.length > 0);
  const target = companyApplications.body.items.find((item) => item.id === application.body.application.id);
  assert.ok(target, 'La empresa dueña debe ver la nueva postulación');

  const update = await api(`/api/company/applications/${target.id}`, {
    method: 'PATCH',
    cookie: company.cookie,
    body: { status: 'reviewing' },
  });
  assert.equal(update.status, 200);
  assert.equal(update.body.status, 'reviewing');
});

test('la empresa no puede editar retos de otra empresa', async () => {
  const publicChallenges = await api('/api/challenges');
  const ownChallenges = await api('/api/company/challenges', { cookie: company.cookie });
  const ownIds = new Set(ownChallenges.body.items.map((item) => item.id));
  const foreign = publicChallenges.body.items.find((item) => !ownIds.has(item.id));
  assert.ok(foreign, 'Debe existir un reto de otra empresa');

  const attempt = await api(`/api/company/challenges/${foreign.id}`, {
    method: 'PATCH',
    cookie: company.cookie,
    body: { status: 'closed' },
  });
  assert.equal(attempt.status, 404);
});

test('campus: materias personales y préstamo de computadores', async () => {
  const summary = await api('/api/public-summary');
  assert.equal(summary.status, 200);
  assert.ok(summary.body.campus.computersTotal > 0);
  assert.equal(summary.body.campus.isDemo, true);

  const anonymousComputers = await api('/api/computers');
  assert.equal(anonymousComputers.status, 401);

  const initialSubjects = await api('/api/my-subjects', { cookie: student.cookie });
  assert.equal(initialSubjects.status, 200);
  assert.equal(initialSubjects.body.items.length, 0);

  const subjects = await api('/api/subjects?limit=50');
  assert.equal(subjects.status, 200);
  assert.ok(subjects.body.items.length > 0);
  const targetSubject = subjects.body.items[0];

  const added = await api('/api/my-subjects', {
    method: 'POST',
    cookie: student.cookie,
    body: { subjectId: targetSubject.id },
  });
  assert.equal(added.status, 201, JSON.stringify(added.body));
  assert.equal(added.body.item.subjectId, targetSubject.id);

  const duplicateSubject = await api('/api/my-subjects', {
    method: 'POST',
    cookie: student.cookie,
    body: { subjectId: targetSubject.id },
  });
  assert.equal(duplicateSubject.status, 409);
  assert.equal(duplicateSubject.body.code, 'DUPLICATE_SUBJECT');

  const mySubjects = await api('/api/my-subjects', { cookie: student.cookie });
  assert.equal(mySubjects.status, 200);
  assert.ok(mySubjects.body.items.some((item) => item.id === added.body.item.id));

  const removed = await api(`/api/my-subjects/${added.body.item.id}`, {
    method: 'DELETE',
    cookie: student.cookie,
  });
  assert.equal(removed.status, 200);

  const computers = await api('/api/computers', { cookie: student.cookie });
  assert.equal(computers.status, 200);
  assert.ok(computers.body.items.length > 0);
  const available = computers.body.items.find((item) => item.status === 'available');
  assert.ok(available, 'Debe existir al menos un equipo disponible para la prueba');

  const loan = await api('/api/computer-loans', {
    method: 'POST',
    cookie: student.cookie,
    body: {
      room: available.room,
      equipmentNumber: available.equipmentNumber,
      entryAt: '2026-10-20T08:00',
      condition: available.condition,
      notes: 'Préstamo de prueba automatizada.',
    },
  });
  assert.equal(loan.status, 201, JSON.stringify(loan.body));
  assert.equal(loan.body.item.status, 'active');

  const duplicateLoan = await api('/api/computer-loans', {
    method: 'POST',
    cookie: student.cookie,
    body: {
      room: available.room,
      equipmentNumber: available.equipmentNumber,
      entryAt: '2026-10-20T09:00',
      condition: available.condition,
    },
  });
  assert.equal(duplicateLoan.status, 409);
  assert.equal(duplicateLoan.body.code, 'COMPUTER_IN_USE');

  const returned = await api(`/api/computer-loans/${loan.body.item.id}/return`, {
    method: 'PATCH',
    cookie: student.cookie,
    body: { exitAt: '2026-10-20T10:30', condition: available.condition },
  });
  assert.equal(returned.status, 200, JSON.stringify(returned.body));
  assert.equal(returned.body.item.status, 'returned');
});

test('reclutamiento: vacantes públicas, pruebas y gestión por empresa', async () => {
  const vacancies = await api('/api/vacancies');
  assert.equal(vacancies.status, 200);
  assert.ok(vacancies.body.items.length > 0);
  assert.ok(vacancies.body.items.every((item) => item.status === 'open' && item.isDemo));

  const tests = await api('/api/technical-tests');
  assert.equal(tests.status, 200);
  assert.ok(tests.body.items.length > 0);
  const publicTest = tests.body.items[0];
  const detail = await api(`/api/technical-tests/${publicTest.id}`);
  assert.equal(detail.status, 200);
  assert.ok(detail.body.test.questions.length > 0);
  assert.equal(detail.body.test.questions[0].answer, undefined);

  const overview = await api('/api/company/overview', { cookie: company.cookie });
  assert.equal(overview.status, 200);
  assert.ok(overview.body.stats.openVacancies > 0);
  assert.ok(overview.body.stats.publishedTests > 0);

  const createdVacancy = await api('/api/company/vacancies', {
    method: 'POST',
    cookie: company.cookie,
    body: {
      title: 'Vacante de prueba automatizada',
      type: 'junior',
      description: 'Descripción suficientemente larga para validar la creación de una vacante de prueba.',
      requirements: 'Requisitos de prueba automatizada para el equipo.',
      location: 'Cartagena, Colombia',
      modality: 'remoto',
      salaryRange: '$1.000.000 - $2.000.000',
      deadline: '2026-12-31',
      status: 'open',
    },
  });
  assert.equal(createdVacancy.status, 201, JSON.stringify(createdVacancy.body));
  assert.equal(createdVacancy.body.item.status, 'open');

  const createdTest = await api('/api/company/technical-tests', {
    method: 'POST',
    cookie: company.cookie,
    body: {
      title: 'Prueba técnica automatizada',
      description: 'Evaluación de prueba con preguntas suficientes para validar el flujo completo.',
      instructions: 'Responde de forma individual.',
      durationMinutes: 30,
      passingScore: 70,
      status: 'published',
      vacancyId: createdVacancy.body.item.id,
      questions: [
        { prompt: '¿Cuánto es 2 + 2?', type: 'multiple', options: ['3', '4'], answer: '4' },
        { prompt: 'Explica brevemente tu razonamiento.', type: 'open', options: [], answer: 'Respuesta de referencia.' },
      ],
    },
  });
  assert.equal(createdTest.status, 201, JSON.stringify(createdTest.body));
  assert.equal(createdTest.body.item.status, 'published');
  assert.equal(createdTest.body.item.questionCount, 2);

  const publicVacancy = await api(`/api/vacancies/${createdVacancy.body.item.slug}`);
  assert.equal(publicVacancy.status, 200);
  assert.equal(publicVacancy.body.vacancy.tests.length, 1);

  const foreignEdit = await api('/api/company/vacancies/vac-aurora-frontend', {
    method: 'PATCH',
    cookie: company.cookie,
    body: { status: 'closed' },
  });
  assert.equal(foreignEdit.status, 404);

  const removeTest = await api(`/api/company/technical-tests/${createdTest.body.item.id}`, {
    method: 'DELETE',
    cookie: company.cookie,
  });
  assert.equal(removeTest.status, 200);
  const removeVacancy = await api(`/api/company/vacancies/${createdVacancy.body.item.id}`, {
    method: 'DELETE',
    cookie: company.cookie,
  });
  assert.equal(removeVacancy.status, 200);
});

test('administración: catálogo, ejercicios y reportes', async () => {
  const overview = await api('/api/admin/overview', { cookie: admin.cookie });
  assert.equal(overview.status, 200);
  assert.ok(overview.body.counts.users >= 7);

  const careers = await api('/api/admin/catalog', { cookie: admin.cookie });
  assert.equal(careers.status, 200);
  assert.ok(careers.body.careers.length > 0);
  assert.ok(careers.body.subjects.length > 0);

  const exerciseList = await api('/api/admin/exercises', { cookie: admin.cookie });
  assert.equal(exerciseList.status, 200);
  assert.ok(exerciseList.body.items.length > 0);
  const exercise = exerciseList.body.items[0];

  const hide = await api(`/api/admin/exercises/${exercise.id}`, {
    method: 'PATCH',
    cookie: admin.cookie,
    body: { isPublished: false },
  });
  assert.equal(hide.status, 200);
  assert.equal(hide.body.isPublished, false);

  const publish = await api(`/api/admin/exercises/${exercise.id}`, {
    method: 'PATCH',
    cookie: admin.cookie,
    body: { isPublished: true },
  });
  assert.equal(publish.status, 200);
  assert.equal(publish.body.isPublished, true);

  const reports = await api('/api/admin/reports', { cookie: admin.cookie });
  assert.equal(reports.status, 200);
  assert.ok(reports.body.items.length > 0);
  const report = reports.body.items[0];
  const review = await api(`/api/admin/reports/${report.id}`, {
    method: 'PATCH',
    cookie: admin.cookie,
    body: { status: 'reviewed' },
  });
  assert.equal(review.status, 200);
  assert.equal(review.body.status, 'reviewed');
});

test('IA sin credenciales se identifica como guía local', async () => {
  const status = await api('/api/ai/status');
  assert.equal(status.status, 200);
  assert.equal(status.body.configured, false);
  assert.equal(status.body.mode, 'local');

  const guest = await api('/api/ai/guest', {
    method: 'POST',
    body: { messages: [{ role: 'user', content: '¿Cómo funciona la recursión?' }] },
  });
  assert.equal(guest.status, 200);
  assert.equal(guest.body.reply.provider, 'local-guide');
  assert.equal(guest.body.reply.configured, false);
  assert.match(guest.body.reply.content, /Guía local de estudio/);
  assert.equal(guest.body.persisted, false);
});

test('protección de origen para peticiones mutantes', async () => {
  const blocked = await api('/api/auth/login', {
    method: 'POST',
    origin: 'https://sitio-no-autorizado.example',
    body: { email: 'estudiante@campuscode.co', password: 'Campus123!' },
  });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.code, 'ORIGIN_NOT_ALLOWED');
});
