/**
 * ============================================================
 * SMART TO-DO APP — Production JavaScript
 * HTML5 + CSS3 + Vanilla JS
 * ============================================================
 */

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const DOM = {
  // App shell / Auth screen
  appRoot:             document.getElementById('app-root'),
  authOverlay:         document.getElementById('auth-overlay'),
  authTabLogin:        document.getElementById('auth-tab-login'),
  authTabRegister:     document.getElementById('auth-tab-register'),
  authError:           document.getElementById('auth-error'),
  loginForm:           document.getElementById('login-form'),
  registerForm:        document.getElementById('register-form'),
  loginEmailInput:     document.getElementById('login-email'),
  loginPasswordInput:  document.getElementById('login-password'),
  registerNameInput:   document.getElementById('register-name'),
  registerEmailInput:  document.getElementById('register-email'),
  registerPasswordInput: document.getElementById('register-password'),
  loginSubmitBtn:      document.getElementById('login-submit-btn'),
  registerSubmitBtn:   document.getElementById('register-submit-btn'),
  avatarLogoutBtn:     document.getElementById('avatar-logout-btn'),
  avatarInitials:      document.getElementById('avatar-initials'),

  // Navbar
  greeting:            document.getElementById('greeting'),
  currentDate:         document.getElementById('current-date'),
  searchInput:         document.getElementById('search-input'),
  searchResultsCounter: document.getElementById('search-results-counter'),

  // Sidebar
  sidebarPendingCount: document.getElementById('sidebar-pending-count'),
  navLinks:            document.querySelectorAll('.nav-link'),

  // Pages
  pages:               document.querySelectorAll('.page'),
  pageDashboard:       document.getElementById('page-dashboard'),
  pageTasks:           document.getElementById('page-tasks'),
  pageSettings:        document.getElementById('page-settings'),

  // Statistics
  statTotal:           document.getElementById('stat-total'),
  statPending:         document.getElementById('stat-pending'),
  statCompleted:       document.getElementById('stat-completed'),
  statToday:           document.getElementById('stat-today'),

  // Dashboard task preview
  dashboardTaskList:   document.getElementById('dashboard-task-list'),
  dashboardEmptyState: document.getElementById('dashboard-empty-state'),
  dashboardRecentMeta: document.getElementById('dashboard-recent-meta'),

  // Tasks page
  tasksPageTitle:      document.getElementById('tasks-page-title'),
  taskCountMeta:       document.getElementById('task-count-meta'),
  taskList:            document.getElementById('task-list'),
  emptyState:          document.getElementById('empty-state'),
  filterTabs:          document.querySelectorAll('.filter-tab'),
  sortSelect:          document.getElementById('sort-select'),

  // Buttons
  addTaskBtn:          document.getElementById('add-task-btn'),
  addTaskBtnDashboard: document.getElementById('add-task-btn-dashboard'),
  clearAllBtn:         document.getElementById('clear-all-btn'),

  // Theme toggle
  themeToggleBtn:      document.getElementById('theme-toggle-btn'),
  themeToggleIcon:     document.getElementById('theme-toggle-icon'),

  // Toasts
  toastContainer:      document.getElementById('toast-container'),

  // Dashboard progress bar
  progressBar:         document.getElementById('progress-bar'),
  progressBarFill:     document.getElementById('progress-bar-fill'),
  progressPercent:     document.getElementById('progress-percent'),

  // Modal
  modalOverlay:        document.getElementById('modal-overlay'),
  modalTitle:          document.getElementById('modal-title'),
  modalSaveBtn:        document.getElementById('modal-save-btn'),
  modalCloseBtn:       document.getElementById('modal-close-btn'),
  modalCancelBtn:      document.getElementById('modal-cancel-btn'),
  taskForm:            document.getElementById('task-form'),
  taskTitleInput:      document.getElementById('task-title'),
  titleError:          document.getElementById('title-error'),

  // Productivity stats
  statDaily:           document.getElementById('stat-daily'),
  statWeekly:          document.getElementById('stat-weekly'),
  statMonthly:         document.getElementById('stat-monthly'),
  statStreak:          document.getElementById('stat-streak'),
  statLongestStreak:   document.getElementById('stat-longest-streak'),

  // Mini calendar
  calendarGrid:        document.getElementById('calendar-grid'),
  calendarMonthLabel:  document.getElementById('calendar-month-label'),
  calendarPrevBtn:     document.getElementById('calendar-prev-btn'),
  calendarNextBtn:     document.getElementById('calendar-next-btn'),

  // Calendar date filter chip (Tasks page)
  dateFilterChip:      document.getElementById('date-filter-chip'),
  dateFilterChipText:  document.getElementById('date-filter-chip-text'),

  // Export / Import / Backup (Settings)
  exportBtn:           document.getElementById('export-btn'),
  importBtn:           document.getElementById('import-btn'),
  importFileInput:     document.getElementById('import-file-input'),
  restoreBackupBtn:    document.getElementById('restore-backup-btn'),
  backupStatusText:    document.getElementById('backup-status-text'),

  // Smart dashboard widgets
  statOverdue:         document.getElementById('stat-overdue'),
  statScore:           document.getElementById('stat-score'),
  statWeeklyProgress:  document.getElementById('stat-weekly-progress'),
  statMonthlyProgress: document.getElementById('stat-monthly-progress'),

  // Smart reminders (nav badges)
  navBadgeToday:       document.getElementById('nav-badge-today'),

  // Achievements
  achievementsGrid:    document.getElementById('achievements-grid'),

  // Activity Timeline + Trash
  pageActivity:        document.getElementById('page-activity'),
  activityTimeline:    document.getElementById('activity-timeline'),
  activityEmptyState:  document.getElementById('activity-empty-state'),
  trashList:           document.getElementById('trash-list'),
  trashEmptyState:     document.getElementById('trash-empty-state'),

  // Settings: task defaults / notifications / animation
  settingDefaultPriority:    document.getElementById('setting-default-priority'),
  settingDefaultCategory:    document.getElementById('setting-default-category'),
  settingNotificationsToggle:document.getElementById('setting-notifications-toggle'),
  settingAnimationsToggle:   document.getElementById('setting-animations-toggle'),

  // Focus Mode
  focusModeBtn:        document.getElementById('focus-mode-btn'),
  focusOverlay:        document.getElementById('focus-overlay'),
  focusTaskTitle:      document.getElementById('focus-task-title'),
  focusTaskDesc:       document.getElementById('focus-task-desc'),
  focusTaskBadges:     document.getElementById('focus-task-badges'),
  focusTaskActions:    document.getElementById('focus-task-actions'),
  focusCompleteBtn:    document.getElementById('focus-complete-btn'),
  focusSkipBtn:        document.getElementById('focus-skip-btn'),
  focusExitBtn:        document.getElementById('focus-exit-btn'),

  // Quick Actions (FAB)
  fabContainer:        document.getElementById('fab-container'),
  fabMenu:             document.getElementById('fab-menu'),
  fabToggleBtn:        document.getElementById('fab-toggle-btn'),
  fabToggleIcon:       document.getElementById('fab-toggle-icon'),
  fabQuickAdd:         document.getElementById('fab-quick-add'),
  fabQuickSearch:      document.getElementById('fab-quick-search'),
  fabQuickToday:       document.getElementById('fab-quick-today'),
};

/* ============================================================
   STATE
   ============================================================ */
const tasks = [];

let currentPage   = 'dashboard';   // dashboard | all-tasks | today | important | completed | settings
let currentFilter = 'all';         // all | active | completed | high | today
let searchQuery   = '';
let sortOption    = 'newest';      // newest | oldest | priority | dueDate
let editingTaskId = null;          // null = add mode, number = edit mode

// Mini calendar state
let calendarMonth = new Date().getMonth();
let calendarYear  = new Date().getFullYear();
let calendarFilterDate = null;     // YYYY-MM-DD selected in the mini calendar, or null

const STORAGE_KEY = 'smart-todo-tasks-v1';
const BACKUP_KEY = 'smart-todo-tasks-backup-v1';
const THEME_KEY = 'smart-todo-theme-v1';
const ACTIVITY_LOG_KEY = 'smart-todo-activity-log-v1';
const TRASH_KEY = 'smart-todo-trash-v1';
const SETTINGS_KEY = 'smart-todo-settings-v1';
const ACHIEVEMENTS_KEY = 'smart-todo-achievements-v1';

