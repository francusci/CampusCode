import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/cn';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    api
      .get<{ items: Notification[]; unread: number }>('/auth/me/notifications')
      .then((response) => {
        if (!active) return;
        setItems(response.items);
        setUnread(response.unread);
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const markAll = async () => {
    try {
      await api.post('/auth/me/notifications/read-all');
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnread(0);
    } catch {
      // Se mantiene el estado visual si la operación falla.
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-10 items-center justify-center rounded-xl text-ink-soft transition hover:bg-ink/[0.055] focus-ring"
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[9px] font-bold leading-4 text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notificaciones</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-[11px] font-semibold text-electric hover:underline focus-ring">
                Marcar leídas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {loading ? (
              <p className="px-4 py-6 text-center text-xs text-muted">Cargando…</p>
            ) : items.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle size={24} className="mx-auto text-emerald" weight="duotone" />
                <p className="mt-2 text-xs text-muted">No tienes notificaciones por ahora.</p>
              </div>
            ) : (
              items.map((item) => {
                const content = (
                  <div className={cn('border-b border-line/70 px-4 py-3 transition last:border-0 hover:bg-paper', !item.read && 'bg-electric/[0.035]')}>
                    <div className="flex items-start gap-2">
                      {!item.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-electric" aria-label="Sin leer" />}
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.body}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted/70">{relativeTime(item.created_at)}</p>
                      </div>
                    </div>
                  </div>
                );
                return item.link ? (
                  <Link key={item.id} to={item.link} onClick={() => setOpen(false)} className="block focus-ring">
                    {content}
                  </Link>
                ) : (
                  <div key={item.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
