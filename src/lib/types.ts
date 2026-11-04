export type Role = 'student' | 'company' | 'admin';
export type Difficulty = 'basico' | 'intermedio' | 'avanzado';
export type ExerciseType = 'multiple' | 'abierta' | 'codigo';

export interface Profile {
  headline: string | null;
  bio: string | null;
  university: string | null;
  careerId: string | null;
  careerName: string | null;
  careerSlug: string | null;
  semester: number | null;
  website: string | null;
  linkedin: string | null;
  avatarColor: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  profile: Profile;
  company: { id: string; name: string; slug: string; sector: string; verified: boolean } | null;
}

export interface Career {
  id: string;
  slug: string;
  name: string;
  faculty: string;
  description: string;
  icon: string;
  color: string;
  isDemo: boolean;
  counts: { subjects: number; topics: number; exercises: number };
}

export interface SubjectSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  semester: number | null;
  credits: number | null;
  isDemo?: boolean;
  career: { id: string; name: string; slug: string; color?: string };
  counts: { exercises: number; topics: number };
}

export interface MySubject {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
  description: string;
  semester: number | null;
  credits: number | null;
  status: 'active' | 'completed' | 'archived';
  addedAt: string;
  career: { id: string; name: string; slug: string; color: string };
  counts: { topics: number; exercises: number };
}

export type ComputerCondition = 'excelente' | 'bueno' | 'con_detalles' | 'mantenimiento';
export type ComputerStatus = 'available' | 'in_use' | 'maintenance';

export interface Computer {
  id: string;
  room: string;
  equipmentNumber: string;
  condition: ComputerCondition;
  status: ComputerStatus;
  notes: string | null;
  activeLoan: boolean;
  isDemo: boolean;
}

export interface ComputerLoan {
  id: string;
  room: string;
  equipmentNumber: string;
  entryAt: string;
  exitAt: string | null;
  condition: ComputerCondition;
  status: 'active' | 'returned' | 'cancelled';
  notes: string | null;
  createdAt: string;
  computer: { id: string; room: string; equipmentNumber: string } | null;
}

export type VacancyType = 'empleo' | 'practica' | 'junior';
export type VacancyStatus = 'draft' | 'open' | 'closed';
export type Modality = 'presencial' | 'hibrido' | 'remoto';

export interface VacancyCompany {
  id: string;
  name: string;
  slug: string;
  sector: string;
  logoColor: string;
  verified: boolean;
  isDemo: boolean;
}

export interface Vacancy {
  id: string;
  title: string;
  slug: string;
  type: VacancyType;
  description: string;
  requirements: string;
  location: string | null;
  modality: Modality | null;
  salaryRange: string | null;
  deadline: string;
  status: VacancyStatus;
  isDemo: boolean;
  createdAt: string;
  company: VacancyCompany;
  testsCount: number;
  tests?: TechnicalTest[];
}

export interface TechnicalTestQuestion {
  prompt: string;
  type: 'multiple' | 'open';
  options: string[];
  answer?: string | null;
}

export interface TechnicalTest {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  durationMinutes: number;
  passingScore: number;
  status: 'draft' | 'published' | 'archived';
  isDemo: boolean;
  createdAt: string;
  questionCount: number;
  company: VacancyCompany;
  vacancy: { id: string; title: string | null; slug: string | null } | null;
  questions?: Array<Omit<TechnicalTestQuestion, 'answer'>>;
}

export interface CompanyVacancy extends Omit<Vacancy, 'company' | 'tests'> {
  testsCount: number;
  updatedAt: string;
}

export interface CompanyTechnicalTest {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  durationMinutes: number;
  passingScore: number;
  questions: TechnicalTestQuestion[];
  questionCount: number;
  status: 'draft' | 'published' | 'archived';
  isDemo: boolean;
  vacancyId: string | null;
  vacancyTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampusStats {
  isDemo: boolean;
  notice: string;
  computersTotal: number;
  computersAvailable: number;
  computersInUse: number;
  computersMaintenance: number;
  loansTotal: number;
  loansToday: number;
  activeVacancies: number;
  technicalTests: number;
}

export interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string;
  position: number;
  exerciseCount?: number;
}

export interface Exercise {
  id: string;
  title: string;
  statement: string;
  difficulty: Difficulty;
  type: ExerciseType;
  options: string[];
  tags: string[];
  author: string;
  source: string;
  publishedAt: string;
  isDemo: boolean;
  topic: { id: string; name: string; slug: string };
  subject: { id: string; name: string; slug: string };
  career: { id: string; name: string; slug: string };
  userState: { status: 'in_progress' | 'completed' | null; attempts: number; isFavorite: boolean };
  hint?: string;
  procedure?: string[];
  explanation?: string;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  problem: string;
  skills: string[];
  category: string;
  publishedAt: string;
  deadline: string;
  deliverables: string;
  requirements: string;
  status: 'draft' | 'open' | 'closed';
  featured: boolean;
  isDemo: boolean;
  company: {
    id: string;
    name: string;
    slug: string;
    sector: string;
    logoColor: string;
    verified: boolean;
    isDemo: boolean;
  };
}

export interface Application {
  id: string;
  status: 'submitted' | 'reviewing' | 'accepted' | 'rejected' | 'withdrawn';
  message: string | null;
  createdAt: string;
  updatedAt: string;
  challenge: {
    id: string;
    title: string;
    slug: string;
    deadline: string;
    status: 'draft' | 'open' | 'closed';
    category: string;
  };
  company: { name: string; logoColor: string };
  deliverables: Deliverable[];
}

