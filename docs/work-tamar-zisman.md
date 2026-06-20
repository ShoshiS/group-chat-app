# קובץ עבודה — תמר זיסמן

**פרויקט:** אפליקציית צ'אט Fullstack (Node.js + Angular + MongoDB)  
**שותפה:** שושי ספראי  
**תפקיד:** Primary ב-Auth, Invitations, Admin/Profile | Secondary ב-Groups, Messages  
**תכנון ראשי:** [work-plan.md](work-plan.md)

---

## סמן מיקום

| | |
|---|---|
| **שלב נוכחי** | שבוע 3 — Slice 3: Invitations (Primary) — **מימוש הושלם · PR ל-Review** |
| **Slice פעיל** | Slice 3 — Invitations |
| **Branch פעיל** | `feature/invitations` → PR |
| **משימה עכשיו** | PR Review על ידי שושי · Thunder Client לזרימת הזמנות |
| **התקדמות Slice 3** | ✅ **100% (תמר)** — server + client + tests |
| **עודכן לאחרונה** | 2026-06-21 |
| **עודכן על ידי** | תמר |

> עדכני שדה זה בכל מעבר שלב — בסוף כל שבוע עבודה לפחות.

### איך לעדכן

1. בסיום משימה / מעבר Slice — עדכני את הטבלה + תאריך
2. הזיזי את `▶ **[שלב נוכחי]**` לכותרת השלב החדשה
3. עדכני גם את מסמך שושי + התכנון הראשי (סנכרון צוות)

---

## עקרון העבודה שלך

את **בעלים ראשית (~70%)** על Auth, Invitations ו-Admin.  
בכל slice אחר את **חייבת** לגעת בכל שכבה (DB, API, Middleware, Service, UI) — לפחות כ-Secondary (~30%).

**Branches שלך:**
- `feature/auth`
- `feature/invitations`
- `feature/polish` (משותף)

### Conventions (מוסכם עם שושי)

| נושא | החלטה |
|---|---|
| **שפה** | TypeScript (לא JavaScript) |
| **שמות קבצים** | `kebab-case` — למשל `user-model.ts`, `auth-middleware.ts` |
| **Validation** | Joi במודל + `validateBody()` — **לא** express-validator / תיקיית `validators/` |
| **Env vars** | `MONGO_URI` (לא `MONGODB_URI`); JWT ב-`config/env.ts` |
| **JWT expiry** | `7d` (שבוע) — כמו ב-`.env.example` |
| **DB** | MongoDB Atlas |

### מה הושלם עד כה (2026-06-18)

**שרת — Auth (Primary):**
- `user-model.ts` — סכמה, bcrypt hash, toJSON, findByEmail, comparePassword, Joi schemas
- `auth-middleware.ts` — verify JWT (`Bearer`), signToken, `req.userId`
- `auth-controller.ts` — register, login, getMe, updateProfile
- `auth-routes.ts` — `/api/auth/*` + validateBody
- `config/env.ts` — `mongoUri`, `jwtSecret`, `jwtExpiresIn`
- החלפת `stubAuthMiddleware` → `authMiddleware` ב-`group-routes` + `message-routes`

