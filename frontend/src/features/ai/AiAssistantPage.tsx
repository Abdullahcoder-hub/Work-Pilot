import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Send,
  Trash2,
  CheckSquare,
  Trash,
  CalendarClock,
  MessageCircle,
  Paperclip,
  X,
  Bot,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../auth/AuthContext';
import { useAiHistory, useSendAiChat, useClearAiHistory } from './useAi';
import { uploadFile } from '../files/filesApi';
import { Spinner } from '../../components/ui/Spinner';
import { AiChatMessage, ChatAttachment } from '../../types';

const SUGGESTIONS = [
  'Create a task to call the client tomorrow, high priority',
  'Mark the client call task as complete',
  'Schedule a meeting with Ali tomorrow at 3pm',
  'Message Sara that the report is ready',
  'attendance laga do',
  'Task banao: follow up on invoice, kal',
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function ActionBadge({ message }: { message: AiChatMessage }) {
  const navigate = useNavigate();
  const badgeClass = 'mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium';

  if (message.createdTaskId) {
    return (
      <button onClick={() => navigate('/tasks')} className={clsx(badgeClass, 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}>
        <CheckSquare size={11} /> Task created — view it
      </button>
    );
  }
  if (message.completedTaskId) {
    return (
      <button onClick={() => navigate('/tasks')} className={clsx(badgeClass, 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}>
        <CheckSquare size={11} /> Marked complete — view it
      </button>
    );
  }
  if (message.deletedTaskTitle) {
    return (
      <span className={clsx(badgeClass, 'bg-rose-50 text-rose-700')}>
        <Trash size={11} /> Task deleted
      </span>
    );
  }
  if (message.scheduledMeetingId) {
    return (
      <button onClick={() => navigate('/meetings')} className={clsx(badgeClass, 'bg-brand-50 text-brand-700 hover:bg-brand-100')}>
        <CalendarClock size={11} /> Meeting scheduled — view it
      </button>
    );
  }
  if (message.messagedChannelId) {
    return (
      <button
        onClick={() => navigate(`/chat?channel=${encodeURIComponent(message.messagedChannelId as string)}`)}
        className={clsx(badgeClass, 'bg-sky-50 text-sky-700 hover:bg-sky-100')}
      >
        <MessageCircle size={11} /> {message.sentFileId ? 'File sent' : 'Message sent'} — view it
      </button>
    );
  }
  if (message.attendanceAction) {
    return (
      <span className={clsx(badgeClass, 'bg-amber-50 text-amber-700')}>
        <CheckSquare size={11} /> {message.attendanceAction === 'clock_in' ? 'Clocked in' : 'Clocked out'}
      </span>
    );
  }
  return null;
}

export function AiAssistantPage() {
  const { user } = useAuth();
  const { data: history, isLoading } = useAiHistory();
  const sendChat = useSendAiChat();
  const clearHistory = useClearAiHistory();
  const [draft, setDraft] = useState('');
  const [attachedFile, setAttachedFile] = useState<ChatAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history?.length, sendChat.isPending]);

  function submit(text: string) {
    if ((!text.trim() && !attachedFile) || sendChat.isPending) return;
    sendChat.mutate(
      { message: text.trim() || `Sent a file: ${attachedFile?.fileName}`, attachedFileId: attachedFile?.fileId },
      { onError: (err) => toast.error(err instanceof Error ? err.message : 'The assistant had trouble responding') }
    );
    setDraft('');
    setAttachedFile(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit(draft);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setAttachedFile(uploaded);
      toast.success(`Attached ${uploaded.fileName} — now tell me who to send it to`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleClear() {
    if (!window.confirm('Clear this conversation? This cannot be undone.')) return;
    try {
      await clearHistory.mutateAsync();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not clear the conversation');
    }
  }

  const messages = history ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Sparkles size={15} />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">AI Assistant</h1>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Create/complete/delete tasks, schedule meetings, message teammates, send files, mark attendance — English or Roman Urdu.
          </p>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClear} className="btn-ghost text-xs">
            <Trash2 size={14} /> Clear conversation
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <Sparkles size={20} />
              </div>
              <p className="text-sm font-medium text-slate-700">Hi {user?.name.split(' ')[0]}, what can I help with?</p>
              <p className="mt-1 text-xs text-slate-400">Try a command below, or type your own.</p>
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-lg border border-border px-3 py-2 text-left text-xs text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m._id} className={clsx('flex items-start gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
                {m.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <Bot size={14} />
                  </div>
                )}
                <div className={clsx('max-w-[75%] flex flex-col', m.role === 'user' ? 'items-end' : 'items-start')}>
                  <div
                    className={clsx(
                      'rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words',
                      m.role === 'user' ? 'rounded-br-sm bg-brand-500 text-white' : 'rounded-bl-sm bg-surface-subtle text-slate-700'
                    )}
                  >
                    {m.content}
                  </div>
                  {m.role === 'assistant' && <ActionBadge message={m} />}
                  <span className="mt-1 px-1 text-[10px] text-slate-400">{formatTime(m.createdAt)}</span>
                </div>
              </div>
            ))
          )}

          {sendChat.isPending && (
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <Bot size={14} />
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface-subtle px-3.5 py-2.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {attachedFile && (
          <div className="flex items-center gap-2 border-t border-border bg-surface-subtle px-3 py-2 text-xs text-slate-600">
            <Paperclip size={12} />
            <span className="flex-1 truncate">{attachedFile.fileName}</span>
            <button onClick={() => setAttachedFile(null)} aria-label="Remove attachment" className="text-slate-400 hover:text-rose-600">
              <X size={13} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label="Attach a file"
            className="btn-secondary !px-2.5"
          >
            {isUploading ? <Spinner className="h-4 w-4" /> : <Paperclip size={15} />}
          </button>
          <input
            className="input flex-1"
            placeholder={attachedFile ? 'Who should I send this to?' : 'Type a command...'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            disabled={sendChat.isPending}
          />
          <button type="submit" disabled={sendChat.isPending || (!draft.trim() && !attachedFile)} className="btn-primary !px-3">
            {sendChat.isPending ? <Spinner className="h-4 w-4 text-white" /> : <Send size={15} />}
          </button>
        </form>
      </div>
    </div>
  );
}