/* ============================================================
   BACKEND API CONFIG
   ============================================================
   Tasks and user accounts now live in MongoDB behind this REST API
   instead of Local Storage. Local Storage is still used for
   per-device UI preferences (theme, settings, activity log, trash,
   achievements, backups) that were never part of the backend spec. */
const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'smart-todo-auth-token';
const AUTH_USER_KEY = 'smart-todo-auth-user';

let authToken = null;
let currentUser = null;

/** IDs of task cards currently expanded (not persisted, resets on reload). */
const expandedTaskIds = new Set();

/** Full history of task actions (Created/Edited/Completed/Deleted/Restored). */
const activityLog = [];

/** Soft-deleted tasks, restorable from the Activity Timeline's Trash section. */
const trash = [];

/** IDs of unlocked achievements, mapped to the timestamp they were unlocked. */
let unlockedAchievements = {};

/** User-configurable defaults + toggles (Settings page). */
let settings = {
  defaultPriority: 'Medium',
  defaultCategory: 'Work',
  notificationsEnabled: true,
  animationsEnabled: true,
};

/** Task currently selected via click (used by the Delete keyboard shortcut). */
let selectedTaskId = null;

/** Whether Focus Mode is currently active. */
let focusModeActive = false;

/** Priority weight for sorting (lower number = higher priority). */
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

/** Maps a task category to its badge color class. */
const CATEGORY_BADGE_CLASSES = {
  Study:    'cat-study',
  Work:     'cat-work',
  Personal: 'cat-personal',
  Shopping: 'cat-shopping',
  Fitness:  'cat-fitness',
};

/** Page titles shown in the tasks view header. */
const PAGE_TITLES = {
  'all-tasks':  'All Tasks',
  'today':      "Today's Tasks",
  'important':  'Important Tasks',
  'completed':  'Completed Tasks',
};

/** Month names for the mini calendar header. */
const CALENDAR_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Achievement definitions. `check(ctx)` receives { completedCount, longestStreak }
 * and returns true once the achievement should be unlocked.
 */
const ACHIEVEMENTS = [
  { id: 'first-task',  title: 'First Task',     icon: '🥇', desc: 'Complete your first task',        check: (ctx) => ctx.completedCount >= 1 },
  { id: 'ten-tasks',   title: '10 Tasks',        icon: '🔟', desc: 'Complete 10 tasks',                check: (ctx) => ctx.completedCount >= 10 },
  { id: 'fifty-tasks', title: '50 Tasks',        icon: '🏅', desc: 'Complete 50 tasks',                check: (ctx) => ctx.completedCount >= 50 },
  { id: 'hundred-tasks', title: '100 Tasks',     icon: '🏆', desc: 'Complete 100 tasks',               check: (ctx) => ctx.completedCount >= 100 },
  { id: 'streak-7',    title: '7 Day Streak',    icon: '🔥', desc: 'Complete tasks 7 days in a row',   check: (ctx) => ctx.longestStreak >= 7 },
  { id: 'streak-30',   title: '30 Day Streak',   icon: '💎', desc: 'Complete tasks 30 days in a row',  check: (ctx) => ctx.longestStreak >= 30 },
];

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

/** Escapes HTML to prevent XSS when rendering user input. */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Formats a Date object as a local YYYY-MM-DD key (no UTC conversion, avoids off-by-one-day bugs). */
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns today's date as YYYY-MM-DD. */
function getTodayString() {
  return formatDateKey(new Date());
}

/** Formats YYYY-MM-DD into a readable date string. */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Returns a time-based greeting string. */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning!';
  if (hour < 17) return 'Good afternoon!';
  return 'Good evening!';
}

/** Returns CSS badge class for a priority level. */
function getPriorityBadgeClass(priority) {
  const map = { High: 'high', Medium: 'medium', Low: 'low' };
  return `task-card__badge--${map[priority] || 'medium'}`;
}

/** Returns CSS badge class for a task category. */
function getCategoryBadgeClass(category) {
  return `task-card__badge--${CATEGORY_BADGE_CLASSES[category] || 'cat-work'}`;
}

/**
 * Returns { label, className } describing a task's due-date status,
 * or null when there's no due date or the task is already completed
 * (completed tasks just show the plain due date instead).
 */
function getDueDateStatus(dueDate, completed) {
  if (!dueDate || completed) return null;
  const today = getTodayString();
  if (dueDate < today) return { label: 'Overdue', className: 'overdue' };
  if (dueDate === today) return { label: 'Due Today', className: 'due-today' };
  return { label: 'Upcoming', className: 'upcoming' };
}

/* ============================================================
   REST API CLIENT
   ============================================================ */

/**
 * Low-level fetch wrapper: attaches the JWT (when present), serializes
 * JSON bodies, and throws a readable Error on any non-2xx response so
 * every caller can just try/catch a single await.
 */
async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new Error('Could not reach the server. Please check your connection.');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (parseError) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error((payload && payload.message) || `Request failed (${response.status})`);
  }

  return payload;
}

/** Converts a task document from the API into the shape the rest of the UI expects. */
function normalizeTask(serverTask) {
  return {
    id: serverTask._id || serverTask.id,
    title: serverTask.title,
    description: serverTask.description || '',
    category: serverTask.category,
    priority: serverTask.priority,
    dueDate: serverTask.dueDate || '',
    completed: Boolean(serverTask.completed),
    completedAt: serverTask.completedAt ? new Date(serverTask.completedAt).getTime() : null,
    pinned: Boolean(serverTask.pinned),
    createdAt: serverTask.createdAt ? new Date(serverTask.createdAt).getTime() : Date.now(),
  };
}

/* ============================================================
   AUTHENTICATION
   ============================================================ */

/** Persists the JWT + user profile so the session survives a page reload. */
function persistSession(token, user) {
  authToken = token;
  currentUser = user;
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to persist session:', error);
  }
}

/** Clears the session from memory and Local Storage. */
function clearSession() {
  authToken = null;
  currentUser = null;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/** Shows an inline error message on the auth screen. */
function showAuthError(message) {
  if (!DOM.authError) return;
  DOM.authError.textContent = message;
  DOM.authError.hidden = false;
}

function clearAuthError() {
  if (!DOM.authError) return;
  DOM.authError.hidden = true;
  DOM.authError.textContent = '';
}

/** Switches the auth screen between its Login and Register tabs/forms. */
function setAuthTab(tab) {
  clearAuthError();
  const isLogin = tab === 'login';
  DOM.authTabLogin.classList.toggle('auth-tab--active', isLogin);
  DOM.authTabLogin.setAttribute('aria-selected', String(isLogin));
  DOM.authTabRegister.classList.toggle('auth-tab--active', !isLogin);
  DOM.authTabRegister.setAttribute('aria-selected', String(!isLogin));
  DOM.loginForm.hidden = !isLogin;
  DOM.registerForm.hidden = isLogin;
}

/** Reveals the main application shell and hides the auth screen. */
function showApp() {
  DOM.authOverlay.hidden = true;
  DOM.appRoot.hidden = false;
  if (currentUser && currentUser.name) {
    const initials = currentUser.name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    if (initials) DOM.avatarInitials.textContent = initials;
  }
}

/** Hides the app and shows the Login/Register screen (e.g. on logout or an expired token). */
function showAuthScreen() {
  DOM.appRoot.hidden = true;
  DOM.authOverlay.hidden = false;
  setAuthTab('login');
}

/** Handles the Login form submit. */
async function handleLoginSubmit(e) {
  e.preventDefault();
  clearAuthError();

  const email = DOM.loginEmailInput.value.trim();
  const password = DOM.loginPasswordInput.value;
  if (!email || !password) return;

  DOM.loginSubmitBtn.disabled = true;
  try {
    const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    persistSession(data.token, data.user);
    await bootApp();
  } catch (error) {
    showAuthError(error.message);
  } finally {
    DOM.loginSubmitBtn.disabled = false;
  }
}

/** Handles the Register form submit. */
async function handleRegisterSubmit(e) {
  e.preventDefault();
  clearAuthError();

  const name = DOM.registerNameInput.value.trim();
  const email = DOM.registerEmailInput.value.trim();
  const password = DOM.registerPasswordInput.value;
  if (!name || !email || !password) return;

  DOM.registerSubmitBtn.disabled = true;
  try {
    const data = await apiRequest('/auth/register', { method: 'POST', body: { name, email, password } });
    persistSession(data.token, data.user);
    await bootApp();
  } catch (error) {
    showAuthError(error.message);
  } finally {
    DOM.registerSubmitBtn.disabled = false;
  }
}

/** Logs the current user out and returns to the auth screen. */
async function handleLogout() {
  const confirmed = confirm('Log out of Smart To-Do?');
  if (!confirmed) return;

  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (error) {
    // Logout is best-effort server-side (JWTs are stateless) — always clear locally.
    console.error('Logout request failed:', error);
  }

  clearSession();
  tasks.length = 0;
  showAuthScreen();
}

/* ============================================================
   STORAGE (tasks — backed by the REST API)
   ============================================================ */

/** Refreshes the Local Storage backup snapshot to mirror the current in-memory tasks. */
function saveTasks() {
  backupTasks();
}

/** Fetches the logged-in user's tasks from the API into the in-memory array. */
async function loadTasks() {
  const data = await apiRequest('/tasks');
  tasks.length = 0;
  tasks.push(...data.tasks.map(normalizeTask));
  saveTasks();
}

/* ============================================================
   ACTIVITY LOG / TRASH / SETTINGS / ACHIEVEMENTS STORAGE
   ============================================================ */

function saveActivityLog() {
  try {
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(activityLog));
  } catch (error) {
    console.error('Failed to save activity log:', error);
  }
}

