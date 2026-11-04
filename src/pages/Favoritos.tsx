import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkSimple, Books } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { CardSkeleton } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ExerciseCard } from '@/components/common/ExerciseCard';
import { DemoNotice } from '@/components/common/DemoNotice';
import { buttonStyles } from '@/components/ui/Button';
import { plural } from '@/lib/format';
import type { Exercise } from '@/lib/types';

export default function Favoritos() {
  const toast = useToast();
  const favorites = useAsyncData(() => api.get<{ items: Exercise[] }>('/me/favorites'), []);
  const [items, setItems] = useState<Exercise[] | null>(null);
  const [busy, setBusy] = useState(false);

  const list = items ?? favorites.data?.items ?? [];

  async function removeFavorite(exercise: Exercise) {
    if (busy) return;
    setBusy(true);
    try {
      await api.post(`/exercises/${exercise.id}/favorite`);
      setItems(list.filter((item) => item.id !== exercise.id));
      toast.success('Ejercicio eliminado de favoritos.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos quitar el favorito.');
    } finally {
      setBusy(false);
    }
  }

  if (favorites.loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mis favoritos" description="Ejercicios que guardaste para volver después." />
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} />)}</div>
      </div>
    );
  }

  if (favorites.error) return <ErrorState message={favorites.error.message} onRetry={favorites.reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis favoritos"
        description="Tu lista personal de ejercicios para repasar. Quitar un favorito no borra tu progreso ni tus intentos."
        actions={<Link to="/ejercicios" className={buttonStyles('primary', 'md')}>Explorar ejercicios</Link>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">{plural(list.length, 'ejercicio guardado', 'ejercicios guardados')}.</p>
        <DemoNotice compact className="max-w-md">Los favoritos se guardan en tu cuenta de demostración.</DemoNotice>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={BookmarkSimple}
          title="Tu lista de favoritos está vacía"
          description="Usa el ícono de marcador en cualquier ejercicio para guardarlo aquí y retomarlo cuando quieras."
          action={<Link to="/ejercicios" className={buttonStyles('primary', 'sm')}><Books size={15} aria-hidden="true" /> Explorar ejercicios</Link>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onToggleFavorite={removeFavorite}
              favoriteBusy={busy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
