# WorkPilot V2 — Phases 1–6 (complete)

Multi-tenant SaaS work-management platform. Phase 1 built the foundation
(Auth, Tasks, Team, 4-role RBAC). Phase 2 added Projects with Kanban boards.
Along the way this project also picked up email verification, password
reset, an invite-accept flow, and per-task activity logs. Phase 3 added
Meetings, Chat (with 1:1 direct messages), a Calendar, and real Socket.IO
real-time. Phase 4 added Attendance tracking and Leave Management. Phase 5
added a self-built AI Assistant (no external AI API, ever) and a
Reports/Analytics dashboard. **Phase 6 adds a general-purpose Files
library, Settings (profile/password/company), billing-readiness (plan and
seat usage visible to company admins), and a security-hardening pass.**

Every module from the original roadmap is now built — nothing left showing
"coming in Phase X" in the nav.

## What Phase 6 adds

- **Files library** (`backend/src/modules/files/`, `frontend/src/features/files/`):
  the upload/download module built in Phase 5 for chat/assistant
  attachments is now a full page — browse every file the company has
  shared, search by name, upload, download, delete (uploader or a
  team lead/admin). Same storage underneath, so a file the AI Assistant
  sends to someone shows up here too.
- **Settings** (`backend/src/modules/company/` for the company side,
  extended `user` routes for the personal side, `frontend/src/features/settings/`):
  everyone gets a Profile tab (change name, change password — current
  password required, checked against the real hash before anything
  changes). Company admins get a Company tab: rename the company, and see
  plan + seat usage (`X / Y seats`) — **billing-readiness, not a live
  payment integration**: there's no fake "upgrade" button that pretends
  to charge a card without a real payment gateway wired in behind it; the
  data model (`plan`, `seatLimit`, `status` on `Company`) and the
  super-admin plan-change endpoint from Phase 1's Platform console are
  already there for when a real gateway gets added, and until then it
  says plainly to contact the platform administrator to change plans.
- **Security hardening**: file uploads now reject executable/script
  extensions outright (`.exe`, `.sh`, `.bat`, `.dll`, and similar) — this
  is a shared document store, not somewhere a malicious upload should be
  able to sit waiting for someone to run it. Upload endpoint gets its own
  rate limit, separate from the general API limits, since writing to disk
  is a heavier operation worth capping independently. Password changes
  require re-entering the current password (checked against the real
  hash) rather than trusting a logged-in session alone.
- **Accessibility**: added a "skip to main content" link — it was
  genuinely missing before; keyboard and screen-reader users had no way
  to bypass the sidebar on every single page load.

## What Phase 5 adds

- **AI Assistant, entirely self-built** (`backend/src/modules/assistant/`,
  `backend/src/modules/ai/`, `frontend/src/features/ai/`) — a rule-based
  command engine, not a wrapper around Gemini/Anthropic/any external AI
  API. It's two layers:
  - `intentEngine.ts` — a deterministic pattern classifier (English +
    Roman Urdu phrasing side by side, not translated) that decides what
    the message is asking for: create/complete/delete a task, schedule a
    meeting, message a teammate, send a file, clock in/out, or a few
    read-only questions (my tasks, what's overdue, leave balance).
  - `entityExtraction.ts` — deterministic parsing for the details: dates
    ("today"/"kal"/"tomorrow"/weekday names/`YYYY-MM-DD`), times ("3pm",
    "5 baje", "shaam 5 baje"), priority keywords, which teammate was
    named (matched against the real roster — never guesses when a name
    is ambiguous or missing), and the task title / message text left
    over once the trigger phrase is stripped out.
  - `assistant.service.ts` dispatches the result straight into the same
    `task`/`meeting`/`chat`/`attendance` services every other part of the
    app uses — same validation, RBAC, notifications, activity logs. A
    service-layer rule being hit (already clocked in today, not the task
    owner, ambiguous task name matching two tasks) becomes a plain-English
    reply asking for clarification, not a failed request.
  - Can also send a real file: attach one via the paperclip button, then
    say who it's for — this uses the new minimal file-upload module below
    and lands as a real attachment in that person's DM thread on the Chat
    page.
  - Because there's no LLM call, there's no API key to configure and
    nothing to go wrong with a provider outage or a wrong model string —
    it's exactly as reliable as the rest of the backend. The tradeoff is
    honest: it's pattern-matching, not open-ended language understanding,
    so it works best with fairly direct phrasing close to the examples on
    the Assistant page, and it says so plainly when it can't parse
    something rather than guessing.
- **File attachments in Chat** (`backend/src/modules/files/`) — a small,
  real upload/download module (local disk storage via `multer`, company-
  scoped access control) built to make "send a file" an actual feature
  rather than a stub. `ChatMessage` now supports an optional attachment;
  the Chat page renders it as a downloadable chip in the thread.
- **Reports** (`backend/src/modules/reports/`, `frontend/src/features/reports/`):
  a manager-only (`company_admin`/`team_lead`) dashboard — task
  completion trend (14 days), breakdown by priority/category, per-project
  progress, team workload, and this month's attendance/leave stats. Adds
  `recharts` to the frontend for the charts.
- Two small pre-existing bugs fixed while building this: `.env.example`
  documented `RESEND_API_KEY`, but the actual email code reads
  `BREVO_API_KEY` — anyone following the example file literally would set
  a variable that does nothing and silently fall back to console-logged
  emails. Fixed the example to match reality. Also fixed a real file-
  upload bug: the frontend was manually setting the `multipart/form-data`
  header without its required boundary parameter, which silently breaks
  upload parsing — removed it so axios sets it correctly itself.

## What Phase 4 adds

- **Attendance** (`backend/src/modules/attendance/`, `frontend/src/features/attendance/`):
  clock in/out, automatic late/half-day detection (configurable thresholds
  in `attendance.model.ts`/`attendance.service.ts`), a monthly summary
  (present/late/half-day/absent/total hours), and manual entry for
  managers to log or correct someone's attendance. Attendance is treated
  as private HR data — employees only ever see their own history; company
  admins and team leads see everyone's.
- **Leave Management** (`backend/src/modules/leave/`, `frontend/src/features/leave/`):
  request time off with automatic overlap detection against existing
  pending/approved requests, a live balance (annual/sick/casual are
  capped and tracked against approved days used this year; unpaid/other
  are uncapped), and an approval workflow for company admins/team leads
  with an optional note. Approving or rejecting a request notifies the
  requester — including live over the socket if they're online.
- **Calendar integration**: approved leave now shows up on the Calendar
  alongside tasks and meetings, spanning every day of the leave range.
- Two small fixes made along the way while debugging the reported chat
  issue: React Query's cache is now cleared on logout (previously a
  second account signing in on the same tab could briefly see stale data
  from the first), and the chat message sender-id comparison was hardened
  with explicit `String()` coercion.