function loadActivityLog() {
  try {
    const stored = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return;
    activityLog.length = 0;
    activityLog.push(...parsed);
  } catch (error) {
    console.error('Failed to load activity log:', error);
  }
}

function saveTrash() {
  try {
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  } catch (error) {
    console.error('Failed to save trash:', error);
  }
}

function loadTrash() {
  try {
    const stored = localStorage.getItem(TRASH_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return;
    trash.length = 0;
    trash.push(...parsed);
  } catch (error) {
    console.error('Failed to load trash:', error);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object') {
      settings = { ...settings, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

function saveAchievements() {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedAchievements));
  } catch (error) {
    console.error('Failed to save achievements:', error);
  }
}

function loadAchievements() {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object') {
      unlockedAchievements = parsed;
    }
  } catch (error) {
    console.error('Failed to load achievements:', error);
  }
}

/** Applies loaded settings values to the Settings page form controls. */
function applySettingsToUI() {
  if (DOM.settingDefaultPriority) DOM.settingDefaultPriority.value = settings.defaultPriority;
  if (DOM.settingDefaultCategory) DOM.settingDefaultCategory.value = settings.defaultCategory;
  if (DOM.settingNotificationsToggle) DOM.settingNotificationsToggle.checked = settings.notificationsEnabled;
  if (DOM.settingAnimationsToggle) DOM.settingAnimationsToggle.checked = settings.animationsEnabled;
  document.body.classList.toggle('no-animations', !settings.animationsEnabled);
}

/* ============================================================
   THEME
   ============================================================ */

/** Applies a theme to the document and updates the toggle icon. */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  DOM.themeToggleIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/** Loads the saved theme (falling back to system preference) and applies it. */
function loadTheme() {
  let theme = null;
  try {
    theme = localStorage.getItem(THEME_KEY);
  } catch (error) {
    console.error('Failed to read theme:', error);
  }
  if (!theme) {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  applyTheme(theme);
}

/** Toggles between light and dark themes and persists the choice. */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (error) {
    console.error('Failed to save theme:', error);
  }
}

/* ============================================================
   PRODUCTIVITY STATS
   ============================================================ */

/** Set of local date-keys (YYYY-MM-DD) on which at least one task was completed. */
function getCompletedDateSet() {
  const dates = new Set();
  tasks.forEach((t) => {
    if (t.completed && t.completedAt) {
      dates.add(formatDateKey(new Date(t.completedAt)));
    }
  });
  return dates;
}

function getDailyCompletedCount() {
  const todayStr = getTodayString();
  return tasks.filter(
    (t) => t.completed && t.completedAt && formatDateKey(new Date(t.completedAt)) === todayStr
  ).length;
}

function getWeeklyCompletedCount() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return tasks.filter((t) => t.completed && t.completedAt && t.completedAt >= cutoff).length;
}

function getMonthlyCompletedCount() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return tasks.filter((t) => t.completed && t.completedAt && t.completedAt >= monthStart).length;
}

