import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Hash, FolderKanban, Send, MessageSquarePlus, MessagesSquare, Paperclip, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useAuth } from '../auth/AuthContext';
import { useProjects } from '../projects/useProjects';
import { useTeam } from '../team/useTeam';
import { useChatMessages, useDmThreads } from './useChat';
import { dmChannelId, isDmChannel } from './chatApi';
import { NewDmModal } from './NewDmModal';
import { downloadFile } from '../files/filesApi';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ChatMessage } from '../../types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function dateSeparatorLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(iso, today.toISOString())) return 'Today';
  if (isSameDay(iso, yesterday.toISOString())) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function senderKey(sender: ChatMessage['senderId']): string {
  return String(typeof sender === 'object' ? sender._id : sender);
}

function senderName(sender: ChatMessage['senderId']): string {
  return typeof sender === 'object' ? sender.name : 'Unknown';
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function ChatPage() {
  const { user } = useAuth();
  const { data: projects } = useProjects();
  const { data: members } = useTeam();
  const { data: dmThreads } = useDmThreads();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeChannel, setActiveChannel] = useState(searchParams.get('channel') || 'general');
  const [newDmOpen, setNewDmOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, sending, isMine } = useChatMessages(activeChannel);

  // Deep-link support: clicking a "New message from X" notification lands
  // here with ?channel=dm:... — open straight into that thread.
  useEffect(() => {
    const fromUrl = searchParams.get('channel');
    if (fromUrl && fromUrl !== activeChannel) {
      setActiveChannel(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function selectChannel(channelId: string) {
    setActiveChannel(channelId);
    setSearchParams(channelId === 'general' ? {} : { channel: channelId }, { replace: true });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  }

  function startDmWith(userId: string) {
    if (!user) return;
    selectChannel(dmChannelId(user._id, userId));
  }

  async function handleDownload(fileId: string, fileName: string) {
    try {
      await downloadFile(fileId, fileName);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    }
  }

  const activeProject = (projects ?? []).find((p) => p._id === activeChannel);
  const activeDmOtherUser = useMemo(() => {
    if (!isDmChannel(activeChannel) || !user) return null;
    const fromThread = (dmThreads ?? []).find((t) => t.channelId === activeChannel)?.otherUser;
    if (fromThread) return fromThread;
    // Brand-new conversation with no messages yet won't be in the thread
    // list — fall back to the team roster so the header still shows a name.
    const parts = activeChannel.replace('dm:', '').split(':');
    const otherId = parts.find((id) => id !== user._id);
    return (members ?? []).find((m) => m._id === otherId) ?? null;
  }, [activeChannel, dmThreads, members, user]);

  const channelLabel = activeChannel === 'general' ? 'General' : isDmChannel(activeChannel) ? activeDmOtherUser?.name ?? 'Direct message' : activeProject?.name ?? 'Channel';

  return (
    <div className="flex h-full gap-4">
      <aside className="flex w-64 shrink-0 flex-col overflow-y-auto">
        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Channels</h2>
          <button
            onClick={() => selectChannel('general')}
            className={clsx(
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium',
              activeChannel === 'general' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-surface-subtle'
            )}
          >
            <Hash size={14} /> General
          </button>

          {(projects ?? []).length > 0 &&
            (projects ?? []).map((p) => (
              <button
                key={p._id}
                onClick={() => selectChannel(p._id)}
                className={clsx(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium',
                  activeChannel === p._id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-surface-subtle'
                )}
              >
                <FolderKanban size={14} /> <span className="truncate">{p.name}</span>
              </button>
            ))}
        </div>

        <div className="mt-5 flex-1">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Direct messages</h2>
            <button
              onClick={() => setNewDmOpen(true)}
              aria-label="New message"
              className="rounded p-1 text-slate-400 hover:bg-surface-subtle hover:text-slate-600"
            >
              <MessageSquarePlus size={15} />
            </button>
          </div>

          {(dmThreads ?? []).length === 0 ? (
            <button
              onClick={() => setNewDmOpen(true)}
              className="w-full rounded-lg border border-dashed border-border px-2.5 py-2 text-left text-xs text-slate-400 hover:border-brand-200 hover:text-brand-600"
            >
              Start a conversation
            </button>
          ) : (
            (dmThreads ?? []).map((thread) => (
              <button
                key={thread.channelId}
                onClick={() => selectChannel(thread.channelId)}
                className={clsx(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left',
                  activeChannel === thread.channelId ? 'bg-brand-50' : 'hover:bg-surface-subtle'
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {thread.otherUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={clsx('truncate text-sm', activeChannel === thread.channelId ? 'font-semibold text-brand-700' : 'font-medium text-slate-700')}>
                    {thread.otherUser.name}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {thread.lastMessage.isMine && 'You: '}
                    {thread.lastMessage.text}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-slate-400">{relativeTime(thread.lastMessage.createdAt)}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col rounded-xl border border-border bg-white">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          {isDmChannel(activeChannel) && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {channelLabel.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-sm font-semibold text-slate-800">{channelLabel}</h1>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="No messages yet"
              description={isDmChannel(activeChannel) ? `Say hello to ${channelLabel}.` : 'Say hello to get things started.'}
            />
          ) : (
            messages.map((m, i) => {
              const prev = messages[i - 1];
              const mine = isMine(m);
              const showDateSeparator = !prev || !isSameDay(prev.createdAt, m.createdAt);
              const isGrouped =
                !showDateSeparator &&
                prev &&
                senderKey(prev.senderId) === senderKey(m.senderId) &&
                new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;

              return (
                <div key={m._id}>
                  {showDateSeparator && (
                    <div className="my-3 flex items-center justify-center">
                      <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
                        {dateSeparatorLabel(m.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={clsx('flex items-end gap-2', mine ? 'flex-row-reverse' : '', isGrouped ? 'mt-0.5' : 'mt-2.5')}>
                    <div className={clsx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700', isGrouped && 'invisible')}>
                      {senderName(m.senderId).charAt(0).toUpperCase()}
                    </div>
                    <div className={clsx('max-w-[65%]', mine ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
                      {!isGrouped && !mine && !isDmChannel(activeChannel) && (
                        <span className="mb-0.5 px-1 text-xs font-medium text-slate-500">{senderName(m.senderId)}</span>
                      )}
                      {m.attachment && (
                        <button
                          onClick={() => handleDownload(m.attachment!.fileId, m.attachment!.fileName)}
                          className={clsx(
                            'flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs',
                            mine ? 'border-brand-400 bg-brand-500 text-white hover:bg-brand-600' : 'border-border bg-surface-subtle text-slate-700 hover:bg-white'
                          )}
                        >
                          <Paperclip size={13} className="shrink-0" />
                          <span className="min-w-0 flex-1 truncate font-medium">{m.attachment.fileName}</span>
                          <Download size={13} className="shrink-0" />
                        </button>
                      )}
                      {m.text && (
                        <div
                          className={clsx(
                            'flex items-end gap-1.5 rounded-2xl px-3 py-1.5 text-sm',
                            mine ? 'rounded-br-sm bg-brand-500 text-white' : 'rounded-bl-sm bg-surface-subtle text-slate-700'
                          )}
                        >
                          <span className="whitespace-pre-wrap break-words">{m.text}</span>
                          <span className={clsx('shrink-0 whitespace-nowrap text-[10px]', mine ? 'text-brand-100' : 'text-slate-400')}>
                            {formatTime(m.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
          <input
            className="input flex-1"
            placeholder={`Message ${channelLabel}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
          />
          <button type="submit" disabled={sending || !draft.trim()} className="btn-primary !px-3">
            <Send size={15} />
          </button>
        </form>
      </div>

      <NewDmModal isOpen={newDmOpen} onClose={() => setNewDmOpen(false)} onPick={startDmWith} />
    </div>
  );
}
