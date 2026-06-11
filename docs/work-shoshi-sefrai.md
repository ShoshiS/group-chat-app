# קובץ עבודה — שושי ספראי

**פרויקט:** אפליקציית צ'אט Fullstack (Node.js + Angular + MongoDB)  
**שותפה:** תמר זיסמן  
**תפקיד:** Primary ב-Groups, Messages/Chat | Secondary ב-Auth, Invitations, Profile  
**תכנון ראשי:** [work-plan.md](work-plan.md)

---

## סמן מיקום

| | |
|---|---|
| **שלב נוכחי** | Phase 1 — Database |
| **משימה פעילה** | Group model (Primary) + review User model |
| **Branch פעיל** | `feature/groups` / `feature/auth` (לפתוח) |
| **משימה עכשיו** | **DB קודם** — `Group.model.js` + review/`findByEmail` ב-User model. Server ו-Client **אחרי** שכל ה-models מוכנים |
| **עודכן לאחרונה** | 2026-06-10 |
| **עודכן על ידי** | שושי |

> עדכני שדה זה בכל מעבר שלב — בסוף כל שבוע עבודה לפחות.

### איך לעדכן

1. בסיום משימה / מעבר Phase — עדכני את הטבלה + תאריך
2. הזיזי את `▶ **[שלב נוכחי]**` לכותרת השלב החדשה
3. עדכני גם את מסמך תמר + התכנון הראשי (סנכרון צוות)

---

## עקרון העבודה שלך

את **בעלים ראשית (~70%)** על Groups ו-Messages/Real-time.  
בכל פיצ'ר את **חייבת** לגעת בכל שכבה (DB, API, Middleware, Service, UI) — לפחות כ-Secondary (~30%).

**סדר עבודה גלובלי:** בונים קודם את **כל מסד הנתונים** (Phase 1), אחר כך את **כל השרת** (Phase 2), ולבסוף את **כל הלקוח** (Phase 3). כל משימה מתויגת בפיצ'ר המקורי ([Auth]/[Groups]/...) ובתפקיד (Primary/Secondary).

**Branches שלך:**
- `feature/groups`
- `feature/chat-realtime`
- `feature/polish` (משותף)

---

## Phase 0 — הקמה משותפת (ימים 1–2, עם תמר) ✓

- [x] יצירת Monorepo + GitHub repo
- [x] `server/`: Express scaffold, `.env`, חיבור MongoDB
- [ ] `client/`: `ng new` עם routing, Material, standalone *(routing + standalone ✓; Material — Phase 3)*
- [x] `.env.example` ב-server וב-client
- [x] תיקיית `docs/` עם templates
- [x] הסכמה על naming conventions ו-branch strategy

---

## ▶ **[שלב נוכחי]** Phase 1 — Database (כל ה-Models)

> בונים את **כל ארבעת ה-collections** לפני כתיבת השרת. אל תתחילי routes/controllers עד שכל ה-models מוכנים ונבדקו.

### Primary — שלך

- [ ] **`server/src/models/Group.model.js`** [Groups]
  - שדות: name, description, adminId, members[], avatar
  - refs ל-User, validation, indexes
  - `static findForUser()`, `toJSON()`
- [ ] **`server/src/models/Message.model.js`** [Messages]
  - text, groupId, senderId, attachments[] (image/audio/pdf)
  - `pre('save')`, `static findByGroup()`, `toJSON()`

### Secondary — Review/השלמה

- [ ] **`static findByEmail()`** — וידוא/השלמה ב-User model [Auth] (בשיתוף תמר)
- [ ] Review: User model (תמר) [Auth]
- [ ] Review: Invitation model (תמר) [Invitations]

### תוצר

- [ ] 4 collections מוגדרים (users, groups, invitations, messages)
- [ ] דרישות Mongoose מולאו: `pre` hook, `static` method, `toJSON`

---

## Phase 2 — Server (Routes / Controllers / Middleware / Sockets)

> אחרי שכל ה-models מוכנים. כל endpoint נבדק ב-Thunder Client לפני מעבר ל-Client.

### [Auth] — Secondary

- [ ] Review: auth routes, controllers, JWT (תמר)
- [ ] Review: `errorLogger` middleware (תמר)
- [ ] בדיקה: register + login + `/api/auth/me` ב-Thunder Client
- [ ] PR review ל-`feature/auth` (צד שרת)

### [Groups] — Primary

- [ ] `server/src/middleware/group.middleware.js` — `isGroupAdmin`, `isGroupMember`
- [ ] `server/src/controllers/group.controller.js` — CRUD, leave, invite
- [ ] `server/src/routes/group.routes.js`
- [ ] Validation: name required, min 2 chars

### [Invitations] — Secondary

- [ ] Review: Invitation endpoints (תמר)

### [Messages] — Primary

- [ ] `server/src/controllers/message.controller.js` — CRUD
- [ ] `server/src/middleware/upload.middleware.js` — Multer (image, audio, PDF, max 10MB)
- [ ] `server/src/middleware/rateLimiter.middleware.js` — **`createRateLimiter(max, windowMs)`** (middleware creator)
- [ ] `server/src/sockets/index.js` — Socket.io setup
  - Events: `joinGroup`, `leaveGroup`, `newMessage`, `messageUpdated`, `messageDeleted`
