# קובץ עבודה — תמר זיסמן

**פרויקט:** אפליקציית צ'אט Fullstack (Node.js + Angular + MongoDB)  
**שותפה:** שושי ספראי  
**תפקיד:** Primary ב-Auth, Invitations, Admin/Profile | Secondary ב-Groups, Messages  
**תכנון ראשי:** [work-plan.md](work-plan.md)

---

## סמן מיקום

| | |
|---|---|
| **שלב נוכחי** | Phase 1 — Database |
| **משימה פעילה** | User model + Invitation model (Primary) |
| **Branch פעיל** | `feature/auth` (לפתוח) |
| **משימה עכשיו** | **DB קודם:** `User.model.js` (+ findByEmail עם שושי). Server (auth/middleware/routes) ו-Client **אחרי** שכל ה-models מוכנים |
| **עודכן לאחרונה** | 2026-06-10 |
| **עודכן על ידי** | שושי |

> עדכני שדה זה בכל מעבר שלב — בסוף כל שבוע עבודה לפחות.

### איך לעדכן

1. בסיום משימה / מעבר Phase — עדכני את הטבלה + תאריך
2. הזיזי את `▶ **[שלב נוכחי]**` לכותרת השלב החדשה
3. עדכני גם את מסמך שושי + התכנון הראשי (סנכרון צוות)

---

## עקרון העבודה שלך

את **בעלים ראשית (~70%)** על Auth, Invitations ו-Admin.  
בכל פיצ'ר את **חייבת** לגעת בכל שכבה (DB, API, Middleware, Service, UI) — לפחות כ-Secondary (~30%).

**סדר עבודה גלובלי:** בונים קודם את **כל מסד הנתונים** (Phase 1), אחר כך את **כל השרת** (Phase 2), ולבסוף את **כל הלקוח** (Phase 3). כל משימה מתויגת בפיצ'ר המקורי ([Auth]/[Invitations]/...) ובתפקיד (Primary/Secondary).

**Branches שלך:**
- `feature/auth`
- `feature/invitations`
- `feature/polish` (משותף)

---

## Phase 0 — הקמה משותפת (ימים 1–2, עם שושי) ✓

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

- [ ] **`server/src/models/User.model.js`** [Auth]
  - שדות: username, email, password, avatar, role
  - `pre('save')` — hash password עם bcrypt
  - `toJSON()` — הסתרת password
  - `static findByEmail()` — בשיתוף/Review עם שושי
- [ ] **`server/src/models/Invitation.model.js`** [Invitations]
  - שדות: groupId, invitedUserId, invitedBy, status (pending/accepted/rejected)
  - `static findPendingForUser()`, `toJSON()`

### Secondary — Review

- [ ] Review: `Group.model.js` (שושי) [Groups] — הוספת indexes אם חסרים
- [ ] Review: Message model + attachments schema (שושי) [Messages] — השלמת `toJSON` transform אם נדרש

### תוצר

- [ ] 4 collections מוגדרים (users, groups, invitations, messages)
- [ ] דרישות Mongoose מולאו: `pre` hook (hash password), `static` method, `toJSON`

---

## Phase 2 — Server (Routes / Controllers / Middleware / Validators)

> אחרי שכל ה-models מוכנים. כל endpoint נבדק ב-Thunder Client לפני מעבר ל-Client.

### [Auth] — Primary

- [ ] `server/src/middleware/auth.middleware.js` — verify JWT, `signToken()`
- [ ] `server/src/middleware/errorLogger.middleware.js` — console ב-dev, winston לקובץ ב-production
- [ ] `server/src/controllers/auth.controller.js` — register, login, getMe, updateProfile
- [ ] `server/src/routes/auth.routes.js`
- [ ] `server/src/validators/auth.validator.js` — express-validator
- [ ] בדיקה: register + login + `/api/auth/me` ב-Thunder Client

### [Groups] — Secondary

- [ ] Review: group routes + controllers (שושי)
- [ ] בדיקות ב-Thunder Client — CRUD groups, leave group

### [Invitations] — Primary

- [ ] `server/src/controllers/invitation.controller.js` — list, accept, reject, pending count
- [ ] `server/src/routes/invitation.routes.js`
- [ ] Validation: user exists, not already member, no duplicate pending invite
- [ ] endpoint הזמנה ב-group controller: `POST /api/groups/:id/invite`

### [Messages] — Secondary

- [ ] Review: `createRateLimiter` middleware (שושי)

### [Admin] — Primary

- [ ] `DELETE /api/groups/:id/members/:userId` — admin only
- [ ] `PUT /api/auth/me` + avatar upload (Multer)
- [ ] Validation: admin cannot remove himself

### תוצר

- [ ] Auth: register, login, getMe, JWT verify (נבדק)
- [ ] Invitations: invite, list, accept, reject (נבדק)
- [ ] Admin: remove member + profile/avatar update (נבדק)
- [ ] כל ה-APIs עוברים ב-Thunder Client

---

## Phase 3 — Client (Angular)

> אחרי ש-API יציב. Material מותקן על ידי שושי בתחילת Phase 3.

### [Auth]

- [ ] **`RegisterComponent`** + Reactive Forms validation
- [ ] **`AuthService`** + Signals (user state, login/logout/register)
- [ ] Validation ב-register: email, password min 6, username min 3
- [ ] Review: `LoginComponent`, `AuthGuard` (שושי)
- [ ] Review: HTTP interceptor (שושי)

### [Groups]

- [ ] **`NavBar`** — קישורים לפי auth state (Groups, Invitations, Profile, Logout)
- [ ] Review: GroupList, GroupCard, GroupForm (שושי)
- [ ] Review: GroupService + Signals (שושי)

### [Invitations]

- [ ] **`InvitationService`** + Signal (רשימת הזמנות, count)
- [ ] **`InvitationListComponent`** — רשימת הזמנות pending
- [ ] **`InvitationActionsComponent`** — כפתורי Accept / Reject
- [ ] Route: `/invitations`
- [ ] Validation: confirm dialog לפני reject

### [Messages]

- [ ] **`SocketService`** — חיבור socket.io-client, joinGroup, leaveGroup
- [ ] Listeners: `newMessage`, `messageUpdated`, `messageDeleted`
- [ ] **`MessageItemComponent`** — edit/delete הודעות שלך
- [ ] Review: ChatRoom, MessageList, MessageForm (שושי)

### [Profile / Admin]

- [ ] **`MemberManagementPanel`** — רשימת חברים + כפתור Remove (admin only)
- [ ] **`AvatarUpload`** flow למשתמש ב-profile
- [ ] Review: ProfileComponent + avatar upload (שושי)

### תוצר

- [ ] הרשמה + התחברות + JWT נשמר + routes מוגנים ב-AuthGuard
- [ ] NavBar מציג links נכונים לפי login state
- [ ] הזמנות: צפייה, קבלה ודחייה
- [ ] הודעות real-time + עריכה/מחיקה
- [ ] הסרת חבר (admin) + avatar upload
- [ ] PR לכל פיצ'ר → Review על ידי שושי → Merge

---

## Phase 4 — גימור + Docs (שבוע אחרון) — **משותף**

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
