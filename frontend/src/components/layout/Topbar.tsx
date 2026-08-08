import { useEffect, useRef, useState } from 'react';
import { LogOut, ChevronDown, Palette } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { NotificationBell } from '../../features/notifications/NotificationBell';

const THEME_STORAGE_KEY = 'workpilot-theme';
const THEME_MODE_STORAGE_KEY = 'workpilot-theme-mode';

const THEME_OPTIONS = [
  { id: 'indigo', label: 'Indigo', accent: 'rgb(96 71 255)' },
  { id: 'teal', label: 'Teal', accent: 'rgb(20 184 166)' },
  { id: 'rose', label: 'Rose', accent: 'rgb(236 72 153)' },
  { id: 'amber', label: 'Amber', accent: 'rgb(245 158 11)' },
  { id: 'emerald', label: 'Emerald', accent: 'rgb(16 185 129)' },
  { id: 'slate', label: 'Slate', accent: 'rgb(71 85 105)' },
  { id: 'midnight', label: 'Midnight', accent: 'rgb(147 180 255)' },
  { id: 'forest', label: 'Forest', accent: 'rgb(102 255 175)' },
];

const MODE_OPTIONS: { id: 'light' | 'dark'; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const ROLE_LABEL: Record<string, string> = {
  company_admin: 'Company Admin',
  team_lead: 'Team Lead',
  employee: 'Employee',
  super_admin: 'Super Admin',
};

export function Topbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuContainerRef = useRef<HTMLDivElement>(null);
  const profileMenuContainerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<string>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored && THEME_OPTIONS.some((option) => option.id === stored) ? stored : THEME_OPTIONS[0].id;
  });
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    THEME_OPTIONS.forEach((option) => root.classList.remove(`theme-${option.id}`));
    root.classList.add(`theme-${theme}`);
    root.classList.toggle('dark', mode === 'dark');
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  }, [theme, mode]);

  // Neither dropdown closed on outside click or Escape before this — clicking
  // anywhere else on the page, or pressing Escape, left them open.
  useEffect(() => {
    if (!themeMenuOpen && !menuOpen) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (themeMenuOpen && !themeMenuContainerRef.current?.contains(target)) {
        setThemeMenuOpen(false);
      }
      if (menuOpen && !profileMenuContainerRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setThemeMenuOpen(false);
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [themeMenuOpen, menuOpen]);

  const selectedTheme = THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0];

  return (
    <header className="flex h-14 items-center justify-end gap-2 border-b border-border bg-white px-6">
      <NotificationBell />

      <div className="relative" ref={themeMenuContainerRef}>
        <button
          onClick={() => setThemeMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-700 hover:bg-surface-subtle"
          aria-label="Change theme"
        >
          <Palette size={16} />
          <span>{selectedTheme.label} · {mode === 'dark' ? 'Dark' : 'Light'}</span>
        </button>

        {themeMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-border bg-white py-2 shadow-popover">
            <div className="px-3 pb-2 pt-3 text-xs uppercase tracking-wide text-slate-500">Mode</div>
            <div className="grid grid-cols-2 gap-2 px-3 pb-3">
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setMode(option.id);
                    setThemeMenuOpen(false);
                  }}
                  className={`rounded-lg border px-2 py-2 text-sm ${mode === option.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-border bg-surface text-slate-600 hover:bg-surface-subtle'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="px-3 pb-2 pt-2 text-xs uppercase tracking-wide text-slate-500">Theme</div>
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setTheme(option.id);
                  setThemeMenuOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${theme === option.id ? 'text-slate-900' : 'text-slate-600'} hover:bg-surface-subtle`}
              >
                <span className="inline-flex h-2.5 w-2.5 rounded-full border border-border" style={{ backgroundColor: option.accent }} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={profileMenuContainerRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-subtle"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium leading-tight text-slate-800">{user?.name}</div>
            <div className="text-xs leading-tight text-slate-500">{user ? ROLE_LABEL[user.role] : ''}</div>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-white py-1 shadow-popover">
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-surface-subtle"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
