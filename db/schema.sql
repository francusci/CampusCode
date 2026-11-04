-- ===========================================================================
-- CampusCode · Esquema relacional (SQLite, runtime local)
-- Equivalente PostgreSQL documentado en db/schema.postgres.sql
-- ===========================================================================
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('student', 'company', 'admin')),
  full_name      TEXT NOT NULL,
  is_active      INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  last_login_at  TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS careers (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  faculty      TEXT NOT NULL,
  description  TEXT NOT NULL,
  icon         TEXT NOT NULL DEFAULT 'Compass',
  color        TEXT NOT NULL DEFAULT 'indigo',
  is_demo      INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0, 1)),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id           TEXT PRIMARY KEY,
  owner_id     TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  sector       TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  website      TEXT,
  location     TEXT,
  logo_color   TEXT NOT NULL DEFAULT 'blue',
  verified     INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  is_demo      INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0, 1)),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  headline     TEXT,
  bio          TEXT,
  university   TEXT DEFAULT 'Universidad Mayor de Cartagena',
  career_id    TEXT REFERENCES careers(id) ON DELETE SET NULL,
  semester     INTEGER CHECK (semester BETWEEN 1 AND 12),
  phone        TEXT,
  website      TEXT,
  linkedin     TEXT,
  avatar_color TEXT NOT NULL DEFAULT 'blue',
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subjects (
  id           TEXT PRIMARY KEY,
  career_id    TEXT NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  slug         TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  semester     INTEGER CHECK (semester BETWEEN 1 AND 12),
  credits      INTEGER CHECK (credits BETWEEN 1 AND 12),
  is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
  is_demo      INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0, 1)),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (career_id, slug)
);

CREATE TABLE IF NOT EXISTS topics (
  id           TEXT PRIMARY KEY,
  subject_id   TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  slug         TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  position     INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (subject_id, slug)
);

CREATE TABLE IF NOT EXISTS exercises (
  id             TEXT PRIMARY KEY,
  topic_id       TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  statement      TEXT NOT NULL,
  difficulty     TEXT NOT NULL CHECK (difficulty IN ('basico', 'intermedio', 'avanzado')),
  type           TEXT NOT NULL CHECK (type IN ('multiple', 'abierta', 'codigo')),
  options        TEXT,
  correct_answer TEXT NOT NULL,
  hint           TEXT NOT NULL,
  procedure      TEXT NOT NULL,
  explanation    TEXT NOT NULL,
  author         TEXT NOT NULL DEFAULT 'Equipo CampusCode',
  source         TEXT NOT NULL DEFAULT 'Ejercicio original de demostración',
  published_at   TEXT NOT NULL DEFAULT (date('now')),
  tags           TEXT NOT NULL DEFAULT '[]',
  is_published   INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
  is_demo        INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0, 1)),
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS progress (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  attempts      INTEGER NOT NULL DEFAULT 0,
  last_answer   TEXT,
  completed_at  TEXT,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('exercise_completed', 'exercise_attempt', 'favorite', 'goal_created', 'goal_completed', 'application', 'deliverable', 'login')),
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  metadata    TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS study_goals (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id   TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  metric       TEXT NOT NULL DEFAULT 'exercises' CHECK (metric IN ('exercises')),
  target_count INTEGER NOT NULL CHECK (target_count BETWEEN 1 AND 1000),
  due_date     TEXT,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS conversations (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  title      TEXT NOT NULL DEFAULT 'Nueva conversación',
  is_demo    INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  provider        TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS challenges (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  summary      TEXT NOT NULL,
  description  TEXT NOT NULL,
  problem      TEXT NOT NULL,
  skills       TEXT NOT NULL DEFAULT '[]',
  category     TEXT NOT NULL,
  published_at TEXT NOT NULL DEFAULT (date('now')),
  deadline     TEXT NOT NULL,
  deliverables TEXT NOT NULL,
  requirements TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  featured     INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  is_demo      INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0, 1)),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id           TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message      TEXT,
  status       TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'accepted', 'rejected', 'withdrawn')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS deliverables (
  id             TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  url            TEXT NOT NULL,
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  link       TEXT,
  read       INTEGER NOT NULL DEFAULT 0 CHECK (read IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id          TEXT PRIMARY KEY,
  reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('exercise', 'challenge', 'user')),
  target_id   TEXT NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Materias personales del usuario -------------------------------------------
-- El catálogo global vive en `subjects`; esta tabla guarda lo que cada
-- estudiante decide agregar a su propio tablero.
CREATE TABLE IF NOT EXISTS user_subjects (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  semester   INTEGER CHECK (semester BETWEEN 1 AND 12),
  credits    INTEGER CHECK (credits BETWEEN 1 AND 12),
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, subject_id)
);

-- Préstamo de computadores del campus ---------------------------------------
CREATE TABLE IF NOT EXISTS computers (
  id               TEXT PRIMARY KEY,
  room             TEXT NOT NULL,
  equipment_number TEXT NOT NULL,
  condition        TEXT NOT NULL DEFAULT 'bueno' CHECK (condition IN ('excelente', 'bueno', 'con_detalles', 'mantenimiento')),
  status           TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
  notes            TEXT,
  is_demo          INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0, 1)),
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (room, equipment_number)
);

CREATE TABLE IF NOT EXISTS computer_loans (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  computer_id      TEXT REFERENCES computers(id) ON DELETE SET NULL,
  room             TEXT NOT NULL,
  equipment_number TEXT NOT NULL,
  entry_at         TEXT NOT NULL,
  exit_at          TEXT,
  condition        TEXT NOT NULL CHECK (condition IN ('excelente', 'bueno', 'con_detalles', 'mantenimiento')),
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'cancelled')),
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Portal de reclutamiento ----------------------------------------------------
CREATE TABLE IF NOT EXISTS vacancies (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  type         TEXT NOT NULL CHECK (type IN ('empleo', 'practica', 'junior')),
  description  TEXT NOT NULL,
  requirements TEXT NOT NULL,
  location     TEXT,
  modality     TEXT CHECK (modality IN ('presencial', 'hibrido', 'remoto')),
  salary_range TEXT,
  deadline     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  is_demo      INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0, 1)),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS technical_tests (
  id               TEXT PRIMARY KEY,
  company_id       TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vacancy_id       TEXT REFERENCES vacancies(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  instructions     TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes BETWEEN 5 AND 240),
  passing_score    INTEGER NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
  questions        TEXT NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_demo          INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0, 1)),
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices de búsqueda y claves foráneas -------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_subjects_user ON user_subjects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_computers_room ON computers(room, equipment_number);
CREATE INDEX IF NOT EXISTS idx_computer_loans_user ON computer_loans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_computer_loans_active ON computer_loans(status, computer_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status, deadline);
CREATE INDEX IF NOT EXISTS idx_vacancies_company ON vacancies(company_id);
CREATE INDEX IF NOT EXISTS idx_tests_company ON technical_tests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_career ON profiles(career_id);
CREATE INDEX IF NOT EXISTS idx_subjects_career ON subjects(career_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_exercises_topic ON exercises(topic_id);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_user_date ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user ON study_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_challenges_company ON challenges(company_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status, deadline);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_challenge ON applications(challenge_id, status);
CREATE INDEX IF NOT EXISTS idx_deliverables_application ON deliverables(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_title ON exercises(title);