/** Consecutive days up to today (or yesterday, if nothing's completed yet today) with a completion. */
function getCurrentStreak() {
  const days = getCompletedDateSet();
  const cursor = new Date();
  if (!days.has(formatDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(formatDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Longest run of consecutive completion days in the task history. */
function getLongestStreak() {
  const days = [...getCompletedDateSet()].sort();
  if (days.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    const diffDays = Math.round((new Date(days[i]) - new Date(days[i - 1])) / 86400000);
    current = diffDays === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

/** Updates the Daily / Weekly / Monthly / Streak stat cards on the dashboard. */
function updateProductivityStats() {
  DOM.statDaily.textContent         = getDailyCompletedCount();
  DOM.statWeekly.textContent        = getWeeklyCompletedCount();
  DOM.statMonthly.textContent       = getMonthlyCompletedCount();
  DOM.statStreak.textContent        = getCurrentStreak();
  DOM.statLongestStreak.textContent = getLongestStreak();

  updateSmartDashboardWidgets();
  renderAchievements();
}

/** Number of active tasks whose due date has already passed. */
function getOverdueCount() {
  const today = getTodayString();
  return tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length;
}

/** Percentage of all tasks that are completed. */
function getCompletionRate() {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
}

/** Rough "days active this week" indicator — 1 completion/day = 100%. */
function getWeeklyProgressPercent() {
  return Math.min(100, Math.round((getWeeklyCompletedCount() / 7) * 100));
}

/** Rough "days active this month" indicator — 1 completion/day = 100%. */
function getMonthlyProgressPercent() {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.min(100, Math.round((getMonthlyCompletedCount() / daysInMonth) * 100));
}

/**
 * Composite productivity score (0-100): rewards a high completion rate and
 * an active streak, and penalizes overdue tasks.
 */
function getProductivityScore() {
  const rate = getCompletionRate();
  const streakBonus = Math.min(getCurrentStreak(), 20) * 1.5;
  const overduePenalty = getOverdueCount() * 3;
  const score = Math.round(rate * 0.6 + streakBonus - overduePenalty);
  return Math.max(0, Math.min(100, score));
}

/** Updates the Smart Dashboard widgets: overdue, score, weekly/monthly progress. */
function updateSmartDashboardWidgets() {
  if (DOM.statOverdue) DOM.statOverdue.textContent = getOverdueCount();
  if (DOM.statScore) DOM.statScore.textContent = getProductivityScore();
  if (DOM.statWeeklyProgress) DOM.statWeeklyProgress.textContent = getWeeklyProgressPercent();
  if (DOM.statMonthlyProgress) DOM.statMonthlyProgress.textContent = getMonthlyProgressPercent();
}

/** Shows/hides the Today's Tasks notification badge (overdue + due today count). */
function updateReminderBadges() {
  if (!DOM.navBadgeToday) return;
  if (!settings.notificationsEnabled) {
    DOM.navBadgeToday.hidden = true;
    return;
  }
  const today = getTodayString();
  const count = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate <= today).length;
  DOM.navBadgeToday.hidden = count === 0;
  DOM.navBadgeToday.textContent = count > 99 ? '99+' : String(count);
}

/* ============================================================
   ACHIEVEMENTS
   ============================================================ */

/** Checks all achievement conditions and unlocks + toasts any newly earned ones. */
function checkAchievements() {
  const ctx = {
    completedCount: tasks.filter((t) => t.completed).length,
    longestStreak: getLongestStreak(),
  };

  let unlockedSomething = false;
  ACHIEVEMENTS.forEach((achievement) => {
    if (!unlockedAchievements[achievement.id] && achievement.check(ctx)) {
      unlockedAchievements[achievement.id] = Date.now();
      unlockedSomething = true;
      showToast(`Achievement unlocked: ${achievement.title} ${achievement.icon}`, 'success');
    }
  });

  if (unlockedSomething) saveAchievements();
}

/** Renders the achievement cards grid on the dashboard. */
function renderAchievements() {
  if (!DOM.achievementsGrid) return;

  DOM.achievementsGrid.innerHTML = ACHIEVEMENTS.map((achievement) => {
    const isUnlocked = Boolean(unlockedAchievements[achievement.id]);
    return `
      <div class="achievement-card ${isUnlocked ? 'achievement-card--unlocked' : ''}">
        <div class="achievement-card__icon" aria-hidden="true">${achievement.icon}</div>
        <p class="achievement-card__title">${escapeHtml(achievement.title)}</p>
        <p class="achievement-card__desc">${escapeHtml(achievement.desc)}</p>
      </div>
    `;
  }).join('');
}

/* ============================================================
   ACTIVITY LOG
   ============================================================ */

/** Records a task action to the Activity Timeline. */
function logActivity(action, taskName) {
  activityLog.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    taskName,
    timestamp: Date.now(),
  });

  // Cap history length so Local Storage stays efficient.
  if (activityLog.length > 500) activityLog.length = 500;

  saveActivityLog();
  if (currentPage === 'activity') renderActivityPage();
}

/** Formats a timestamp as "Mon DD, YYYY · h:mm AM/PM". */
function formatLogTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/** Renders the Activity Timeline + Trash sections. */
function renderActivityPage() {
  if (DOM.activityTimeline) {
    if (activityLog.length === 0) {
      DOM.activityTimeline.innerHTML = '';
      DOM.activityEmptyState.hidden = false;
    } else {
      DOM.activityEmptyState.hidden = true;
      DOM.activityTimeline.innerHTML = activityLog.map((entry) => `
        <li class="activity-entry activity-entry--${entry.action.toLowerCase()}">
          <div class="activity-entry__row">
            <span class="activity-entry__action">${escapeHtml(entry.action)}</span>
            <span class="activity-entry__task">${escapeHtml(entry.taskName)}</span>
            <span class="activity-entry__time">${formatLogTimestamp(entry.timestamp)}</span>
          </div>
        </li>
      `).join('');
    }
  }

  renderTrashList();
}

/** Renders the Trash list with per-task Restore buttons. */
function renderTrashList() {
  if (!DOM.trashList) return;

  DOM.trashList.innerHTML = '';

  if (trash.length === 0) {
    DOM.trashEmptyState.hidden = false;
    return;
  }
  DOM.trashEmptyState.hidden = true;

  trash.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-card';
    li.dataset.id = task.id;
    li.innerHTML = `
      <div class="task-card__row">
        <div class="task-card__body">
          <p class="task-card__title">${escapeHtml(task.title)}</p>
          <div class="task-card__badges">
            <span class="task-card__badge ${getCategoryBadgeClass(task.category)}">${escapeHtml(task.category)}</span>
            <span class="task-card__badge ${getPriorityBadgeClass(task.priority)}">${task.priority}</span>
          </div>
        </div>
        <div class="task-card__actions">
          <button class="btn btn--secondary btn--ripple task-card__restore-btn" type="button">Restore</button>
        </div>
      </div>
    `;
    li.querySelector('.task-card__restore-btn').addEventListener('click', () => restoreTaskFromTrash(task.id));
    DOM.trashList.appendChild(li);
  });
}

/** Restores a soft-deleted task from the Trash back into the active task list. */
async function restoreTaskFromTrash(taskId) {
  const index = trash.findIndex((t) => t.id === taskId);
  if (index === -1) return;

  const [trashedTask] = trash.splice(index, 1);

  try {
    // Deletion is permanent on the server, so restoring re-creates the task.
    const createRes = await apiRequest('/tasks', {
      method: 'POST',
      body: {
        title: trashedTask.title,
        description: trashedTask.description,
        category: trashedTask.category,
        priority: trashedTask.priority,
        dueDate: trashedTask.dueDate,
      },
    });
    let restored = normalizeTask(createRes.task);

    // Preserve the completed state (and any pin) it had before deletion.
    if (trashedTask.completed) {
      const completeRes = await apiRequest(`/tasks/${restored.id}/complete`, { method: 'PATCH' });
      restored = normalizeTask(completeRes.task);
    } else if (trashedTask.pinned) {
      const pinRes = await apiRequest(`/tasks/${restored.id}/pin`, { method: 'PATCH' });
      restored = normalizeTask(pinRes.task);
    }

    tasks.unshift(restored);
    saveTasks();
    saveTrash();
    logActivity('Restored', restored.title);
    renderAll();
    renderActivityPage();
    showToast('Task restored', 'success');
  } catch (error) {
    // Put it back in Trash so the user doesn't lose it on a failed request.
    trash.splice(index, 0, trashedTask);
    saveTrash();
    showToast(error.message || 'Failed to restore task', 'danger');
  }
}

/* ============================================================
   MINI CALENDAR
   ============================================================ */

/** Renders the mini calendar grid for the current calendarMonth/calendarYear. */
function renderCalendar() {
  const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth  = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const todayStr     = getTodayString();
  const dueDates     = new Set(tasks.filter((t) => t.dueDate && !t.completed).map((t) => t.dueDate));

  DOM.calendarMonthLabel.textContent = `${CALENDAR_MONTH_NAMES[calendarMonth]} ${calendarYear}`;

  let html = '';
  for (let i = 0; i < firstWeekday; i++) {
    html += '<div class="calendar__cell calendar__cell--empty"></div>';
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const classes = ['calendar__cell'];
    if (dateStr === todayStr) classes.push('calendar__cell--today');
    if (dueDates.has(dateStr)) classes.push('calendar__cell--has-tasks');
    if (dateStr === calendarFilterDate) classes.push('calendar__cell--selected');
    html += `<button type="button" class="${classes.join(' ')}" data-date="${dateStr}" aria-label="${dateStr}">${day}</button>`;
  }

  DOM.calendarGrid.innerHTML = html;

  DOM.calendarGrid.querySelectorAll('.calendar__cell[data-date]').forEach((cell) => {
    cell.addEventListener('click', () => handleCalendarDateClick(cell.dataset.date));
  });
}

/** Selecting a date filters the Tasks page down to that due date. */
function handleCalendarDateClick(dateStr) {
  calendarFilterDate = calendarFilterDate === dateStr ? null : dateStr;
  navigateTo('all-tasks');
  renderCalendar();
}

/** Clears the mini-calendar date filter. */
function clearCalendarFilter() {
  calendarFilterDate = null;
  renderCalendar();
  renderAll();
}

function changeCalendarMonth(delta) {
  calendarMonth += delta;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  renderCalendar();
}

/* ============================================================
   EXPORT / IMPORT / BACKUP
   ============================================================ */

/** Downloads the current tasks array as a JSON file. */
function exportTasks() {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `smart-todo-export-${getTodayString()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Tasks exported', 'success');
}

/** Replaces all of the user's tasks on the server with the given list, then reloads. */
async function replaceAllTasksOnServer(taskDataList) {
  await apiRequest('/tasks', { method: 'DELETE' });

  for (const item of taskDataList) {
    const createRes = await apiRequest('/tasks', {
      method: 'POST',
      body: {
        title: item.title,
        description: item.description || '',
        category: item.category || 'Work',
        priority: item.priority || 'Medium',
        dueDate: item.dueDate || '',
      },
    });
    if (item.completed) {
      await apiRequest(`/tasks/${createRes.task._id}/complete`, { method: 'PATCH' });
    } else if (item.pinned) {
      await apiRequest(`/tasks/${createRes.task._id}/pin`, { method: 'PATCH' });
    }
  }

  await loadTasks();
}

/** Reads a chosen JSON file and replaces the current task list (on the server too). */
function importTasksFromFile(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error('Invalid file format');

      const confirmed = confirm(`Import ${parsed.length} task(s)? This replaces your current tasks.`);
      if (!confirmed) return;

      await replaceAllTasksOnServer(parsed);
      renderAll();
      renderCalendar();
      showToast('Tasks imported', 'success');
    } catch (error) {
      console.error('Failed to import tasks:', error);
      showToast(error.message || 'Import failed — invalid file', 'danger');
    }
  };
  reader.readAsText(file);
}

/** Writes a timestamped backup copy of the tasks array to Local Storage. */
function backupTasks() {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ savedAt: Date.now(), tasks }));
    updateBackupStatusText();
  } catch (error) {
    console.error('Failed to save backup:', error);
  }
}

/** Restores tasks from the last automatic backup, syncing the result back to the server. */
async function restoreBackup() {
  try {
    const stored = localStorage.getItem(BACKUP_KEY);
    if (!stored) {
      showToast('No backup found', 'danger');
      return;
    }
    const { tasks: backedUp } = JSON.parse(stored);
    if (!Array.isArray(backedUp)) throw new Error('Invalid backup');

    const confirmed = confirm('Restore from the last backup? This replaces your current tasks.');
    if (!confirmed) return;

    await replaceAllTasksOnServer(backedUp);
    renderAll();
    renderCalendar();
    showToast('Backup restored', 'success');
  } catch (error) {
    console.error('Failed to restore backup:', error);
    showToast(error.message || 'Restore failed', 'danger');
  }
}

/** Updates the "last backup" status text in Settings. */
function updateBackupStatusText() {
  if (!DOM.backupStatusText) return;
  try {
    const stored = localStorage.getItem(BACKUP_KEY);
    if (!stored) {
      DOM.backupStatusText.textContent = 'No backup yet.';
      return;
    }
    const { savedAt } = JSON.parse(stored);
    const time = new Date(savedAt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
    DOM.backupStatusText.textContent = `Last backup: ${time}`;
  } catch (error) {
    DOM.backupStatusText.textContent = 'No backup yet.';
  }
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */

const TOAST_ICONS = { success: '✅', info: 'ℹ️', danger: '🗑️' };

/** Shows a temporary toast notification (success | info | danger). */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span aria-hidden="true">${TOAST_ICONS[type] || 'ℹ️'}</span><span>${escapeHtml(message)}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3000);
}

/* ============================================================
   FILTERING
   ============================================================ */

/** Applies sidebar page-level filter. */
function applyPageFilter(taskList) {
  switch (currentPage) {
    case 'today':
      return taskList.filter((t) => t.dueDate === getTodayString());
    case 'important':
      return taskList.filter((t) => t.priority === 'High' && !t.completed);
    case 'completed':
      return taskList.filter((t) => t.completed);
    case 'all-tasks':
    default:
      return taskList;
  }
}

/** Applies filter-tab filter on top of page filter. */
function applyTabFilter(taskList) {
  switch (currentFilter) {
    case 'active':
      return taskList.filter((t) => !t.completed);
    case 'completed':
      return taskList.filter((t) => t.completed);
    case 'high':
      return taskList.filter((t) => t.priority === 'High');
    case 'today':
      return taskList.filter((t) => t.dueDate === getTodayString());
    default:
      return taskList;
  }
}

/** Returns the fully filtered task list (page → tab → completed-visibility → calendar → search). */
function getFilteredTasks() {
  let result = applyPageFilter([...tasks]);
  result = applyTabFilter(result);

  // Completed tasks are permanent: once done, they only ever show up
  // in the Completed view (All/Active/Today/Important never show them).
  const viewingCompleted = currentPage === 'completed' || currentFilter === 'completed';
  if (!viewingCompleted) {
    result = result.filter((t) => !t.completed);
  }

  // Mini-calendar date filter (clicking a day narrows to that due date)
  if (calendarFilterDate) {
    result = result.filter((t) => t.dueDate === calendarFilterDate);
  }

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
    );
  }

  return result;
}

/* ============================================================
   SORTING
   ============================================================ */

/**
 * Sorts tasks by selected option.
 * - Completed tasks are always sorted by completedAt, newest first.
 * - Among active tasks, pinned tasks always float to the top.
 */
function sortTasks(taskList) {
  const sorted = [...taskList];

  sorted.sort((a, b) => {
    // Completed tasks: newest completedAt first, and always below active tasks.
    if (a.completed && b.completed) {
      return (b.completedAt || 0) - (a.completedAt || 0);
    }
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    // Pinned active tasks always come first.
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

    switch (sortOption) {
      case 'oldest':
        return a.createdAt - b.createdAt;
      case 'priority':
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      case 'dueDate': {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      case 'newest':
      default:
        return b.createdAt - a.createdAt;
    }
  });

  return sorted;
}

/* ============================================================
   SEARCHING
   ============================================================ */

/** Updates the search query and re-renders. */
function handleSearch(value) {
  searchQuery = value;
  renderAll();
}

/**
 * Shows/animates the "N tasks found" counter directly below the search bar.
 * Only relevant on pages that actually filter by search (the Tasks list views) —
 * hidden whenever the query is empty.
 */
function updateSearchResultsCounter(matchCount) {
  if (!DOM.searchResultsCounter) return;

  if (!searchQuery.trim()) {
    hideSearchResultsCounter();
    return;
  }

  DOM.searchResultsCounter.textContent =
    matchCount === 1 ? '1 task found' : `${matchCount} tasks found`;
  DOM.searchResultsCounter.classList.add('search-results-counter--visible');
}

/** Hides the search results counter (search cleared, or on a non-list page). */
function hideSearchResultsCounter() {
  if (!DOM.searchResultsCounter) return;
  DOM.searchResultsCounter.classList.remove('search-results-counter--visible');
}

/* ============================================================
   VALIDATION
   ============================================================ */

function showTitleError() {
  DOM.taskTitleInput.classList.add('form-input--error');
  DOM.titleError.hidden = false;
}

function clearTitleError() {
  DOM.taskTitleInput.classList.remove('form-input--error');
  DOM.titleError.hidden = true;
}

/** Reads and validates form data. Returns null if invalid. */
function getFormData() {
  const title = DOM.taskTitleInput.value.trim();

  if (!title) {
    showTitleError();
    DOM.taskTitleInput.focus();
    return null;
  }

  clearTitleError();

  return {
    title,
    description: document.getElementById('task-description').value.trim(),
    category:    document.getElementById('task-category').value,
    dueDate:     document.getElementById('task-due-date').value,
    priority:    document.querySelector('input[name="priority"]:checked').value,
  };
}

/* ============================================================
   MODAL
   ============================================================ */

function openModalForAdd() {
  editingTaskId = null;
  DOM.modalTitle.textContent = 'Add New Task';
  DOM.modalSaveBtn.textContent = 'Save Task';
  DOM.taskForm.reset();
  clearTitleError();

  const defaultPriorityRadio = document.querySelector(`input[name="priority"][value="${settings.defaultPriority}"]`);
  (defaultPriorityRadio || document.querySelector('input[name="priority"][value="Medium"]')).checked = true;
  document.getElementById('task-category').value = settings.defaultCategory;

  DOM.modalOverlay.hidden = false;
  DOM.modalOverlay.setAttribute('aria-hidden', 'false');
  DOM.taskTitleInput.focus();
}

function openModalForEdit(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.completed) return;

  editingTaskId = taskId;
  DOM.modalTitle.textContent = 'Edit Task';
  DOM.modalSaveBtn.textContent = 'Update Task';

  DOM.taskTitleInput.value = task.title;
  document.getElementById('task-description').value = task.description || '';
  document.getElementById('task-category').value = task.category;
  document.getElementById('task-due-date').value = task.dueDate || '';

  const radio = document.querySelector(`input[name="priority"][value="${task.priority}"]`);
  if (radio) radio.checked = true;

  clearTitleError();
  DOM.modalOverlay.hidden = false;
  DOM.modalOverlay.setAttribute('aria-hidden', 'false');
  DOM.taskTitleInput.focus();
}

function closeModal() {
  DOM.modalOverlay.hidden = true;
  DOM.modalOverlay.setAttribute('aria-hidden', 'true');
  editingTaskId = null;
  DOM.taskForm.reset();
  clearTitleError();
}

/* ============================================================
   CRUD
   ============================================================ */

async function createTask(data) {
  try {
    const res = await apiRequest('/tasks', {
      method: 'POST',
      body: {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        dueDate: data.dueDate,
      },
    });
    const task = normalizeTask(res.task);
    tasks.unshift(task);
    saveTasks();
    logActivity('Created', task.title);
    renderAll();
    showToast('Task added', 'success');
  } catch (error) {
    showToast(error.message || 'Failed to add task', 'danger');
  }
}

async function updateTask(taskId, data) {
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index === -1 || tasks[index].completed) return;

  try {
    const res = await apiRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        dueDate: data.dueDate,
      },
    });
    tasks[index] = normalizeTask(res.task);
    saveTasks();
    logActivity('Edited', tasks[index].title);
    renderAll();
    showToast('Task updated', 'info');
  } catch (error) {
    showToast(error.message || 'Failed to update task', 'danger');
  }
}

async function deleteTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  const confirmed = confirm(
    `Delete "${task.title}"?\n\nThis action cannot be undone.`
  );
  if (!confirmed) return;

  try {
    await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });

    const index = tasks.findIndex((t) => t.id === taskId);
    const [removed] = tasks.splice(index, 1);
    expandedTaskIds.delete(taskId);
    if (selectedTaskId === taskId) selectedTaskId = null;

    // Soft-delete on the client: keep a snapshot in Trash so it can be
    // "restored" later (restoring re-creates the task via the API).
    trash.unshift({ ...removed, deletedAt: Date.now() });
    if (trash.length > 100) trash.length = 100;

    saveTasks();
    saveTrash();
    logActivity('Deleted', task.title);
    renderAll();
    renderActivityPage();
    showToast('Task deleted', 'danger');
  } catch (error) {
    showToast(error.message || 'Failed to delete task', 'danger');
  }
}

/** Calls the complete-task API and syncs the result into local state. No confirmation dialog. */
async function performCompleteTask(taskId, task) {
  try {
    const res = await apiRequest(`/tasks/${taskId}/complete`, { method: 'PATCH' });
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) tasks[index] = normalizeTask(res.task);
    saveTasks();
    logActivity('Completed', task.title);
    renderAll();
    showToast('Task completed 🎉', 'success');
  } catch (error) {
    showToast(error.message || 'Failed to complete task', 'danger');
  }
}

/**
 * Marks a task as permanently completed. Completed tasks cannot be
 * un-completed — this is a one-way transition, unlike the old toggle.
 */
async function completeTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.completed) return;

  const confirmed = confirm(
    `Mark "${task.title}" as completed?\n\nCompleted tasks are permanent and cannot be undone.`
  );
  if (!confirmed) return;

  await performCompleteTask(taskId, task);
}

/** Pins or unpins an active task. Completed tasks cannot be pinned. */
async function togglePin(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.completed) return;

  try {
    const res = await apiRequest(`/tasks/${taskId}/pin`, { method: 'PATCH' });
    const index = tasks.findIndex((t) => t.id === taskId);
    const updated = normalizeTask(res.task);
    if (index !== -1) tasks[index] = updated;
    saveTasks();
    renderAll();
    showToast(updated.pinned ? 'Task pinned' : 'Task unpinned', 'info');
  } catch (error) {
    showToast(error.message || 'Failed to update task', 'danger');
  }
}

async function clearAllTasks() {
  if (tasks.length === 0) {
    alert('There are no tasks to clear.');
    return;
  }

  const confirmed = confirm(
    'Clear ALL tasks permanently?\n\nThis cannot be undone.'
  );
  if (!confirmed) return;

  try {
    await apiRequest('/tasks', { method: 'DELETE' });
    tasks.length = 0;
    saveTasks();
    renderAll();
    showToast('All tasks cleared', 'danger');
  } catch (error) {
    showToast(error.message || 'Failed to clear tasks', 'danger');
  }
}

/* ============================================================
   RENDERING
   ============================================================ */

/** Builds a single task card DOM element. */
function createTaskElement(task) {
  const li = document.createElement('li');
  const isExpanded = expandedTaskIds.has(task.id);
  const classes = ['task-card'];
  if (task.completed) classes.push('task-card--completed');
  if (task.pinned) classes.push('task-card--pinned');
  if (isExpanded) classes.push('task-card--expanded');
  if (selectedTaskId === task.id) classes.push('task-card--selected');
  li.className = classes.join(' ');
  li.dataset.id = task.id;

  const dueStatus = getDueDateStatus(task.dueDate, task.completed);
  const dueBadge = !task.dueDate
    ? ''
    : dueStatus
      ? `<span class="task-card__badge task-card__badge--${dueStatus.className}">📅 ${dueStatus.label}</span>`
      : `<span class="task-card__badge task-card__badge--due">📅 ${formatDate(task.dueDate)}</span>`;

  // Completed tasks are permanent: no checkbox, just a badge.
  const checkboxOrBadge = task.completed
    ? `<span class="task-card__completed-badge" aria-hidden="true">✓ Completed</span>`
    : `
      <label class="task-card__checkbox-wrap">
        <input type="checkbox" class="task-card__checkbox" aria-label="Mark task as complete" />
        <span class="task-card__checkmark" aria-hidden="true"></span>
      </label>
    `;

  // Pin/unpin and Edit are only available on active (non-completed) tasks.
  const pinBtn = task.completed
    ? ''
    : `<button class="task-card__action-btn task-card__action-btn--pin" type="button" aria-label="${task.pinned ? 'Unpin task' : 'Pin task'}">${task.pinned ? '📌' : '📍'}</button>`;
  const editBtn = task.completed
    ? ''
    : `<button class="task-card__action-btn task-card__action-btn--edit" type="button" aria-label="Edit task">✏️</button>`;

  li.innerHTML = `
    <div class="task-card__row">
      ${checkboxOrBadge}

      <div class="task-card__body">
        <p class="task-card__title">${task.pinned ? '📌 ' : ''}${escapeHtml(task.title)}</p>
        ${task.description ? `<p class="task-card__description">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-card__badges">
          <span class="task-card__badge ${getCategoryBadgeClass(task.category)}">${escapeHtml(task.category)}</span>
          <span class="task-card__badge ${getPriorityBadgeClass(task.priority)}">${task.priority}</span>
          ${dueBadge}
        </div>
      </div>

      <div class="task-card__actions">
        <button class="task-card__expand-btn" type="button" aria-label="${isExpanded ? 'Collapse details' : 'View details'}">▾</button>
        ${pinBtn}
        ${editBtn}
        <button class="task-card__action-btn task-card__action-btn--delete" type="button" aria-label="Delete task">🗑️</button>
      </div>
    </div>

    <div class="task-card__details">
      <div class="task-card__details-content">
        ${task.description ? `<p class="task-card__full-description">${escapeHtml(task.description)}</p>` : ''}
        <span class="task-card__detail">Category: ${escapeHtml(task.category)}</span>
        <span class="task-card__detail">Priority: ${task.priority}</span>
        ${task.dueDate
          ? `<span class="task-card__detail task-card__detail--due">Due: ${formatDate(task.dueDate)}</span>`
          : '<span class="task-card__detail">No due date</span>'}
        <span class="task-card__detail">Created: ${formatDate(formatDateKey(new Date(task.createdAt)))}</span>
        ${task.completed && task.completedAt
          ? `<span class="task-card__detail task-card__detail--completed">Completed: ${formatDate(formatDateKey(new Date(task.completedAt)))}</span>`
          : ''}
      </div>
    </div>
  `;

  // Checkbox only exists for active tasks — guard before attaching.
  const checkboxEl = li.querySelector('.task-card__checkbox');
  if (checkboxEl) {
    checkboxEl.addEventListener('change', () => completeTask(task.id));
  }

  const editBtnEl = li.querySelector('.task-card__action-btn--edit');
  if (editBtnEl) {
    editBtnEl.addEventListener('click', () => openModalForEdit(task.id));
  }

  const pinBtnEl = li.querySelector('.task-card__action-btn--pin');
  if (pinBtnEl) {
    pinBtnEl.addEventListener('click', () => togglePin(task.id));
  }

  li.querySelector('.task-card__action-btn--delete').addEventListener('click', () => {
    deleteTask(task.id);
  });

  li.querySelector('.task-card__expand-btn').addEventListener('click', () => {
    toggleTaskExpand(task.id, li);
  });

  // Click-to-select (for the Delete keyboard shortcut) — ignore clicks on buttons/inputs.
  li.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('label')) return;
    selectTask(task.id, li);
  });

  return li;
}

