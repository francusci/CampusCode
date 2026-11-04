import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Books,
  Briefcase,
  ClipboardText,
  Code,
  Laptop,
  Robot,
} from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

const accessItems = [
  {
    to: '/materias',
    title: 'Mis materias',
    description: 'Registra tus materias por carrera y arma tu tablero académico.',
    icon: Books,
    tone: 'bg-electric/8 text-electric',
    ring: 'group-hover:border-electric/30',
    badge: 'Nuevo',
  },
  {
    to: '/prestamo-pcs',
    title: 'Préstamo de computadores',
    description: 'Consulta equipos, registra entrada y salida y reporta su estado.',
    icon: Laptop,
    tone: 'bg-emerald/10 text-emerald',
    ring: 'group-hover:border-emerald/30',
    badge: 'Campus',
  },
  {
    to: '/empresas#vacantes',
    title: 'Portal de empresas',
    description: 'Explora vacantes junior, prácticas y pruebas técnicas de admisión.',
    icon: Briefcase,
    tone: 'bg-violet/10 text-violet',
    ring: 'group-hover:border-violet/30',
    badge: 'Empleo',
  },
  {
    to: '/catalogo',
    title: 'Catálogo académico',
    description: 'Navega por carreras, materias, temas y ejercicios de demostración.',
    icon: Code,
    tone: 'bg-cyan/10 text-cyan',
    ring: 'group-hover:border-cyan/30',
  },
  {
    to: '/asistente',
    title: 'Asistente IA',
    description: 'Pide explicaciones paso a paso y contrasta el estado real del proveedor.',
    icon: Robot,
    tone: 'bg-amber/10 text-amber',
    ring: 'group-hover:border-amber/30',
  },
  {
    to: '/retos',
    title: 'Retos y entregables',
    description: 'Postúlate a desafíos de empresas y registra evidencia de tu trabajo.',
    icon: ClipboardText,
    tone: 'bg-rose/10 text-rose',
    ring: 'group-hover:border-rose/30',
  },
];

export function QuickAccess() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {accessItems.map((item, index) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            'group surface relative flex flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift',
            item.ring,
          )}
          style={{ transitionDelay: `${index * 15}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <span className={cn('flex size-11 items-center justify-center rounded-xl', item.tone)}>
              <item.icon size={21} weight="duotone" aria-hidden="true" />
            </span>
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] font-semibold text-muted">
                  {item.badge}
                </span>
              )}
              <ArrowUpRight
                size={16}
                className="text-muted/50 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-electric"
                aria-hidden="true"
              />
            </div>
          </div>
          <h3 className="mt-4 text-[15px] font-semibold tracking-[-0.015em] text-ink">{item.title}</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