- [ ] Routes: messages under `/api/groups/:id/messages`

### [Admin] — Secondary

- [ ] Review: DELETE member endpoint (תמר)

### תוצר

- [ ] שרת: register, login, JWT verify, getMe (נבדק)
- [ ] Groups CRUD + leave + invite (נבדק)
- [ ] Messages CRUD + Multer upload + rate limiter + Socket.io events (נבדק)
- [ ] כל ה-APIs עוברים ב-Thunder Client

---

## Phase 3 — Client (Angular)

> אחרי ש-API יציב. מתחילים ב-`ng add @angular/material`.

### [Auth]

- [ ] `ng add @angular/material`
- [ ] **`LoginComponent`** + Reactive Forms validation
- [ ] **`AuthGuard`** — הגנה על routes
- [ ] **`authInterceptor`** — attach JWT token ל-Header
- [ ] Review: RegisterComponent, AuthService (תמר)
- [ ] Validation: email required, password required

### [Groups]

- [ ] **`GroupService`** + Signal store (רשימת קבוצות)
- [ ] **`GroupListComponent`** — `/groups`
- [ ] **`GroupCardComponent`** — כרטיס קבוצה
- [ ] **`GroupFormComponent`** — shared form: `/groups/new` + `/groups/:id/edit`
- [ ] Review: NavBar links (תמר)

### [Invitations]

- [ ] **`NavBar`** — badge/count להזמנות pending
- [ ] Review: InvitationList, InvitationActions (תמר)
- [ ] Review: InvitationService
- [ ] Confirm dialog לפני reject (אם לא נעשה)

### [Messages]

- [ ] **`MessageService`** + Signal (real-time updates)
- [ ] **`ChatRoomComponent`** — `/groups/:id`
- [ ] **`MessageListComponent`**
- [ ] **`MessageFormComponent`** — text + file picker + preview
- [ ] File preview: image, audio player, PDF link
- [ ] Review: SocketService, MessageItem (תמר)
- [ ] Validation client: file type + size

### [Profile / Admin]

- [ ] **`ProfileComponent`** — `/profile`
- [ ] **`ProfileForm`** — עדכון username
- [ ] **`AvatarUpload`** — review/שיפור flow של תמר
- [ ] **Group avatar upload** — ב-GroupForm

### תוצר

- [ ] Login + redirect ל-groups, token בכל request
- [ ] Groups: יצירה/עריכה/מחיקה (admin)/יציאה, GroupForm לפי id param
- [ ] Badge הזמנות ב-NavBar
- [ ] צ'אט real-time + שליחת קבצים + עריכה/מחיקה
- [ ] Profile + avatar + group avatar
- [ ] PR לכל פיצ'ר → Review על ידי תמר → Merge

---

## Phase 4 — גימור + Docs (שבוע אחרון) — **משותף**

### אחריותך

- [ ] **Responsive — Mobile:** hamburger menu + full-width chat
- [ ] **`docs/server-analysis.md`** — תרשים פעולות Regular User (Mermaid)
- [ ] **`docs/database-analysis.md`** — collections: groups, messages
- [ ] **`docs/screens-analysis.md`** — מסכי Chat + Invitations
- [ ] **`client/README.md`**
- [ ] ייצוא MongoDB / Thunder Client
- [ ] **Demo prep:** Chat flow + Invitations flow
- [ ] PR reviews לכל branches

---

## סיכום אחריות לפי שכבה

| שכבה | קבצים/נושאים שלך |
|---|---|
| **MongoDB** | Group, Message |
| **API** | Groups, Messages |
| **Middleware** | isGroupAdmin, isGroupMember, createRateLimiter, Multer upload |
| **Angular Components** | Login, Groups (List/Card/Form), Chat (Room/List/Form), Profile |
| **Services** | GroupService, MessageService |
| **Forms** | Login, Group, Message + file picker |
| **Upload** | Message attachments, Group avatar |
| **Socket.io** | Server setup + room events |
| **UI Responsive** | Mobile layout (hamburger) |
| **Docs** | Regular user server analysis, groups+messages DB, Chat+Invitations screens |

---

## Checklist הגשה — מה את אחראית להציג

- [ ] Login + AuthGuard + interceptor
- [ ] Groups CRUD + GroupForm (add/edit)
- [ ] יציאה מקבוצה
- [ ] צ'אט real-time + שליחת קבצים
- [ ] Profile + avatar + group avatar
- [ ] isGroupAdmin + createRateLimiter — הסבר
- [ ] Socket.io server events

**דדליין:** י"א כסלו תשפ"ו

---

## ספריות npm — שלך להתקין

**Server:**
- `socket.io`, `multer`, `winston` (אם לא הותקנו)

**Client:**
- `socket.io-client`
- ספרייה נוספת לבחירה (מומלץ: `date-fns` לתאריכי הודעות)