/** Toggles a task card's expanded/collapsed state without a full re-render. */
function toggleTaskExpand(taskId, cardEl) {
  const willExpand = !expandedTaskIds.has(taskId);
  if (willExpand) {
    expandedTaskIds.add(taskId);
  } else {
    expandedTaskIds.delete(taskId);
  }
  cardEl.classList.toggle('task-card--expanded', willExpand);
  cardEl.querySelector('.task-card__expand-btn')
    .setAttribute('aria-label', willExpand ? 'Collapse details' : 'Expand details');
}

/** Renders tasks into a given list container with empty-state handling. */
function renderTaskList(container, emptyStateEl, taskArray, emptyMessages) {
  container.innerHTML = '';

  if (taskArray.length === 0) {
    emptyStateEl.hidden = false;
    emptyStateEl.querySelector('.empty-state__title').textContent = emptyMessages.title;
    emptyStateEl.querySelector('.empty-state__text').textContent = emptyMessages.text;
    const iconEl = emptyStateEl.querySelector('.empty-state__icon');
    if (iconEl) iconEl.textContent = emptyMessages.icon || '📝';
    return;
  }

  emptyStateEl.hidden = true;
  taskArray.forEach((task) => {
    container.appendChild(createTaskElement(task));
  });
}

/** Returns contextual empty-state messages. */
function getEmptyMessages() {
  if (searchQuery.trim()) {
    return {
      icon: '🔍',
      title: 'No matching tasks found',
      text: 'Try another keyword or clear the search.',
    };
  }
  if (tasks.length === 0) {
    return { title: 'No tasks yet', text: 'Click "Add Task" to create your first task.' };
  }
  if (currentFilter === 'completed' || currentPage === 'completed') {
    return { title: 'No completed tasks', text: 'Complete a task to see it here.' };
  }
  if (currentFilter === 'active') {
    return { title: 'No active tasks', text: 'All tasks are completed. Great job!' };
  }
  if (currentFilter === 'high' || currentPage === 'important') {
    return { title: 'No high-priority tasks', text: 'Mark a task as High priority to see it here.' };
  }
  if (currentFilter === 'today' || currentPage === 'today') {
    return { title: "No tasks due today", text: 'Add a task with today\'s due date.' };
  }
  return { title: 'No tasks found', text: 'Try adjusting your filters.' };
}