## What Phase 3 adds

- **Socket.IO** (`backend/src/realtime/`): JWT-authenticated handshake,
  room-based fan-out scoped by company (`user:<id>`, `project:<companyId>:<id>`,
  `channel:<companyId>:<id>`) — fixed after Phase 3 shipped to close a bug
  where the fixed `general` channel name collided across every company on
  the platform. The frontend connects on login/session-bootstrap and
  disconnects on logout (`frontend/src/lib/socket.ts`, wired into
  `AuthContext`).
- **Meetings** (`backend/src/modules/meeting/`, `frontend/src/features/meetings/`):
  schedule with attendees and an optional project link; organizer or a
  manager can edit/cancel; attendees get a notification (and a live push)
  on invite, reschedule, and cancellation.
- **Chat** (`backend/src/modules/chat/`, `frontend/src/features/chat/`):
  a company-wide `general` channel plus one channel per project, gated by
  the same membership rule as that project's Kanban board. Messages
  broadcast live over the socket; the frontend appends them optimistically
  and reconciles with the server echo.
- **Calendar** (`backend/src/modules/calendar/`, `frontend/src/features/calendar/`):
  no new data model — aggregates task due dates and meeting times into one
  month grid, visible to whoever could already see that task or meeting.
- **Kanban board now live**: dragging a card, or any create/update/delete
  on a project's tasks, broadcasts `board:changed` to everyone viewing that
  project, so multi-user boards stay in sync without a manual refresh.
- **Notifications extended, not replaced**: your existing task-notification
  system gained `meeting_invite` / `meeting_updated` / `meeting_cancelled`
  types and now also pushes over the socket the instant it's created — the
  existing 30s poll stays on as a fallback for anyone not currently
  connected.

## Project layout

```
backend/
  src/
    config/        env validation, DB connection
    middleware/    auth, RBAC, error handling, validation
    realtime/      Socket.IO server + singleton accessor
    modules/       auth, user, company, task, project, department,
                    notification, activity, meeting, chat, calendar,
                    attendance, leave, assistant (rule-based command
                    engine), ai (conversation persistence), files,
                    reports, platform
  uploads/          chat/assistant file attachments (gitignored contents)
  _legacy_js/       original JS backend, kept for reference

frontend/
  src/
    features/      auth, tasks, projects, departments, team, dashboard,
                    notifications, activity, meetings, chat, calendar,
                    attendance, leave, ai, reports, files, settings,
                    platform
    components/    layout (Sidebar/Topbar/AppShell) and ui primitives
    routes/        ProtectedRoute, RoleRoute
    lib/           axios client, socket.io client, react-query client

_legacy_frontend/  original vanilla JS frontend, kept for reference
```

## Running it locally

### Backend

```bash
cd backend
cp .env.example .env
# edit .env: paste your MONGO_URI, set a real JWT_SECRET, fill in any
# email/Brevo settings you're using for verification/reset/invite emails
npm install
npm run dev              # http://localhost:5000
```

`npm install` is required even if `node_modules` already exists — this
phase added `socket.io` as a new backend dependency.

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev               # http://localhost:5173
```

Same note: `npm install` again for the new `socket.io-client` dependency.
`VITE_SOCKET_URL` is optional — it defaults to your API URL with `/api`
stripped, so you only need it if the socket server runs somewhere else.

## Where this stands

All 6 phases of the original roadmap are built and wired in. If you want
to keep going from here, the natural next steps are things a real SaaS
launch needs that weren't in the original scope: a real payment gateway
behind the billing-readiness groundwork in Settings, automated tests
beyond the auth ones already in `backend/src/modules/auth/*.test.ts`, and
a CI pipeline. None of that is started — worth flagging honestly rather
than claiming otherwise.
