import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from '@phosphor-icons/react';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth';

const platformLinks = [
  { label: 'Catálogo de materias', to: '/catalogo' },
  { label: 'Préstamo de computadores', to: '/prestamo-pcs' },
  { label: 'Banco de ejercicios', to: '/ejercicios' },
  { label: 'Asistente académico', to: '/asistente' },
  { label: 'Retos y vacantes', to: '/retos' },
];

const projectLinks = [
  { label: 'Sobre CampusCode', to: '/sobre-nosotros' },
  { label: 'Para empresas', to: '/empresas' },
  { label: 'Configuración de IA', to: '/sobre-nosotros#ia' },
  { label: 'Privacidad y datos', to: '/sobre-nosotros#privacidad' },
];

const accountLinks = {
  guest: [
    { label: 'Iniciar sesión', to: '/login' },
    { label: 'Crear cuenta', to: '/registro' },
    { label: 'Catálogo de materias', to: '/catalogo' },
    { label: 'Préstamo de PCs', to: '/prestamo-pcs' },
    { label: 'Ver retos', to: '/retos' },
  ],
  student: [
    { label: 'Mi panel', to: '/dashboard' },
    { label: 'Mis materias', to: '/materias' },
    { label: 'Préstamo de PCs', to: '/prestamo-pcs' },
    { label: 'Mis favoritos', to: '/favoritos' },
    { label: 'Mis retos', to: '/mis-retos' },
  ],
  company: [
    { label: 'Panel empresarial', to: '/empresa' },
    { label: 'Vacantes', to: '/empresa/vacantes' },
    { label: 'Pruebas técnicas', to: '/empresa/pruebas' },
    { label: 'Postulaciones', to: '/empresa/postulaciones' },
    { label: 'Perfil de empresa', to: '/empresa/perfil' },
  ],
  admin: [
    { label: 'Administración', to: '/admin' },
    { label: 'Usuarios', to: '/admin/usuarios' },
    { label: 'Catálogo', to: '/admin/materias' },
    { label: 'Préstamo de PCs', to: '/prestamo-pcs' },
    { label: 'Reportes', to: '/admin/reportes' },
  ],
};

export function Footer() {
  const { user } = useAuth();
  const columns = [
    { title: 'Plataforma', links: platformLinks },
    { title: 'Tu cuenta', links: user ? accountLinks[user.role] : accountLinks.guest },
    { title: 'Proyecto', links: projectLinks },
  ];

  return (
    <footer className="bg-ink-gradient text-white">
      <div className="container-page py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo variant="light" size="md" showTagline />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              Un espacio académico para practicar, comprender y demostrar lo que sabes. Proyecto de emprendimiento de la
              Universidad Mayor de Cartagena.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] text-white/70">
              <ShieldCheck size={14} className="text-[#a5b4fc]" aria-hidden="true" />
              Datos de demostración identificados
            </div>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-1 text-sm text-white/65 transition hover:text-white focus-ring"
                    >
                      {link.label}
                      <ArrowUpRight size={12} className="opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>© 2026 CampusCode. Proyecto académico de demostración.</p>
          <p>Hecho en Cartagena, Colombia · React, Node.js y SQLite</p>
        </div>
      </div>
    </footer>
  );
}