/** Updates all statistics counters. */
function updateStatistics() {
  const total     = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending   = total - completed;
  const todayCount = tasks.filter((t) => t.dueDate === getTodayString()).length;

  DOM.statTotal.textContent     = total;
  DOM.statPending.textContent   = pending;
  DOM.statCompleted.textContent = completed;
  DOM.statToday.textContent     = todayCount;
  DOM.sidebarPendingCount.textContent = pending;

  DOM.taskCountMeta.textContent =
    pending === 1
      ? 'You have 1 task to complete'
      : `You have ${pending} tasks to complete`;

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  DOM.progressBarFill.style.width = `${percent}%`;
  DOM.progressPercent.textContent = `${percent}%`;
  DOM.progressBar.setAttribute('aria-valuenow', percent);

  checkAchievements();
  updateReminderBadges();
}

/** Renders the main tasks page list. */
function renderTasksPage() {
  const filtered = getFilteredTasks();
  const sorted   = sortTasks(filtered);
  renderTaskList(DOM.taskList, DOM.emptyState, sorted, getEmptyMessages());
  updateDateFilterChip();
  updateSearchResultsCounter(filtered.length);
}

/** Shows/hides the "filtered by date" chip on the Tasks toolbar. */
function updateDateFilterChip() {
  if (calendarFilterDate) {
    DOM.dateFilterChip.hidden = false;
    DOM.dateFilterChipText.textContent = formatDate(calendarFilterDate);
  } else {
    DOM.dateFilterChip.hidden = true;
  }
}

