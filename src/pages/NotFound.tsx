import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, MagnifyingGlass } from '@phosphor-icons/react';
import { buttonStyles } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]" aria-hidden="true" />
      <div className="container-page relative flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-electric/8 text-electric">
          <Compass size={32} weight="duotone" aria-hidden="true" />
        </span>
        <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Error 404</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">Esta página no está en el mapa.</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          Puede que el enlace haya cambiado o que el recurso ya no exista. Vuelve al inicio o busca una materia para continuar.
        </p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Link to="/" className={buttonStyles('primary', 'md')}>
            <ArrowLeft size={15} aria-hidden="true" /> Volver al inicio
          </Link>
          <Link to="/catalogo" className={buttonStyles('secondary', 'md')}>
            <MagnifyingGlass size={15} aria-hidden="true" /> Explorar materias
          </Link>
        </div>
      </div>
    </section>
  );
}