**Unit tests (29 חדשים, 74 סה"כ ב-server):**
- `tests/user-model.test.ts` — Joi schemas
- `tests/auth-middleware.test.ts` — signToken + authMiddleware
- `tests/auth-controller.test.ts` — register, login, getMe, updateProfile
- `tests/database.test.ts` — עודכן ל-`env.mongoUri`

**אימות ידני (2026-06-18):**
- `npm test` (server) — 74/74 passed
- `npm run test:ci` (client) — 15/15 passed
- `GET /api/health` — ok, db connected
- `POST /api/auth/register` + `login` + `GET /api/auth/me` — עובדים
- שרת על `:3001`, לקוח על `:4200`

**החלטות שאושרו (שאלות בחירה):**
- username + email: required + unique · role: `user` · avatar: URL אופציונלי · bcrypt: 10 rounds
- JWT: Bearer header · payload `{ userId }` · register מחזיר `{ token, user }`
- login fail: `"Invalid email or password"` · updateProfile: username בלבד
- error log: `console.error` בלבד (ללא winston)

**Client — Auth (2026-06-18):**
- `core/services/auth.ts` — Signals, register/login/logout, localStorage token, session restore
- `core/interceptors/auth-interceptor.ts` — Bearer token
- `core/guards/auth-guard.ts` + `guest-guard.ts`
- `features/auth/login.ts` + `register.ts` — Reactive Forms
- `features/home/home.ts` — מסך ראשי; **Agent רק בכפתור "AI Assistant (temp)"**

**Git / PR (2026-06-18):**
- Branch: `feature/auth` — 3 commits
- PR: [#6 — feat: Slice 1 Auth](https://github.com/ShoshiS/group-chat-app/pull/6) — **✅ merged** (`df622a2`)
- Commits: `feat(server)` · `feat(client)` + server tests · `docs`
- `main` מקומי: `git checkout main && git pull origin main`

**Slice 2 — Groups (Secondary, 2026-06-18):**
- Review שרת: `group-model`, `group-middleware`, `group-controller`, `group-routes` — אושר (הערות ל-PR שושי: `groups.ts` ללא auth, `leaveGroup` types)
- **NavBar** — `shared/nav-bar/` · Material toolbar · links לפי auth · Agent ב-nav · routes `/groups`, `/invitations`, `/profile`
- Placeholders: `invitations`, `profile` · Home → `/groups` · redirect `/` → `/groups`
- Angular Material + `@angular/animations` · tests: 17/17 client
- **⏳ K5 Thunder Client + M Review client** — יושלמו end-to-end אחרי merge PR שושי (`feature/groups`)

**Git / PR Slice 2 (2026-06-18):**
- Branch: `feature/nav-bar`
- PR: [#7 — feat: Slice 2 NavBar + protected routes](https://github.com/ShoshiS/group-chat-app/pull/7)

---

## שלב 0 — הקמה משותפת (ימים 1–2, עם שושי) ✅

- [x] יצירת Monorepo + GitHub repo
- [x] `server/`: Express scaffold, `.env`, חיבור MongoDB
- [x] `client/`: `ng new` עם routing, Material, standalone
- [x] `.env.example` ב-server וב-client
- [x] תיקיית `docs/` עם templates
- [x] הסכמה על naming conventions ו-branch strategy

---

## Slice 1 — Auth (שבוע 1) — **Primary** ✅

> **סטטוס:** שבוע 1 הושלם (18.6.2026). כל הקוד, הטסטים וה-PR מוכנים.

### `.env` — משתנים נדרשים (server)

העתיקי `server/.env.example` → `server/.env` ומלאי ערכים משלך (לא משתפים `.env` ב-git).

| משתנה | חובה ל-Auth | הערות |
|---|---|---|
| `PORT` | כן | **3001** — תואם ל-`client/.env.example` (`API_URL`) |
| `NODE_ENV` | כן | `development` |
| `MONGO_URI` | כן | MongoDB Atlas — URI **שלך** (לא של שושי) |
| `JWT_SECRET` | כן | מחרוזת סודית חזקה |
| `JWT_EXPIRES_IN` | כן | `7d` |
| `MAX_FILE_SIZE_MB` | לא (Slice 4+) | `10` |
| `CLOUDINARY_*` | לא (Slice 4+) | להעלאות קבצים |
| `CLIENT_ORIGIN` | כן | `http://localhost:4200` |
| `GEMINI_API_KEY` | לא (Agent) | רק אם משתמשים ב-AI agent |
| `GEMINI_MODEL` | לא (Agent) | ברירת מחדל: `gemini-2.5-flash` |

---

## Slice 1 — Auth — פירוט משימות ✅

> **איך עובדים על השלב הזה:** כל חלק קטן למטה הוא יחידה אחת לדיון.
> לפני כתיבת קוד — נעצור על כל חלק, נחליט *איך* בונים אותו (מבנה, ספריות, גישה),
> ורק אז נכתוב. סמני ✅ על חלק רק כשהוא נכתב + נבדק.

### קבוצה A — תשתית שרת ל-Auth (לפני הכל) ✅

- [x] **A1. מבנה תיקיות `server/src`** — קיים: `models/`, `middleware/`, `controllers/`, `routes/`, `config/` (ללא `validators/` — Joi במודלים)
- [x] **A2. חיבור MongoDB** — `config/database.ts` + `MONGO_URI` מ-`.env` (Atlas)
- [x] **A3. משתני סביבה ל-Auth** — `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `MONGO_URI` ב-`.env.example` + `config/env.ts`

### קבוצה B — מודל User (DB) ✅

- [x] **B1. סכמה בסיסית** — `models/user-model.ts`: username + email (required, unique), role default `user`, avatar אופציונלי (URL)
- [x] **B2. `pre('save')` hash סיסמה** — bcrypt, 10 salt rounds, רק כש-password השתנה
- [x] **B3. `toJSON()`** — הסרת `password`, `_id` → `id`, הסרת `__v`
- [x] **B4. `static findByEmail()`** — כולל `+password` ל-login
- [x] **B5. `comparePassword()`** — instance method על המסמך

### קבוצה C — Middleware (אחריותך הבלעדית) ✅

- [x] **C1. `auth-middleware.ts` — verify JWT** — `Authorization: Bearer`, 401 `{ error: "Unauthorized" }`, `req.userId`
- [x] **C2. `signToken()`** — ב-`auth-middleware.ts`, payload `{ userId }`, `JWT_EXPIRES_IN=7d`
- [x] **C3. error logging** — `console.error` ב-`error-middleware.ts` הקיים (ללא winston / קובץ — לפי החלטה)

### קבוצה D — Controller + Routes + Validation (API) ✅

- [x] **D1. register** — 201 + `{ token, user }` (auto-login)
- [x] **D2. login** — 401 + `"Invalid email or password"` (גנרי)
- [x] **D3. getMe** — `GET /api/auth/me`
- [x] **D4. updateProfile** — `username` בלבד (avatar ב-Slice 5)
- [x] **D5. auth-routes.ts** — כל ה-endpoints + Joi `validateBody()`
- [x] **D6. Joi validation** — register, login, updateProfile schemas ב-`user-model.ts`
- [x] **D7. אינטגרציה** — `app.ts` מחבר `/api/auth`; groups/messages משתמשים ב-auth אמיתי

### קבוצה H — Unit tests + אימות ✅

- [x] **H1. `tests/user-model.test.ts`** — 9 tests (Joi)
- [x] **H2. `tests/auth-middleware.test.ts`** — 8 tests (JWT)
- [x] **H3. `tests/auth-controller.test.ts`** — 12 tests (controllers)
- [x] **H4. `tests/database.test.ts`** — עודכן אחרי מעבר ל-`env.mongoUri`
- [x] **H5. smoke test** — health + register + login + getMe (ידני)

### קבוצה E — לקוח: AuthService (State) ✅

- [x] **E1. `Auth` service** — `currentUser` signal + `isLoggedIn` computed + `sessionReady`
- [x] **E2. `register()`** — HTTP + עדכון state
- [x] **E3. `login()`** — HTTP + token ב-`localStorage`
- [x] **E4. `logout()`** — ניקוי token + state + navigate ל-login
- [x] **E5. שחזור session** — `ensureSession()` → `GET /auth/me` בעלייה

### קבוצה F — לקוח: Register + Login (UI) ✅

- [x] **F1. Register + Login** — routes `/register`, `/login`
- [x] **F2. Reactive Forms** — username, email, password / email, password
- [x] **F3. Validators** — email, password min 6, username min 3
- [x] **F4. חיבור ל-`Auth`** + הצגת שגיאות שרת
- [x] **F5. ניווט אחרי הצלחה** — `/` (Home)

### קבוצה G — Guards + Interceptor ✅

- [x] **G1. `authGuard`** — מגן על `/` · `guestGuard` על login/register
- [x] **G2. `authInterceptor`** — צירוף JWT
- [x] **G3. Review:** קוד Login/Guard של שושי — לא נדרש (מימשת בעצמך)

### קבוצה I — Home + Agent UI ✅

- [x] **I1. `Home`** — placeholder לקבוצות/צ'אט
- [x] **I2. כפתור זמני** — "AI Assistant (temp)" פותח panel
- [x] **I3. Agent panel** — נסגר ב-Close; לא מוצג כברירת מחדל

### קבוצה J — Git + PR ✅

- [x] **J1. Branch** — `feature/auth` נוצר מ-`main` (מעודכן עם origin)
- [x] **J2. Commits** — 3 commits (server · client+tests · docs)
- [x] **J3. Push** — `origin/feature/auth`
- [x] **J4. PR** — [#6](https://github.com/ShoshiS/group-chat-app/pull/6) נפתח ב-GitHub
- [x] **J5. Merge** — [PR #6](https://github.com/ShoshiS/group-chat-app/pull/6) merged ל-`main` (18.6.2026)

### תוצר לבדיקה (Definition of Done)

- [x] API Auth בשרת — register, login, getMe, updateProfile
- [x] Unit tests ל-Auth (server + client)
- [x] `authMiddleware` מחליף stub ב-groups/messages
- [x] Client Auth — register, login, logout, session restore, guards
- [x] Agent UI — רק דרך כפתור זמני ב-Home
- [x] PR נפתח — [#6](https://github.com/ShoshiS/group-chat-app/pull/6)
- [x] Merge ל-`main` — [PR #6](https://github.com/ShoshiS/group-chat-app/pull/6) ✅

---

## Slice 2 — Groups (שבוע 2) — **Secondary** ✅

> **סטטוס:** Slice 2 (תמר) הושלם (18.6.2026). NavBar + Review שרת + placeholders.
> **K5 Thunder Client + M Review client** — יושלמו אחרי merge PR שושי (`feature/groups`).

### תכנית שבוע 2 (ימי עבודה)

| יום | תאריך | משימה | Definition of Done |
|---|---|---|---|
| **0** | 18/06 | סגירת Slice 1 | ✅ PR #6 merged · `main` מעודכן |
| **1** | 18–19/06 | Review שרת Groups | ✅ קראת `group-model`, `group-controller`, `group-routes`, `group-middleware` |
| **2** | 20/06 | Thunder Client + indexes | ✅ indexes אושרו · ⏳ CRUD+leave אחרי merge שושי |
| **3** | 21/06 | **NavBar — שלד** | ✅ `shared/nav-bar` · links · `auth.isLoggedIn()` |
| **4** | 22/06 | **NavBar — אינטגרציה** | ✅ `app.html` · routes placeholder · logout |
| **5** | 23/06 | Review client Groups | ⏳ אחרי PR שושי — GroupService, List, Card, Form |

### קבוצה K — Review שרת (ימים 1–2)

- [x] **K1. `group-model.ts`** — refs, `pre('save')` (admin ב-members), `findForUser`, Joi, toJSON
- [x] **K2. indexes** — `adminId`, `members` — **כבר מוגדרים** · לוודא שאין חסר
- [x] **K3. `group-middleware.ts`** — `isGroupAdmin`, `isGroupMember` — 403/404 נכונים
- [x] **K4. `group-controller.ts` + routes** — CRUD, leave, admin-only על update/delete
- [x] **K5. Thunder Client** — ⏳ end-to-end אחרי merge שושי · רשימת endpoints:

```
GET    /api/groups              # רשימת קבוצות שלי (JWT)
POST   /api/groups              # יצירה
GET    /api/groups/:id
PUT    /api/groups/:id          # admin only
DELETE /api/groups/:id          # admin only
POST   /api/groups/:id/leave
```

### קבוצה L — NavBar (ימים 3–4) — **אחריותך**

- [x] **L1. `client/src/app/shared/nav-bar/`** — standalone component, Material toolbar
- [x] **L2. קישורים לפי auth** — Groups → `/groups` · Invitations → `/invitations` · Profile → `/profile` · Logout
- [x] **L3. מצב אורח** — Login+Register (guest routes)
- [x] **L4. חיבור ל-`Auth`** — `currentUser()` · `logout()` · `isLoggedIn` computed
- [x] **L5. routes placeholder** — `/groups`, `/invitations`, `/profile` → stubs עד Slice 3/5
- [x] **L6. החלפת header ב-Home** — header/logout/agent הועברו ל-NavBar גלובלי

**הנחיות NavBar (מ-work-plan):**

| Route | Label | הערה |
|---|---|---|
| `/groups` | Groups | Dashboard — שושי תמלא ב-GroupList |
| `/invitations` | Invitations | stub עד Slice 3 · badge count ב-Slice 3 |
| `/profile` | Profile | stub עד Slice 5 |
| logout | Logout | קורא ל-`auth.logout()` |

### קבוצה M — Review client Groups (יום 5)

- [x] **M1. GroupService** — ⏳ Review אחרי PR שושי
- [x] **M2. GroupList + GroupCard** — ⏳ Review אחרי PR שושי
- [x] **M3. GroupForm** — ⏳ Review אחרי PR שושי
- [x] **M4. PR Review** — ⏳ אחרי PR שושי · CI ירוק

### תוצר Slice 2 (Definition of Done — תמר)

- [x] NavBar מציג links נכונים לפי login state
- [x] Review שרת Groups — אושר (הערות ל-PR שושי)
- [x] Thunder Client — ⏳ CRUD + leave אחרי merge שושי
- [x] Review client Groups — ⏳ אחרי PR שושי

---

## ▶ **[שלב נוכחי]** Slice 3 — Invitations (שבוע 3) — **Primary** ✅

> **סטטוס:** Slice 3 (תמר) הושלם (21.6.2026). PR ל-Review על ידי שושי.

### Server

- [x] `server/src/models/invitation-model.ts` — status enum, Joi, `findDuplicatePending`, toJSON
- [x] `server/src/controllers/invitation-controller.ts` — list, accept, reject, inviteToGroup, listGroupInvitations
- [x] `server/src/routes/invitation-routes.ts` — `GET /`, `PUT /:id/accept`, `PUT /:id/reject`
- [x] Validation: user exists, not already member, no duplicate pending invite, no self-invite
- [x] `POST /api/groups/:id/invite` — הזמנה לפי email או username
- [x] **בונוס:** `group-event-model.ts` + `group-timeline-service.ts` — אירועי join/leave/invite בצ'אט
- [x] **בונוס:** `GET /api/groups/:id/members`, `GET /api/groups/:id/invitations`, `DELETE .../members/:userId`

**Unit tests (14 חדשים, 88 סה"כ ב-server):**
- `tests/invitation-model.test.ts`
- `tests/invitation-controller.test.ts`
- `tests/group-member-controller.test.ts`

### Client

- [x] **`InvitationStore`** + Signal — רשימת הזמנות, `pendingCount` computed
- [x] **`InvitationList`** + **`InvitationActions`** — Accept / Reject
- [x] Route: `/invitations` — מחובר ל-store
- [x] Validation: confirm dialog לפני reject
- [x] **NavBar badge** — `MatBadge` עם `pendingCount`, טעינה אוטומטית ב-login
- [x] **בונוס:** `GroupMemberList` + `GroupInvitationActivity` בצ'אט
- [x] **בונוס:** `ChatTimeline` + `ChatSystemEvent` — הודעות מערכת ב-chat room

**Unit tests (5 חדשים, 20 סה"כ ב-client):**
- `chat-timeline.spec.ts` + עדכון `nav-bar.spec.ts`

### תוצר

- [x] הזמנה לקבוצה לפי email / username
- [x] צפייה, קבלה ודחייה של הזמנות
- [x] PR → Review על ידי שושי

### Endpoints (Thunder Client)

```
GET    /api/invitations              # הזמנות pending שלי
PUT    /api/invitations/:id/accept
PUT    /api/invitations/:id/reject
POST   /api/groups/:id/invite        # { "email": "user@example.com" }
GET    /api/groups/:id/invitations   # timeline הזמנות בקבוצה
GET    /api/groups/:id/members
DELETE /api/groups/:id/members/:userId  # admin only
```

---

## Slice 4 — Messages + Real-time (שבועות 4–5) — **Secondary**

### Server

- [ ] Review: Message model + attachments schema (שושי)
- [ ] Review + השלמת `toJSON` transform אם נדרש

### Client — **אחריותך העיקרית ב-Slice זה**

- [ ] **`SocketService`** — חיבור socket.io-client, joinGroup, leaveGroup
- [ ] Listeners: `newMessage`, `messageUpdated`, `messageDeleted`
- [ ] **`MessageItemComponent`** — edit/delete הודעות שלך
- [ ] Review: ChatRoom, MessageList, MessageForm (שושי)
- [ ] Review: `createRateLimiter` middleware (שושי)

### תוצר

- [ ] הודעות חדשות מופיעות בזמן אמת
- [ ] עריכה/מחיקה של הודעות עובדות
- [ ] PR review ל-`feature/chat-realtime`

---

## Slice 5 — Admin + Profile (שבוע 5) — **Primary**

### Server

- [ ] `DELETE /api/groups/:id/members/:userId` — admin only
- [ ] `PUT /api/auth/me` + avatar upload (Multer)
- [ ] Validation: admin cannot remove himself

### Client

- [ ] **`MemberManagementPanel`** — רשימת חברים + כפתור Remove (admin only)
- [ ] Review: ProfileComponent + avatar upload (שושי)
- [ ] **`AvatarUpload`** flow למשתמש ב-profile

### תוצר

- [ ] מנהל קבוצה יכולה להסיר חבר
- [ ] העלאת avatar למשתמש עובדת
- [ ] PR → Merge

---

## Slice 6 — גימור (שבוע 6) — **משותף**

### אחריותך

- [ ] **Responsive — Desktop:** sidebar + chat layout
- [ ] **`docs/server-analysis.md`** — תרשים פעולות Admin (Mermaid)
- [ ] **`docs/database-analysis.md`** — collections: users, invitations
- [ ] **`docs/screens-analysis.md`** — מסכי Auth + Groups
- [ ] **`server/README.md`**
- [ ] ייצוא MongoDB / Thunder Client
- [ ] **Demo prep:** Auth flow + Groups flow
- [ ] Merge branches + PR reviews

---

## סיכום אחריות לפי שכבה

| שכבה | קבצים/נושאים שלך |
|---|---|
| **MongoDB** | User, Invitation |
| **API** | Auth, Invitations, remove member |
| **Middleware** | authMiddleware, errorLogger |
| **Angular Components** | Register, NavBar, Invitations, MessageItem, MemberPanel |
| **Services** | AuthService, InvitationService, SocketService |
| **Forms** | Register, Invitation confirm |
| **Upload** | Avatar (user profile) |
| **Socket.io** | Client integration |
| **UI Responsive** | Desktop layout |
| **Docs** | Server analysis, users+invitations DB, Auth+Groups screens |

---

## Checklist הגשה — מה את אחראית להציג

- [x] Auth API בשרת (register, login, JWT, getMe)
- [x] הרשמה + התחברות + JWT — מקצה לקצה (UI → API)
- [x] Routes מוגנים ב-authGuard
- [x] הסבר מוכן: errorLogger (`console.error`) + authMiddleware (JWT Bearer)
- [x] NavBar + protected routes
- [ ] הזמנות — invite, accept, reject
- [ ] הסרת חבר מקבוצה (admin)
- [ ] Avatar upload
- [ ] Real-time messages (socket client)
- [ ] עריכה/מחיקת הודעות שלך

**דדליין:** י"א כסלו תשפ"ו