/** Renders the dashboard recent-tasks preview (5 newest, incomplete first). */
function renderDashboard() {
  const recent = sortTasks(
    tasks.filter((t) => !t.completed).slice(0, 5)
  );

  // If fewer than 5 incomplete, pad with completed
  if (recent.length < 5) {
    const completed = sortTasks(tasks.filter((t) => t.completed)).slice(0, 5 - recent.length);
    recent.push(...completed);
  }

  const messages = tasks.length === 0
    ? { title: 'No tasks yet', text: 'Create your first task to get started.' }
    : { title: 'No recent tasks', text: 'All caught up!' };

  renderTaskList(DOM.dashboardTaskList, DOM.dashboardEmptyState, recent.slice(0, 5), messages);

  DOM.dashboardRecentMeta.textContent =
    tasks.length === 0 ? 'Your latest tasks' : `Showing ${Math.min(5, tasks.length)} of ${tasks.length} tasks`;

  updateProductivityStats();
  renderCalendar();
}

/** Master render — updates stats + visible page content. */
function renderAll() {
  updateStatistics();

  if (currentPage === 'dashboard') {
    hideSearchResultsCounter();
    renderDashboard();
  } else if (currentPage === 'activity') {
    hideSearchResultsCounter();
    renderActivityPage();
  } else if (currentPage !== 'settings') {
    renderTasksPage();
  } else {
    hideSearchResultsCounter();
  }
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function navigateTo(page) {
  currentPage = page;

  // Update sidebar active state
  DOM.navLinks.forEach((link) => {
    link.classList.toggle('nav-link--active', link.dataset.page === page);
  });

  // Show correct page section
  DOM.pageDashboard.classList.toggle('page--active', page === 'dashboard');
  DOM.pageTasks.classList.toggle('page--active', page !== 'dashboard' && page !== 'settings' && page !== 'activity');
  DOM.pageActivity.classList.toggle('page--active', page === 'activity');
  DOM.pageSettings.classList.toggle('page--active', page === 'settings');

  // Update tasks page title for task views
  if (PAGE_TITLES[page]) {
    DOM.tasksPageTitle.textContent = PAGE_TITLES[page];
  }

  // Reset filter tab when switching sidebar pages
  if (page === 'completed') setFilterTab('completed');
  else if (page === 'today') setFilterTab('today');
  else if (page === 'important') setFilterTab('high');
  else setFilterTab('all');

  renderAll();
}

function setFilterTab(filter) {
  currentFilter = filter;

  DOM.filterTabs.forEach((tab) => {
    const isActive = tab.dataset.filter === filter;
    tab.classList.toggle('filter-tab--active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });
}

/* ============================================================
   FOCUS MODE
   ============================================================ */

/** Picks the next task to show in Focus Mode: today's active tasks first, then any pinned/overdue task. */
function getFocusTask() {
  const today = getTodayString();
  const active = tasks.filter((t) => !t.completed);

  const todayTasks = sortTasks(active.filter((t) => t.dueDate === today));
  if (todayTasks.length > 0) return todayTasks[0];

  const overdueTasks = sortTasks(active.filter((t) => t.dueDate && t.dueDate < today));
  if (overdueTasks.length > 0) return overdueTasks[0];

  const rest = sortTasks(active);
  return rest.length > 0 ? rest[0] : null;
}

/** Renders the current focus task (or an "all caught up" message) inside the overlay. */
function renderFocusMode() {
  const task = getFocusTask();

  if (!task) {
    DOM.focusTaskTitle.textContent = 'All caught up! 🎉';
    DOM.focusTaskDesc.textContent = 'You have no active tasks right now.';
    DOM.focusTaskBadges.innerHTML = '';
    DOM.focusTaskActions.hidden = true;
    return;
  }

  DOM.focusTaskActions.hidden = false;
  DOM.focusTaskTitle.textContent = task.title;
  DOM.focusTaskDesc.textContent = task.description || 'No description.';
  DOM.focusTaskBadges.innerHTML = `
    <span class="task-card__badge ${getCategoryBadgeClass(task.category)}">${escapeHtml(task.category)}</span>
    <span class="task-card__badge ${getPriorityBadgeClass(task.priority)}">${task.priority}</span>
    ${task.dueDate ? `<span class="task-card__badge task-card__badge--due">📅 ${formatDate(task.dueDate)}</span>` : ''}
  `;
  DOM.focusOverlay.dataset.taskId = task.id;
}

function enterFocusMode() {
  focusModeActive = true;
  DOM.focusOverlay.hidden = false;
  DOM.focusOverlay.setAttribute('aria-hidden', 'false');
  renderFocusMode();
}

function exitFocusMode() {
  focusModeActive = false;
  DOM.focusOverlay.hidden = true;
  DOM.focusOverlay.setAttribute('aria-hidden', 'true');
}

/** Completes the currently shown focus task, then advances to the next one. */
async function handleFocusComplete() {
  // Task ids are Mongo ObjectId strings, not numbers — do not coerce with Number().
  const taskId = DOM.focusOverlay.dataset.taskId;
  if (!taskId) return;
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  await performCompleteTask(taskId, task);
  renderFocusMode();
}

/* ============================================================
   QUICK ACTIONS (FLOATING ACTION BUTTON)
   ============================================================ */

function openFabMenu() {
  DOM.fabMenu.hidden = false;
  DOM.fabToggleBtn.classList.add('fab-btn--open');
  DOM.fabToggleBtn.setAttribute('aria-expanded', 'true');
  DOM.fabToggleIcon.textContent = '×';
}

function closeFabMenu() {
  DOM.fabMenu.hidden = true;
  DOM.fabToggleBtn.classList.remove('fab-btn--open');
  DOM.fabToggleBtn.setAttribute('aria-expanded', 'false');
  DOM.fabToggleIcon.textContent = '+';
}

function toggleFabMenu() {
  if (DOM.fabMenu.hidden) openFabMenu();
  else closeFabMenu();
}

/** Quick Search: jumps to a page with a visible list and focuses the search box. */
function quickFocusSearch() {
  closeFabMenu();
  DOM.searchInput.focus();
  DOM.searchInput.select();
}

/* ============================================================
   KEYBOARD SHORTCUTS + TASK SELECTION
   ============================================================ */

/** Marks a task card as selected (for the Delete-key shortcut), clearing any previous selection. */
function selectTask(taskId, cardEl) {
  document.querySelectorAll('.task-card--selected').forEach((el) => el.classList.remove('task-card--selected'));
  selectedTaskId = taskId;
  if (cardEl) cardEl.classList.add('task-card--selected');
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

function initEventListeners() {
  // Sidebar navigation
  DOM.navLinks.forEach((link) => {
    link.addEventListener('click', () => navigateTo(link.dataset.page));
  });

  // Add Task buttons (tasks page + dashboard)
  DOM.addTaskBtn.addEventListener('click', openModalForAdd);
  DOM.addTaskBtnDashboard.addEventListener('click', openModalForAdd);

  // Modal close actions
  DOM.modalCloseBtn.addEventListener('click', closeModal);
  DOM.modalCancelBtn.addEventListener('click', closeModal);

  DOM.modalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    const typingInField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

    // Esc — close modal, exit Focus Mode, or close the Quick Actions menu.
    if (e.key === 'Escape') {
      if (!DOM.modalOverlay.hidden) closeModal();
      else if (focusModeActive) exitFocusMode();
      else if (!DOM.fabMenu.hidden) closeFabMenu();
      return;
    }

    // Ctrl/Cmd + N — Open Add Task
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      if (DOM.modalOverlay.hidden) openModalForAdd();
      return;
    }

    // Ctrl/Cmd + F — Focus Search
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      DOM.searchInput.focus();
      DOM.searchInput.select();
      return;
    }

    // Delete — Delete the selected task (only when not typing in a field, and no modal is open).
    if (e.key === 'Delete' && !typingInField && DOM.modalOverlay.hidden && selectedTaskId !== null) {
      deleteTask(selectedTaskId);
    }
  });

  // Clear title error on input
  DOM.taskTitleInput.addEventListener('input', clearTitleError);

  // Form submit (Create + Edit)
  DOM.taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = getFormData();
    if (!data) return;

    if (editingTaskId !== null) {
      updateTask(editingTaskId, data);
    } else {
      createTask(data);
    }

    closeModal();
  });

  // Filter tabs
  DOM.filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setFilterTab(tab.dataset.filter);
      renderAll();
    });
  });

  // Sort dropdown
  DOM.sortSelect.addEventListener('change', (e) => {
    sortOption = e.target.value;
    renderAll();
  });

  // Live search
  DOM.searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });

  // Clear all tasks (Settings)
  DOM.clearAllBtn.addEventListener('click', clearAllTasks);

  // Dark mode toggle
  DOM.themeToggleBtn.addEventListener('click', toggleTheme);

  // Mini calendar navigation
  DOM.calendarPrevBtn.addEventListener('click', () => changeCalendarMonth(-1));
  DOM.calendarNextBtn.addEventListener('click', () => changeCalendarMonth(1));

  // Clear the calendar date filter chip
  DOM.dateFilterChip.addEventListener('click', clearCalendarFilter);

  // Export / Import / Backup (Settings)
  DOM.exportBtn.addEventListener('click', exportTasks);
  DOM.importBtn.addEventListener('click', () => DOM.importFileInput.click());
  DOM.importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importTasksFromFile(file);
    e.target.value = '';
  });
  DOM.restoreBackupBtn.addEventListener('click', restoreBackup);

  // Focus Mode
  DOM.focusModeBtn.addEventListener('click', enterFocusMode);
  DOM.focusExitBtn.addEventListener('click', exitFocusMode);
  DOM.focusCompleteBtn.addEventListener('click', handleFocusComplete);
  DOM.focusSkipBtn.addEventListener('click', renderFocusMode);
  DOM.focusOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.focusOverlay) exitFocusMode();
  });

  // Quick Actions (FAB)
  DOM.fabToggleBtn.addEventListener('click', toggleFabMenu);
  DOM.fabQuickAdd.addEventListener('click', () => {
    closeFabMenu();
    openModalForAdd();
  });
  DOM.fabQuickSearch.addEventListener('click', quickFocusSearch);
  DOM.fabQuickToday.addEventListener('click', () => {
    closeFabMenu();
    navigateTo('today');
  });
  document.addEventListener('click', (e) => {
    if (!DOM.fabMenu.hidden && !DOM.fabContainer.contains(e.target)) closeFabMenu();
  });

  // Settings: task defaults + notifications + animation toggle
  DOM.settingDefaultPriority.addEventListener('change', (e) => {
    settings.defaultPriority = e.target.value;
    saveSettings();
  });
  DOM.settingDefaultCategory.addEventListener('change', (e) => {
    settings.defaultCategory = e.target.value;
    saveSettings();
  });
  DOM.settingNotificationsToggle.addEventListener('change', (e) => {
    settings.notificationsEnabled = e.target.checked;
    saveSettings();
    updateReminderBadges();
  });
  DOM.settingAnimationsToggle.addEventListener('change', (e) => {
    settings.animationsEnabled = e.target.checked;
    saveSettings();
    document.body.classList.toggle('no-animations', !settings.animationsEnabled);
  });

  // Auth screen: Login / Register tabs, form submissions, and logout
  DOM.authTabLogin.addEventListener('click', () => setAuthTab('login'));
  DOM.authTabRegister.addEventListener('click', () => setAuthTab('register'));
  DOM.loginForm.addEventListener('submit', handleLoginSubmit);
  DOM.registerForm.addEventListener('submit', handleRegisterSubmit);
  DOM.avatarLogoutBtn.addEventListener('click', handleLogout);
}

