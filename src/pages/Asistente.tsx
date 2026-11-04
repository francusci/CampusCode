import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChatCircleDots,
  CircleNotch,
  ClockCounterClockwise,
  Info,
  PaperPlaneTilt,
  Plus,
  Robot,
  Sparkle,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Markdown } from '@/components/ui/Markdown';
import { PageLoader } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState } from '@/components/ui/States';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { AiStatus, ChatMessage, Conversation, SubjectSummary } from '@/lib/types';

const suggestions = [
  'Explícame la diferencia entre una lista y una tupla en Python.',
  '¿Cómo funciona la búsqueda binaria paso a paso?',
  'Ayúdame a entender los límites con un ejemplo.',
  'Dame un plan de estudio para mi próximo examen.',
];

export default function Asistente() {
  const { user } = useAuth();
  const toast = useToast();
  const aiStatus = useAsyncData(() => api.get<AiStatus>('/ai/status'), []);
  const subjects = useAsyncData(() => api.get<{ items: SubjectSummary[] }>('/subjects'), []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(Boolean(user));
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setConversationsLoading(false);
      return;
    }
    let active = true;
    setConversationsLoading(true);
    api
      .get<{ items: Conversation[] }>('/conversations')
      .then((response) => {
        if (!active) return;
        setConversations(response.items);
        setConversationsLoading(false);
      })
      .catch((caught) => {
        if (!active) return;
        setConversationError(caught instanceof Error ? caught : new Error('No pudimos cargar el historial.'));
        setConversationsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (activeId) return;
    if (conversations.length > 0) setActiveId(conversations[0].id);
  }, [user, conversations, activeId]);

  useEffect(() => {
    if (!user || !activeId) {
      if (!user) setMessages([]);
      return;
    }
    let active = true;
    setMessagesLoading(true);
    api
      .get<{ conversation: Conversation; messages: ChatMessage[] }>(`/conversations/${activeId}`)
      .then((response) => {
        if (!active) return;
        setMessages(response.messages);
        setSubjectId(response.conversation.subjectId || '');
        setMessagesLoading(false);
      })
      .catch((caught) => {
        if (!active) return;
        toast.error(caught instanceof Error ? caught.message : 'No pudimos cargar la conversación.');
        setMessagesLoading(false);
        setActiveId('');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  async function refreshConversations() {
    if (!user) return;
    try {
      const response = await api.get<{ items: Conversation[] }>('/conversations');
      setConversations(response.items);
    } catch {
      // El historial no es crítico para enviar un mensaje.
    }
  }

  async function changeSubject(nextSubject: string) {
    setSubjectId(nextSubject);
    if (!user || !activeId) return;
    try {
      await api.patch(`/conversations/${activeId}`, { subjectId: nextSubject || null });
      await refreshConversations();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar la materia.');
    }
  }

  async function newConversation() {
    if (!user) {
      toast.info('Crea una cuenta para guardar conversaciones.');
      return;
    }
    setActiveId('');
    setMessages([]);
    setInput('');
    setSubjectId('');
    textareaRef.current?.focus();
  }

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setInput('');
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    setMessages((current) => [...current, optimistic]);

    try {
      if (!user) {
        const history = [...messages.filter((message) => message.role === 'user').slice(-5), optimistic];
        const response = await api.post<{ reply: { content: string; provider: string }; notice: string }>('/ai/guest', {
          messages: history.map((message) => ({ role: 'user', content: message.content })),
        });
        setMessages((current) => [
          ...current.filter((message) => message.id !== optimistic.id),
          optimistic,
          {
            id: `local-${Date.now()}`,
            role: 'assistant',
            content: response.reply.content,
            provider: response.reply.provider,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          },
        ]);
      } else if (activeId) {
        const response = await api.post<{ userMessage: ChatMessage; reply: ChatMessage }>(`/conversations/${activeId}/messages`, { content });
        setMessages((current) => [
          ...current.filter((message) => message.id !== optimistic.id),
          response.userMessage,
          response.reply,
        ]);
        await refreshConversations();
      } else {
        const created = await api.post<{ conversation: Conversation }>('/conversations', { subjectId: subjectId || null });
        const response = await api.post<{ userMessage: ChatMessage; reply: ChatMessage }>(
          `/conversations/${created.conversation.id}/messages`,
          { content },
        );
        setMessages((current) => [
          ...current.filter((message) => message.id !== optimistic.id),
          response.userMessage,
          response.reply,
        ]);
        setActiveId(created.conversation.id);
        await refreshConversations();
      }
    } catch (caught) {
      setMessages((current) => current.filter((message) => message.id !== optimistic.id));
      setInput(content);
      toast.error(caught instanceof Error ? caught.message : 'No pudimos enviar tu mensaje.');
      if (user && activeId) {
        try {
          const response = await api.get<{ conversation: Conversation; messages: ChatMessage[] }>(`/conversations/${activeId}`);
          setMessages(response.messages);
        } catch {
          // Si la recarga falla, mantenemos el estado actual.
        }
      }
    } finally {
      setSending(false);
      window.setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/conversations/${deleteTarget.id}`);
      setConversations((current) => current.filter((item) => item.id !== deleteTarget.id));
      if (activeId === deleteTarget.id) {
        setActiveId('');
        setMessages([]);
      }
      setDeleteTarget(null);
      toast.success('Conversación eliminada.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos eliminar la conversación.');
    } finally {
      setDeleting(false);
    }
  }

  const status = aiStatus.data;
  const activeConversation = conversations.find((item) => item.id === activeId) || null;

  return (
    <div>
      <section className="border-b border-line bg-white">
        <div className="container-page py-8 sm:py-10">
          <PageHeader
            breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Asistente académico' }]}
            title="Asistente académico"
            description="Pregunta sobre conceptos, procedimientos o ejercicios. Recibirás una explicación con ejemplos y un siguiente paso concreto de estudio."
            actions={
              status ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold',
                    status.configured ? 'border-emerald/25 bg-emerald/[0.06] text-emerald' : 'border-amber/25 bg-amber/[0.06] text-amber',
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', status.configured ? 'bg-emerald' : 'bg-amber')} aria-hidden="true" />
                  {status.configured ? 'IA conectada' : 'Guía local · IA no configurada'}
                </span>
              ) : null
            }
          />
        </div>
      </section>

      <div className="container-page py-6 sm:py-8">
        {aiStatus.error ? (
          <ErrorState message="No pudimos consultar el estado del asistente." onRetry={aiStatus.reload} />
        ) : (
          <>
            {status && (
              <div
                className={cn(
                  'mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[11.5px] leading-relaxed',
                  status.configured ? 'border-emerald/20 bg-emerald/[0.045] text-emerald' : 'border-amber/20 bg-amber/[0.05] text-amber',
                )}
                role="status"
              >
                {status.configured ? <Sparkle size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> : <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />}
                <p>
                  {status.message}
                  {status.configured && status.model ? ` Modelo configurado: ${status.model}.` : ''}
                  {!status.configured && ' Las respuestas de guía local no son generadas por un modelo de lenguaje.'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
              {user ? (
                <aside className="hidden lg:block">
                  <div className="surface sticky top-[86px] flex max-h-[calc(100dvh-110px)] flex-col overflow-hidden">
                    <div className="border-b border-line p-4">
                      <Button size="sm" className="w-full" onClick={newConversation} icon={<Plus size={15} />}>Nueva conversación</Button>
                      <div className="mt-3">
                        <label htmlFor="chat-subject" className="mb-1 block text-[10.5px] font-semibold text-ink-soft">Materia (opcional)</label>
                        <Select id="chat-subject" value={subjectId} onChange={(event) => changeSubject(event.target.value)} className="text-[12px]">
                          <option value="">Sin materia</option>
                          {(subjects.data?.items || []).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                        </Select>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-2 scrollbar-thin">
                      <p className="px-2 py-2 font-mono text-[9px] uppercase tracking-[0.15em] text-muted">Historial</p>
                      {conversationsLoading ? (
                        <div className="space-y-2 p-2">
                          {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-paper" />)}
                        </div>
                      ) : conversations.length === 0 ? (
                        <div className="px-3 py-6 text-center">
                          <ChatCircleDots size={24} className="mx-auto text-muted/60" aria-hidden="true" />
                          <p className="mt-2 text-[11px] leading-relaxed text-muted">Tus conversaciones guardadas aparecerán aquí.</p>
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {conversations.map((conversation) => (
                            <li key={conversation.id} className="group relative">
                              <button
                                type="button"
                                onClick={() => setActiveId(conversation.id)}
                                className={cn(
                                  'w-full rounded-lg px-2.5 py-2 pr-8 text-left transition focus-ring',
                                  activeId === conversation.id ? 'bg-electric/8 text-electric' : 'text-ink-soft hover:bg-paper',
                                )}
                              >
                                <span className="block truncate text-[12px] font-medium">{conversation.title}</span>
                                <span className="mt-0.5 block text-[10px] text-muted">{conversation.messageCount} mensajes · {relativeTime(conversation.updatedAt)}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(conversation)}
                                className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted opacity-0 transition hover:bg-rose/10 hover:text-rose focus-ring group-hover:opacity-100 focus-visible:opacity-100"
                                aria-label={`Eliminar conversación ${conversation.title}`}
                              >
                                <Trash size={12} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="border-t border-line p-3">
                      <Link to="/configuracion" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10.5px] text-muted transition hover:text-ink">
                        <ClockCounterClockwise size={13} aria-hidden="true" /> Historial privado de tu cuenta
                      </Link>
                    </div>
                  </div>
                </aside>
              ) : (
                <aside className="hidden lg:block">
                  <div className="surface p-5">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-electric/8 text-electric"><Robot size={21} weight="duotone" aria-hidden="true" /></span>
                    <h2 className="mt-3 text-sm font-semibold text-ink">Modo visitante</h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      Puedes hacer hasta 12 preguntas por hora. La conversación no se guarda. Crea una cuenta gratuita para conservar el historial.
                    </p>
                    <Link to="/registro" className={buttonStyles('primary', 'sm', 'mt-4 w-full')}>Crear cuenta gratis</Link>
                    <Link to="/login" className={buttonStyles('secondary', 'sm', 'mt-2 w-full')}>Iniciar sesión</Link>
                  </div>
                  <div className="mt-4 rounded-2xl border border-line bg-white p-5">
                    <h2 className="text-xs font-semibold text-ink">Qué puedes preguntar</h2>
                    <ul className="mt-2.5 space-y-2 text-[11px] leading-relaxed text-muted">
                      <li>· Conceptos que no entiendes en clase.</li>
                      <li>· Pasos de un ejercicio o una demostración.</li>
                      <li>· Cómo estudiar un tema o preparar un examen.</li>
                      <li>· Diferencias entre dos definiciones parecidas.</li>
                    </ul>
                  </div>
                </aside>
              )}

              <section
                className="surface flex min-h-[560px] flex-col overflow-hidden lg:min-h-[calc(100dvh-190px)]"
                aria-label="Conversación con el asistente"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-gradient text-white"><Robot size={17} weight="duotone" aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">{activeConversation?.title || 'Nueva conversación'}</p>
                      <p className="text-[10px] text-muted">{status?.configured ? 'Asistente conectado a un proveedor externo' : 'Guía local determinista de CampusCode'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeConversation?.subjectName && <Badge tone="slate">{activeConversation.subjectName}</Badge>}
                    {user && <Button size="sm" variant="secondary" onClick={newConversation} icon={<Plus size={13} />} className="lg:hidden">Nueva</Button>}
                  </div>
                </div>

                {user && conversations.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto border-b border-line bg-paper/60 px-3 py-2 lg:hidden">
                    {conversations.slice(0, 6).map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => setActiveId(conversation.id)}
                        className={cn(
                          'max-w-[180px] shrink-0 truncate rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition focus-ring',
                          activeId === conversation.id ? 'border-electric/25 bg-electric/8 text-electric' : 'border-line bg-white text-ink-soft',
                        )}
                      >
                        {conversation.title}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin sm:px-6" aria-live="polite">
                  {messagesLoading ? (
                    <div className="flex justify-center py-10"><PageLoader label="Cargando conversación…" /></div>
                  ) : messages.length === 0 ? (
                    <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center py-8 text-center">
                      <span className="flex size-14 items-center justify-center rounded-2xl bg-electric/8 text-electric"><Robot size={28} weight="duotone" aria-hidden="true" /></span>
                      <h2 className="mt-4 text-lg font-semibold text-ink">¿Qué quieres entender hoy?</h2>
                      <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted">
                        Pregunta con tus propias palabras. Incluye el enunciado o el intento que llevas para recibir una explicación más útil.
                      </p>
                      <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => sendMessage(suggestion)}
                            disabled={sending}
                            className="rounded-xl border border-line bg-white px-3 py-2.5 text-left text-[11px] leading-relaxed text-ink-soft transition hover:border-electric/30 hover:bg-electric/[0.03] focus-ring disabled:opacity-60"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {messages.map((message) => {
                        const isUser = message.role === 'user';
                        return (
                          <div key={message.id} className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}>
                            {isUser ? (
                              <Avatar name={user?.fullName || 'Visitante'} color={user?.profile.avatarColor || 'slate'} size="xs" />
                            ) : (
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-gradient text-white"><Robot size={14} weight="duotone" aria-hidden="true" /></span>
                            )}
                            <div className={cn('max-w-[88%] min-w-0 sm:max-w-[80%]', isUser && 'text-right')}>
                              <div
                                className={cn(
                                  'inline-block max-w-full break-words rounded-2xl px-3.5 py-2.5 text-left text-[13px]',
                                  isUser ? 'bg-electric text-white' : 'border border-line bg-paper text-ink',
                                )}
                              >
                                {isUser ? (
                                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                ) : (
                                  <Markdown content={message.content} />
                                )}
                              </div>
                              {!isUser && (
                                <p className="mt-1 text-[9.5px] text-muted">
                                  {message.provider === 'local-guide' ? 'Guía local · no generada por IA' : message.provider ? 'Respuesta generada por IA' : 'Asistente'}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {sending && (
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-gradient text-white"><Robot size={14} weight="duotone" aria-hidden="true" /></span>
                          <span className="inline-flex items-center gap-2 rounded-2xl border border-line bg-paper px-3.5 py-2.5 text-[12px] text-muted">
                            <CircleNotch size={14} className="animate-spin text-electric" aria-hidden="true" />
                            Preparando una respuesta…
                          </span>
                        </div>
                      )}
                      <div ref={endRef} />
                    </div>
                  )}
                </div>

                <div className="border-t border-line bg-white px-3 py-3 sm:px-5 sm:py-4">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void sendMessage(input);
                    }}
                    className="flex items-end gap-2"
                  >
                    <label htmlFor="chat-input" className="sr-only">Escribe tu pregunta</label>
                    <textarea
                      id="chat-input"
                      ref={textareaRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          void sendMessage(input);
                        }
                      }}
                      rows={1}
                      maxLength={4000}
                      placeholder="Escribe tu pregunta académica…"
                      className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/10"
                    />
                    <Button type="submit" size="md" loading={sending} disabled={!input.trim()} icon={!sending ? <PaperPlaneTilt size={16} /> : undefined}>
                      <span className="hidden sm:inline">Enviar</span>
                    </Button>
                  </form>
                  <p className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[9.5px] text-muted">
                    <span>Enter para enviar · Shift + Enter para salto de línea</span>
                    <span>{user ? 'Historial privado guardado en tu cuenta.' : 'Modo visitante: no se guarda el historial.'}</span>
                  </p>
                </div>
              </section>
            </div>

            {!user && (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-electric/15 bg-[#edf3ff] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-ink-soft">
                  <strong className="font-semibold text-ink">¿Quieres conservar tus conversaciones?</strong> Crea una cuenta gratuita para volver a tus explicaciones y conectar el asistente con tu progreso.
                </p>
                <Link to="/registro" className={buttonStyles('primary', 'sm', 'shrink-0')}>Crear cuenta <ArrowRight size={13} aria-hidden="true" /></Link>
              </div>
            )}

            {conversationError && (
              <p className="mt-4 flex items-center gap-1.5 text-[11px] text-rose" role="alert">
                <WarningCircle size={13} aria-hidden="true" /> {conversationError.message}
              </p>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar conversación"
        description={`Se eliminará “${deleteTarget?.title || ''}” y todos sus mensajes. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </div>
  );
}
