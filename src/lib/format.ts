import type { Application, Difficulty, ExerciseType, Role } from './types';

export const difficultyLabels: Record<Difficulty, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export const difficultyClass: Record<Difficulty, string> = {
  basico: 'bg-emerald/10 text-emerald border-emerald/20',
  intermedio: 'bg-amber/10 text-amber border-amber/20',
  avanzado: 'bg-rose/10 text-rose border-rose/20',
};

export const typeLabels: Record<ExerciseType, string> = {
  multiple: 'Opción múltiple',
  abierta: 'Respuesta abierta',
  codigo: 'Código',
};

export const roleLabels: Record<Role, string> = {
  student: 'Estudiante',
  company: 'Empresa',
  admin: 'Administrador',
};

export const applicationStatusLabels: Record<Application['status'], string> = {
  submitted: 'Enviada',
  reviewing: 'En revisión',
  accepted: 'Aceptada',
  rejected: 'No seleccionada',
  withdrawn: 'Retirada',
};

export const applicationStatusClass: Record<Application['status'], string> = {
  submitted: 'bg-electric/10 text-electric border-electric/20',
  reviewing: 'bg-amber/10 text-amber border-amber/20',
  accepted: 'bg-emerald/10 text-emerald border-emerald/20',
  rejected: 'bg-rose/10 text-rose border-rose/20',
  withdrawn: 'bg-slate-100 text-slate-500 border-slate-200',
};

export function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Sin fecha';
  const normalized = value.length === 10 ? `${value}T12:00:00` : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Sin fecha';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function relativeTime(value: string) {
  const date = new Date(value.replace(' ', 'T'));
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return '';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  return formatDate(value, { year: undefined });
}

export function daysUntil(value: string) {
  const deadline = new Date(`${value}T23:59:59`);
  const diff = deadline.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export const activityLabels: Record<string, string> = {
  exercise_completed: 'Completó un ejercicio',
  exercise_attempt: 'Intentó un ejercicio',
  favorite: 'Guardó un ejercicio',
  goal_created: 'Creó un objetivo',
  goal_completed: 'Completó un objetivo',
  application: 'Se postuló a un reto',
  deliverable: 'Registró un entregable',
  login: 'Inició sesión',
};