/* ============================================================
   INITIALIZATION
   ============================================================ */

function initUI() {
  DOM.greeting.textContent = getGreeting();
  DOM.currentDate.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Runs once the user is authenticated (fresh login/register, or a
 * restored session): loads server-backed tasks plus the local-only
 * UI state, then reveals the app on the Dashboard.
 */
async function bootApp() {
  try {
    await loadTasks();
  } catch (error) {
    console.error('Failed to load tasks:', error);
    showToast(error.message || 'Failed to load your tasks', 'danger');
  }

  loadActivityLog();
  loadTrash();
  loadSettings();
  loadAchievements();
  applySettingsToUI();
  updateBackupStatusText();
  showApp();
  navigateTo('dashboard');
}

/** Restores a saved session (if any) by re-validating the token with the API. */
async function restoreSession() {
  let savedToken = null;
  let savedUser = null;
  try {
    savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    savedUser = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null');
  } catch (error) {
    savedToken = null;
  }

  if (!savedToken) {
    showAuthScreen();
    return;
  }

  authToken = savedToken;
  currentUser = savedUser;

  try {
    const data = await apiRequest('/auth/me');
    currentUser = data.user;
    await bootApp();
  } catch (error) {
    // Token is missing/expired/invalid — fall back to the auth screen.
    clearSession();
    showAuthScreen();
  }
}

function init() {
  loadTheme();
  initUI();
  initEventListeners();
  restoreSession();
}

init();