export interface Deliverable {
  id: string;
  title: string;
  url: string;
  notes: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  title: string;
  targetCount: number;
  current: number;
  percent: number;
  dueDate: string | null;
  status: 'active' | 'completed' | 'archived';
  subjectId: string | null;
  subjectName: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ActivityItem {
  id: number;
  type: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SeriesPoint {
  date: string;
  count: number;
}

export interface DashboardData {
  stats: {
    completed: number;
    inProgress: number;
    favorites: number;
    applications: number;
    available: number;
    unread: number;
    activeSubjects: number;
  };
  continueExercise: { id: string; title: string; difficulty: Difficulty; subjectName: string } | null;
  recommended: Array<{ id: string; title: string; difficulty: Difficulty; subjectName: string }>;
  activity: ActivityItem[];
  challenges: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string;
    deadline: string;
    category: string;
    company_name: string;
  }>;
  subjects: SubjectProgress[];
  goals: Goal[];
  series: SeriesPoint[];
  newUser: boolean;
}

export interface SubjectProgress {
  id: string;
  name: string;
  slug: string;
  careerName: string;
  total: number;
  completed: number;
  inProgress: number;
  percent: number;
}

export interface ProgressData {
  totals: {
    completed: number;
    inProgress: number;
    favorites: number;
    applications: number;
    available: number;
    studyDays: number;
  };
  subjects: SubjectProgress[];
  practicedSubjects: SubjectProgress[];
  difficulties: Array<{ difficulty: Difficulty; total: number; completed: number; percent: number }>;
  series: SeriesPoint[];
  strengths: SubjectProgress[];
  needsPractice: SubjectProgress[];
  recent: ActivityItem[];
  goals: Goal[];
}

export interface Conversation {
  id: string;
  title: string;
  subjectId: string | null;
  subjectName: string | null;
  isDemo: boolean;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string | null;
  created_at: string;
}

export interface AiStatus {
  configured: boolean;
  mode: 'live' | 'local';
  provider: 'anthropic' | 'openai-compatible' | null;
  model: string | null;
  message: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  slug: string;
  sector: string;
  description: string;
  website: string | null;
  location: string | null;
  logoColor: string;
  verified: boolean;
  isDemo: boolean;
}

export interface CompanyChallenge {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  problem: string;
  skills: string[];
  category: string;
  publishedAt: string;
  deadline: string;
  deliverables: string;
  requirements: string;
  status: 'draft' | 'open' | 'closed';
  featured: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  applicationsCount: number;
  newApplications: number;
}

export interface CompanyApplication {
  id: string;
  status: Application['status'];
  message: string | null;
  createdAt: string;
  updatedAt?: string;
  student: {
    id?: string;
    name: string;
    email: string;
    headline: string | null;
    bio?: string | null;
    semester: number | null;
    linkedin?: string | null;
    careerName: string | null;
    avatarColor?: string;
  };
  challenge?: { id: string; title: string; isDemo?: boolean };
  deliverables: Deliverable[];
}

export interface CompanyOverview {
  company: CompanyProfile;
  stats: {
    openChallenges: number;
    draftChallenges: number;
    applications: number;
    newApplications: number;
    accepted: number;
    openVacancies: number;
    totalVacancies: number;
    publishedTests: number;
    totalTests: number;
  };
  challenges: CompanyChallenge[];
  vacancies: CompanyVacancy[];
  technicalTests: CompanyTechnicalTest[];
  recentApplications: CompanyApplication[];
}

export interface AdminOverview {
  counts: {
    users: number;
    students: number;
    companies: number;
    admins: number;
    careers: number;
    subjects: number;
    exercises: number;
    challenges: number;
    open_challenges: number;
    applications: number;
    open_reports: number;
    conversations: number;
  };
  recentUsers: Array<{ id: string; full_name: string; email: string; role: Role; is_active: number; created_at: string }>;
  reports: Array<{
    id: string;
    reporter_name: string | null;
    target_type: string;
    target_id: string;
    reason: string;
    status: string;
    created_at: string;
  }>;
  recentActivity: Array<{ type: string; created_at: string; full_name: string; metadata: Record<string, unknown> }>;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  headline: string | null;
  semester: number | null;
  careerName: string | null;
  companyName: string | null;
}

export interface AdminCareer {
  id: string;
  slug: string;
  name: string;
  faculty: string;
  description: string;
  icon: string;
  color: string;
  isDemo: boolean;
  subjectCount: number;
  exerciseCount: number;
}

export interface AdminSubject {
  id: string;
  career_id: string;
  slug: string;
  name: string;
  description: string;
  semester: number | null;
  credits: number | null;
  is_published: number;
  is_demo: number;
  career_name: string;
  exercise_count: number;
  created_at: string;
}

export interface AdminExercise {
  id: string;
  title: string;
  difficulty: Difficulty;
  type: ExerciseType;
  is_published: number;
  isDemo: boolean;
  published_at: string;
  author: string;
  subject_name: string;
  topic_name: string;
  career_name: string;
}

export interface AdminChallengeRow {
  id: string;
  title: string;
  slug: string;
  companyName: string;
  category: string;
  status: 'draft' | 'open' | 'closed';
  featured: boolean;
  isDemo: boolean;
  deadline: string;
  applicationsCount: number;
  createdAt: string;
}

export interface AdminReport {
  id: string;
  reporter_id: string | null;
  reporter_name: string | null;
  reporter_email?: string | null;
  target_type: 'exercise' | 'challenge' | 'user';
  target_id: string;
  reason: string;
  status: 'open' | 'reviewed' | 'dismissed';
  created_at: string;
}

export interface PublicSummary {
  careers: number;
  subjects: number;
  exercises: number;
  challenges: number;
  companies: number;
  topics: number;
  activeVacancies: number;
  technicalTests: number;
  demo: boolean;
  notice: string;
  campus: CampusStats;
}
