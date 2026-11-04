import { formatDate } from '@/lib/format';
import type { SeriesPoint } from '@/lib/types';

export function ProgressChart({
  series,
  label = 'Ejercicios completados por día',
  tone = 'blue',
  height = 132,
}: {
  series: SeriesPoint[];
  label?: string;
  tone?: 'blue' | 'emerald';
  height?: number;
}) {
  const max = Math.max(1, ...series.map((point) => point.count));
  const total = series.reduce((sum, point) => sum + point.count, 0);
  const gradient =
    tone === 'emerald'
      ? 'from-emerald/15 to-emerald/65 hover:from-emerald/25 hover:to-emerald/80'
      : 'from-electric/15 to-electric/60 hover:from-electric/25 hover:to-electric/80';

  if (series.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Aún no hay actividad registrada.</p>;
  }

  return (
    <div>
      <div className="flex h-32 items-end gap-[3px] sm:gap-1.5" style={{ height }} role="img" aria-label={`${label}. Total: ${total}.`}>
        {series.map((point, index) => {
          const percent = point.count === 0 ? 4 : Math.max(8, Math.round((point.count / max) * 100));
          return (
            <div key={point.date} className="group relative flex h-full flex-1 items-end">
              <div
                className={`w-full rounded-t-[3px] bg-gradient-to-t transition ${gradient}`}
                style={{ height: `${percent}%` }}
                title={`${formatDate(point.date, { year: undefined })}: ${point.count}`}
              >
                <span className="sr-only">
                  {formatDate(point.date, { year: undefined })}: {point.count} ejercicios
                </span>
              </div>
              {index === series.length - 1 && (
                <span className="absolute -top-1 left-1/2 h-px w-full -translate-x-1/2 bg-line" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted/70">
        <span>{series.length > 1 ? formatDate(series[0].date, { year: undefined }) : 'Inicio'}</span>
        <span>{total} en total</span>
        <span>Hoy</span>
      </div>
    </div>
  );
}
