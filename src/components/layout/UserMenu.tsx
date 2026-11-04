import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CaretDown, Gear, SignOut, SquaresFour, UserCircle } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui/Avatar';
import { homeForRole, useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;
  const home = homeForRole(user.role);

  const links = [
    { to: home, label: user.role === 'company' ? 'Panel empresarial' : user.role === 'admin' ? 'Administración' : 'Mi panel', icon: SquaresFour },
    ...(user.role !== 'company' && user.role !== 'admin'
      ? [{ to: '/perfil', label: 'Mi perfil', icon: UserCircle }]
      : []),
    { to: user.role === 'company' ? '/empresa/perfil' : user.role === 'admin' ? '/admin/usuarios' : '/configuracion', label: user.role === 'company' ? 'Perfil de empresa' : 'Configuración', icon: user.role === 'company' ? UserCircle : Gear },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-ink/[0.055] focus-ring"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={user.fullName} color={user.profile.avatarColor} size="sm" />
        {!compact && (
          <span className="hidden max-w-32 text-left xl:block">
            <span className="block truncate text-xs font-semibold text-ink">{user.fullName}</span>
            <span className="block text-[10px] text-muted">{user.role === 'student' ? 'Estudiante' : user.role === 'company' ? 'Empresa' : 'Admin'}</span>
          </span>
        )}
        <CaretDown size={12} className="text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-lift" role="menu">
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition hover:bg-paper hover:text-ink focus-ring"
            >
              <link.icon size={17} />
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              try {
                await logout();
                success('Sesión cerrada correctamente.');
                navigate('/');
              } catch {
                error('No pudimos cerrar la sesión. Intenta de nuevo.');
              }
            }}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-rose transition hover:bg-rose/5 focus-ring"
          >
            <SignOut size={17} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
