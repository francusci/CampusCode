import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { List, SignIn, X } from '@phosphor-icons/react';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { buttonStyles } from '@/components/ui/Button';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { homeForRole, useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';

const links = [
  { to: '/materias', label: 'Mis materias' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/prestamo-pcs', label: 'Préstamo de PCs' },
  { to: '/empresas', label: 'Empresas' },
  { to: '/asistente', label: 'Asistente IA' },
  { to: '/retos', label: 'Retos' },
];

export function Navbar() {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/90 bg-white/92 backdrop-blur-md">
      <div className="container-page flex h-[70px] items-center justify-between gap-4">
        <Logo size="md" />
        <nav aria-label="Navegación principal" className="hidden items-center gap-0.5 xl:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg px-3 py-2 text-[13px] font-medium transition focus-ring',
                  isActive ? 'text-electric' : 'text-ink-soft hover:bg-ink/[0.045] hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-electric" aria-hidden="true" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          {!loading && user && (
            <div className="hidden sm:block">
              <NotificationBell />
            </div>
          )}
          {!loading && user ? (
            <>
              <div className="hidden sm:block">
                <UserMenu />
              </div>
              <Link to={homeForRole(user.role)} className={buttonStyles('primary', 'sm', 'hidden sm:inline-flex')}>
                Mi panel
              </Link>
            </>
          ) : !loading ? (
            <>
              <Link to="/login" className={cn(buttonStyles('ghost', 'sm'), 'hidden sm:inline-flex')} aria-label="Iniciar sesión">
                <SignIn size={16} aria-hidden="true" />
                Iniciar sesión
              </Link>
              <Link to="/registro" className={buttonStyles('primary', 'sm', 'hidden sm:inline-flex')}>
                Comenzar gratis
              </Link>
            </>
          ) : (
            <span className="hidden h-9 w-28 animate-pulse rounded-xl bg-paper sm:block" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-10 items-center justify-center rounded-xl text-ink transition hover:bg-paper focus-ring xl:hidden"
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileOpen}
          >
            <List size={22} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-[#061226]/45 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 flex w-[min(88vw,22rem)] flex-col overflow-y-auto bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo size="sm" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg text-muted transition hover:bg-paper hover:text-ink focus-ring"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>
            <nav aria-label="Navegación móvil" className="flex flex-col gap-1 px-3 py-4">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-xl px-4 py-3 text-sm font-medium transition',
                      isActive ? 'bg-electric/8 text-electric' : 'text-ink-soft hover:bg-paper hover:text-ink',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto border-t border-line p-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-paper p-3">
                    <Avatar name={user.fullName} color={user.profile.avatarColor} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                  </div>
                  <Link to={homeForRole(user.role)} className={buttonStyles('primary', 'md', 'w-full')}>
                    Ir a mi panel
                  </Link>
                  <div className="flex justify-center">
                    <NotificationBell />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link to="/login" className={buttonStyles('secondary', 'md', 'w-full')}>
                    Iniciar sesión
                  </Link>
                  <Link to="/registro" className={buttonStyles('primary', 'md', 'w-full')}>
                    Comenzar gratis
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
