import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowSquareOut,
  BookmarkSimple,
  Books,
  Briefcase,
  Buildings,
  ChartLineUp,
  ClipboardText,
  Code,
  Flag,
  Gear,
  Laptop,
  List,
  Robot,
  SquaresFour,
  Trophy,
  UserCircle,
  Users,
  UsersThree,
  X,
} from '@phosphor-icons/react';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import type { Role } from '@/lib/types';

const navByRole: Record<Role, Array<{ to: string; label: string; icon: typeof SquaresFour; end?: boolean }>> = {
  student: [
    { to: '/dashboard', label: 'Resumen', icon: SquaresFour, end: true },
    { to: '/materias', label: 'Mis materias', icon: Books },
    { to: '/prestamo-pcs', label: 'Préstamo de PCs', icon: Laptop },
    { to: '/mi-progreso', label: 'Mi progreso', icon: ChartLineUp },
    { to: '/ejercicios', label: 'Banco de ejercicios', icon: Books },
    { to: '/asistente', label: 'Asistente IA', icon: Robot },
    { to: '/favoritos', label: 'Favoritos', icon: BookmarkSimple },
    { to: '/mis-retos', label: 'Mis retos', icon: Trophy },
    { to: '/perfil', label: 'Mi perfil', icon: UserCircle },
    { to: '/configuracion', label: 'Configuración', icon: Gear },
  ],
  company: [
    { to: '/empresa', label: 'Resumen', icon: SquaresFour, end: true },
    { to: '/empresa/vacantes', label: 'Vacantes', icon: Briefcase },
    { to: '/empresa/pruebas', label: 'Pruebas técnicas', icon: ClipboardText },
    { to: '/empresa/retos', label: 'Retos', icon: Trophy },
    { to: '/empresa/postulaciones', label: 'Postulaciones', icon: UsersThree },
    { to: '/prestamo-pcs', label: 'Préstamo de PCs', icon: Laptop },
    { to: '/empresa/perfil', label: 'Perfil empresarial', icon: Buildings },
  ],
  admin: [
    { to: '/admin', label: 'Resumen', icon: SquaresFour, end: true },
    { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { to: '/admin/materias', label: 'Carreras y materias', icon: Books },
    { to: '/admin/ejercicios', label: 'Ejercicios', icon: Code },
    { to: '/admin/retos', label: 'Retos', icon: Trophy },
    { to: '/prestamo-pcs', label: 'Préstamo de PCs', icon: Laptop },
    { to: '/admin/reportes', label: 'Reportes', icon: Flag },
  ],
};

const roleLabel: Record<Role, string> = {
  student: 'Área del estudiante',
  company: 'Área empresarial',
  admin: 'Administración',
};

export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  if (!user) return null;
  const nav = navByRole[user.role];
  const current = [...nav].sort((a, b) => b.to.length - a.to.length).find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[70px] items-center border-b border-line px-5">
        <Logo size="md" to={user.role === 'student' ? '/dashboard' : user.role === 'company' ? '/empresa' : '/admin'} />
      </div>
      <div className="px-4 pt-5">
        <p className="px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/80">{roleLabel[user.role]}</p>
      </div>
      <nav aria-label="Navegación del panel" className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition',
                isActive
                  ? 'bg-electric/8 text-electric'
                  : 'text-ink-soft hover:bg-ink/[0.04] hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-medium text-muted transition hover:bg-paper hover:text-ink focus-ring"
        >
          <ArrowSquareOut size={16} aria-hidden="true" />
          Volver al sitio público
        </Link>
        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-paper p-3">
          <Avatar name={user.fullName} color={user.profile.avatarColor} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">{user.fullName}</p>
            <p className="truncate text-[10px] text-muted">{user.role === 'student' ? user.profile.careerName || 'Estudiante' : user.company?.name || user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#061226]/45 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-[min(86vw,19rem)] bg-white shadow-lift">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 flex size-9 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink focus-ring"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-electric"
      >
        Saltar al contenido principal
      </a>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between gap-3 border-b border-line bg-white/92 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl text-ink-soft transition hover:bg-paper focus-ring lg:hidden"
              aria-label="Abrir menú del panel"
            >
              <List size={22} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{current?.label || 'Panel'}</p>
              <p className="hidden text-[11px] text-muted sm:block">{roleLabel[user.role]}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
        <footer className="mx-auto flex max-w-[1180px] flex-col gap-1 px-4 pb-6 text-[11px] text-muted/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>CampusCode · Panel de {user.role === 'student' ? 'estudiante' : user.role === 'company' ? 'empresa' : 'administración'}</span>
          <span>Proyecto académico de demostración · 2026</span>
        </footer>
      </div>
    </div>
  );
}
