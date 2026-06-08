# קובץ עבודה — תמר זיסמן

**פרויקט:** אפליקציית צ'אט Fullstack (Node.js + Angular + MongoDB)  
**שותפה:** שושי ספראי  
**תפקיד:** Primary ב-Auth, Invitations, Admin/Profile | Secondary ב-Groups, Messages  
**תכנון ראשי:** [work-plan.md](work-plan.md)

---

## סמן מיקום

| | |
|---|---|
| **שלב נוכחי** | שלב 0 — הקמה משותפת |
| **Slice פעיל** | — |
| **Branch פעיל** | `main` |
| **משימה עכשיו** | הקמת Monorepo עם שושי |
| **עודכן לאחרונה** | 2026-06-08 |
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

---

## ▶ **[שלב נוכחי]** שלב 0 — הקמה משותפת (ימים 1–2, עם שושי)

- [ ] יצירת Monorepo + GitHub repo
- [ ] `server/`: Express scaffold, `.env`, חיבור MongoDB
- [ ] `client/`: `ng new` עם routing, Material, standalone
- [ ] `.env.example` ב-server וב-client
- [ ] תיקיית `docs/` עם templates
- [ ] הסכמה על naming conventions ו-branch strategy

---

## Slice 1 — Auth (שבוע 1) — **Primary**

### Server (אחריותך)

- [ ] `server/src/models/User.model.js`
  - שדות: username, email, password, avatar, role
  - `pre('save')` — hash password עם bcrypt
  - `toJSON()` — הסתרת password
  - `static findByEmail()` — בשיתוף/Review עם שושי
- [ ] `server/src/middleware/auth.middleware.js` — verify JWT, `signToken()`
- [ ] `server/src/middleware/errorLogger.middleware.js` — console ב-dev, winston לקובץ ב-production
- [ ] `server/src/controllers/auth.controller.js` — register, login, getMe, updateProfile
- [ ] `server/src/routes/auth.routes.js`
- [ ] `server/src/validators/auth.validator.js` — express-validator

### Client (Secondary — Review + Register)

- [ ] Review: `LoginComponent`, `AuthGuard` (שושי)
- [ ] Review: HTTP interceptor (שושי)
- [ ] **`RegisterComponent`** + Reactive Forms validation
- [ ] **`AuthService`** + Signals (user state, login/logout/register)
- [ ] Validation ב-register: email, password min 6, username min 3

### תוצר לבדיקה

- [ ] הרשמה עובדת
- [ ] התחברות + JWT נשמר
- [ ] Routes מוגנים ב-AuthGuard
- [ ] PR → Review על ידי שושי → Merge

---

## Slice 2 — Groups (שבוע 2) — **Secondary**

### Server

- [ ] Review: `Group.model.js` (שושי)
- [ ] הוספת indexes אם חסרים
- [ ] Review: group routes + controllers
- [ ] בדיקות ב-Thunder Client — CRUD groups, leave group

### Client

- [ ] **`NavBar`** — קישורים לפי auth state (Groups, Invitations, Profile, Logout)
- [ ] Review: GroupList, GroupCard, GroupForm (שושי)
- [ ] Review: GroupService + Signals

### תוצר

- [ ] NavBar מציג links נכונים לפי login state
- [ ] PR review ל-`feature/groups` של שושי

---

## Slice 3 — Invitations (שבוע 3) — **Primary**

### Server

- [ ] `server/src/models/Invitation.model.js`
  - שדות: groupId, invitedUserId, invitedBy, status (pending/accepted/rejected)
  - `static findPendingForUser()`
  - `toJSON()`
- [ ] `server/src/controllers/invitation.controller.js` — list, accept, reject, pending count
- [ ] `server/src/routes/invitation.routes.js`
- [ ] Validation: user exists, not already member, no duplicate pending invite
- [ ] endpoint הזמנה ב-group controller: `POST /api/groups/:id/invite`

### Client

- [ ] **`InvitationService`** + Signal (רשימת הזמנות, count)
- [ ] **`InvitationListComponent`** — רשימת הזמנות pending
- [ ] **`InvitationActionsComponent`** — כפתורי Accept / Reject
- [ ] Route: `/invitations`
- [ ] Validation: confirm dialog לפני reject

### תוצר

- [ ] הזמנה לקבוצה לפי email
- [ ] צפייה, קבלה ודחייה של הזמנות
- [ ] PR → Review על ידי שושי

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

- [ ] הרשמה + התחברות + JWT
- [ ] NavBar + protected routes
- [ ] הזמנות — invite, accept, reject
- [ ] הסרת חבר מקבוצה (admin)
- [ ] Avatar upload
- [ ] Real-time messages (socket client)
- [ ] עריכה/מחיקת הודעות שלך
- [ ] הסבר על errorLogger + authMiddleware

**דדליין:** י"א כסלו תשפ"ו
