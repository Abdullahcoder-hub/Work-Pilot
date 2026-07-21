# Smart To-Do — Full Stack (Node.js + Express + MongoDB + Mongoose)

Smart To-Do has been converted from a Local-Storage-only app into a full
stack application. Tasks and user accounts are now stored in MongoDB and
served through a REST API; the frontend UI is unchanged and talks to that
API instead of `localStorage`.

## 1. Folder Structure

```
project/
├── index.html              # Frontend (UI unchanged)
├── style.css                # Frontend styles (+ new auth-screen styles)
├── script.js                 # Frontend logic (now calls the REST API)
│
└── backend/
    ├── server.js              # Express app entrypoint
    ├── package.json
    ├── .env.example
    ├── config/
    │   └── db.js               # MongoDB/Mongoose connection
    ├── models/
    │   ├── User.js              # name, email, password (hashed), timestamps
    │   └── Task.js               # userId, title, description, category,
    │                              # priority, dueDate, completed, completedAt,
    │                              # pinned, timestamps
    ├── controllers/
    │   ├── authController.js    # register / login / logout / getMe
    │   └── taskController.js    # CRUD, complete, pin, search/filter/sort, stats
    ├── routes/
    │   ├── authRoutes.js
    │   └── taskRoutes.js
    ├── middleware/
    │   ├── authMiddleware.js    # JWT verification ("protect")
    │   └── errorMiddleware.js   # 404 handler + central error handler
    └── utils/
        ├── generateToken.js
        └── asyncHandler.js
```

## 2. What changed on the frontend (and why)

- **Local Storage → REST API for tasks.** `loadTasks`, `createTask`,
  `updateTask`, `deleteTask`, `completeTask`, `togglePin`, and
  `clearAllTasks` now call the backend (`fetch` + `async`/`await`) instead
  of reading/writing `localStorage`. The UI, layout, and CSS classes are
  unchanged.
- **A login/register screen was added** (`#auth-overlay` in `index.html`),
  since the original app had no accounts at all and the backend requires
  a logged-in user for every task. It's styled with the same design
  tokens (CSS variables) as the rest of the app so it matches the existing
  look. The main app is hidden behind it until you log in.
- **The existing (previously non-functional) avatar button** now doubles
  as a Logout control — no markup/styling was added for this, it just
  got a click handler.
- **Bug fix:** Focus Mode's "Mark Complete" button read
  `Number(DOM.focusOverlay.dataset.taskId)`. That worked with the old
  numeric `Date.now()` ids, but breaks with MongoDB's string `_id`s
  (`Number("64f...")` → `NaN`). It now uses the id as a string and shares
  the same completion code path as the task list.
- **Trash / Backup / Export / Import** (features not in the original
  backend spec) still work, but since deleting a task on the server is
  now permanent, "restore" re-creates the task via the API (`POST
  /api/tasks`, then re-applying `completed`/`pinned` state) rather than
  just splicing it back into a local array.
- **Theme, Settings, Activity Log, and Achievements** intentionally stay
  in `localStorage` — they're per-device UI preferences/history, not part
  of the requested `User`/`Task` data model, so moving them server-side
  would have been out of scope and added risk without a corresponding
  backend requirement.

## 3. Required npm packages (backend)

Already listed in `backend/package.json`:

- `express` — web framework
- `mongoose` — MongoDB ODM
- `bcryptjs` — password hashing
- `jsonwebtoken` — JWT auth
- `cors` — cross-origin requests from the frontend
- `helmet` — security headers
- `dotenv` — environment variables
- `express-validator` — input validation
- `morgan` — dev request logging
- `nodemon` (dev dependency) — auto-restart during development

## 4. `.env` example

Copy `backend/.env.example` to `backend/.env` and fill in real values:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/smart-todo
JWT_SECRET=replace_this_with_a_long_random_secret_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://127.0.0.1:5500
```

`CLIENT_ORIGIN` should match whatever origin serves `index.html` (e.g. the
VS Code "Live Server" default `http://127.0.0.1:5500`), so CORS allows it.

## 5. Installation Steps

```bash
# 1. Install MongoDB locally, or use a MongoDB Atlas connection string.

# 2. Backend
cd backend
cp .env.example .env     # then edit .env with your own values
npm install

# 3. Frontend — no build step, no npm install needed (plain HTML/CSS/JS)
```

## 6. How to Run

**Backend:**
```bash
cd backend
npm run dev     # nodemon, auto-restarts on changes
# or
npm start       # plain node
```
The API runs at `http://localhost:5000` (or your configured `PORT`).
Health check: `GET http://localhost:5000/api/health`.

**Frontend:**
Open `index.html` directly in a browser, or serve the folder with any
static server (e.g. VS Code "Live Server", or `npx serve .`). If you serve
it from a different host/port than `http://localhost:5000`, update
`API_BASE_URL` near the top of `script.js` accordingly, and update
`CLIENT_ORIGIN` in `backend/.env` to match.

1. Start MongoDB.
2. Start the backend (`npm run dev` inside `backend/`).
3. Open `index.html` in the browser.
4. Register a new account (or log in) on the screen that appears.
5. Use the app exactly as before — tasks are now saved to MongoDB.

## 7. API Reference

**Auth** (`/api/auth`)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create an account, returns `{ token, user }` |
| POST | `/login` | Public | Authenticate, returns `{ token, user }` |
| POST | `/logout` | Private | Stateless acknowledgment (JWT is discarded client-side) |
| GET | `/me` | Private | Returns the logged-in user |

**Tasks** (`/api/tasks`, all require `Authorization: Bearer <token>`)
| Method | Route | Description |
|---|---|---|
| GET | `/` | List the user's tasks. Query params: `search`, `category`, `priority`, `completed`, `filter` (`today`\|`important`\|`completed`\|`active`\|`overdue`\|`pinned`), `sort` (`newest`\|`oldest`\|`priority`\|`dueDate`) |
| GET | `/stats` | Dashboard statistics: total, pending, completed, today, overdue, completionRate |
| POST | `/` | Create a task |
| PUT | `/:id` | Update a task (blocked once completed) |
| DELETE | `/:id` | Permanently delete a task |
| DELETE | `/` | Delete all of the user's tasks |
| PATCH | `/:id/complete` | Mark a task completed (one-way) |
| PATCH | `/:id/pin` | Toggle pinned state (blocked once completed) |

All error responses are `{ success: false, message: "..." }` via the
central error middleware.
