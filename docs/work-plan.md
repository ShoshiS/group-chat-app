# תכנון עבודה — פרויקט צ'אט (Node.js + Angular + MongoDB)

**מסמכים קשורים:**
- [work-tamar-zisman.md](work-tamar-zisman.md) — קובץ עבודה אישי (תמר)
- [work-shoshi-sefrai.md](work-shoshi-sefrai.md) — קובץ עבודה אישי (שושי)

---

## סמן מיקום

| | |
|---|---|
| **שלב נוכחי** | Slice 6 — גימור משותף (Responsive + Docs + Demo) |
| **Slice פעיל** | Slice 6 |
| **Branch פעיל** | `feature/admin-profile` · PR pending · [PR #10](https://github.com/ShoshiS/group-chat-app/pull/10) (Slice 4) |
| **משימה עכשיו** | תמר: Responsive Desktop + server-analysis · שושי: Mobile + client docs |
| **עודכן לאחרונה** | 2026-06-21 |
| **עודכן על ידי** | תמר |

> עדכנו שדה זה בכל מעבר שלב — בסוף כל שבוע עבודה לפחות.

### איך לעדכן

1. בסיום משימה / מעבר Slice — עדכני את הטבלה + תאריך
2. הזיזי את `▶ **[שלב נוכחי]**` לכותרת השלב החדשה
3. עדכני גם את מסמכי העבודה האישיים (תמר + שושי) — סנכרון צוות

---

## סקירה

**פרויקט:** אפליקציית צ'אט Fullstack — ניהול קבוצות, משתמשים, הזמנות והודעות (CRUD מלא).

**צוות:** תמר זיסמן + שושי ספראי

**טכנולוגיות (גרסאות עדכניות):**
- **Server:** Node.js 22 LTS + Express + Mongoose + JWT + bcrypt + Socket.io — **TypeScript (ESM)**
- **Client:** Angular 20 (standalone components, Signals, Reactive Forms) + Angular Material + HttpClient
- **DB:** MongoDB Atlas (מומלץ) / Compass לייצוא מקומי
- **State:** Angular Signals + Services (לא NgRx)
- **Validation (Server):** Joi במודלים + `validateBody()` middleware (לא express-validator)
- **Git:** Monorepo — `server/` + `client/` + README ראשי
- **שפה:** אנגלית, LTR

**Conventions (מוסכם):**
- קבצים: `kebab-case` — למשל `user-model.ts`, `auth-middleware.ts`
- Env: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d` — גישה מרכזית ב-`server/src/config/env.ts`

**עקרון חלוקה:** חלוקה לפי **Vertical Slices** (פיצ'רים) — כל אחת **בעלים ראשית** על חלק מהפיצ'רים, אבל **חובה לגעת בכל שכבה** (Schema, API, Middleware, Component, Service, Validation, Tests ידניים). השנייה עושה **Code Review + משימות משניות חובה** בכל slice.

---

## ארכיטקטורה כללית

```mermaid
flowchart TB
    subgraph client [Angular Client]
        UI[Components + Material UI]
        Svc[Services + Signals]
        Guard[Auth Guard + Interceptor]
        SocketC[Socket.io Client]
    end
    subgraph server [Node Express Server]
        Routes[Routes + Controllers]
        MW[Custom Middleware]
        Auth[JWT Auth]
        SocketS[Socket.io Server]
        Multer[Multer Uploads]
    end
    subgraph db [MongoDB]
        Users[(users)]
        Groups[(groups)]
        Invites[(invitations)]
        Messages[(messages)]
    end
    UI --> Svc --> Guard
    Svc -->|REST| Routes
    SocketC <-->|real-time| SocketS
    Routes --> Auth --> MW
    Routes --> Multer
    Routes --> db
    SocketS --> db
```

---

## מבנה Monorepo

```
group-chat-app/
├── README.md
├── .gitignore
├── docs/
│   ├── work-plan.md
│   ├── work-tamar-zisman.md
│   ├── work-shoshi-sefrai.md
│   ├── server-analysis.md
│   ├── database-analysis.md
│   └── screens-analysis.md
├── server/
│   ├── .env.example
│   ├── README.md
│   └── src/
│       ├── config/          # env.ts, database.ts, cors.ts
│       ├── models/          # user-model.ts, group-model.ts, ...
│       ├── routes/
│       ├── controllers/
│       ├── middleware/      # auth-middleware.ts, error-middleware.ts, validate-middleware.ts
│       ├── services/
│       ├── sockets/
│       └── utils/
└── client/
    ├── .env.example
    ├── README.md
    └── src/app/
        ├── core/
        ├── shared/
        └── features/
            ├── auth/
            ├── groups/
            ├── invitations/
            └── chat/
```

---

## מסד נתונים — 4 אוספים (מינימום 2)

| Collection | שדות עיקריים | קשרים |
|---|---|---|
| **users** | username, email, passwordHash, avatar (image), role (`user`/`admin`) | ref ב-groups, messages |
| **groups** | name, description, adminId, members[], avatar (image) | admin → users, members → users |
| **invitations** | groupId, invitedUserId, invitedBy, status (`pending`/`accepted`/`rejected`) | refs → groups, users |
| **messages** | groupId, senderId, text, attachments[] (image/audio/pdf), timestamps | refs → groups, users |

**דרישות Mongoose (חובה):** כל model יכלול לפחות אחד מ: `pre` hook (hash password), `static` method (findByEmail), `toJSON` (הסתרת password).

**סוגי מדיה (חובה):**
- **טקסט** — תוכן הודעות, שמות קבוצות
- **תמונות** — avatar משתמש/קבוצה (Multer)
- **אודיו** — קובץ מצורף להודעה
- **PDF** (אופציונלי) — קובץ מצורף נוסף

---

## סוגי משתמשים והרשאות

| פעולה | משתמש רגיל | מנהל קבוצה (יוצר) |
|---|---|---|
| הרשמה / התחברות | ✓ | ✓ |
| צפייה בקבוצות שלי | ✓ | ✓ |
| יצירת קבוצה (הופך למנהל) | ✓ | ✓ |
| הזמנת משתמש לקבוצה | ✓ (חבר) | ✓ |
| קבלה/דחיית הזמנה | ✓ | ✓ |
| מחיקת חבר מקבוצה | ✗ | ✓ |
| CRUD הודעות + קבצים | ✓ (שלו) | ✓ |
| יציאה מקבוצה | ✓ | ✓ |
| מחיקת קבוצה | ✗ | ✓ |

**Auth:** JWT ב-Header, `AuthGuard` + `RoleGuard` / `GroupAdminGuard` ב-Angular, `authMiddleware` + `isGroupAdmin` בשרת.

---

## מסכים וקומפוננטות (Client)

| מסך | Route | קומפוננטות |
|---|---|---|
| Login | `/login` | LoginForm |
| Register | `/register` | RegisterForm |
| Dashboard | `/groups` | GroupList, GroupCard |
| Create/Edit Group | `/groups/new`, `/groups/:id/edit` | GroupForm (shared — id param) |
| Group Detail / Chat | `/groups/:id` | ChatRoom, MessageList, MessageItem, MessageForm |
| Invitations | `/invitations` | InvitationList, InvitationActions |
| Profile | `/profile` | ProfileForm, AvatarUpload |
| Navbar | global | NavBar (links לפי auth state) |
| Routes | global | AppRoutes |

**דרישות UI:** Angular Material, Responsive (Desktop: sidebar + chat / Mobile: hamburger + full-width), **ללא inline styles**, CSS/SCSS נפרד לפי צורך.

---

## API Endpoints (Server)

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/groups
POST   /api/groups
GET    /api/groups/:id
PUT    /api/groups/:id          # admin only
DELETE /api/groups/:id          # admin only
POST   /api/groups/:id/leave
POST   /api/groups/:id/invite
DELETE /api/groups/:id/members/:userId  # admin only

GET    /api/invitations
PUT    /api/invitations/:id/accept
PUT    /api/invitations/:id/reject

GET    /api/groups/:id/messages
POST   /api/groups/:id/messages         # + multer
PUT    /api/messages/:id                # owner only
DELETE /api/messages/:id                # owner or admin
```

**Socket.io events:** `joinGroup`, `leaveGroup`, `newMessage`, `messageUpdated`, `messageDeleted`

---

## Custom Middleware (חובה — כל אחת אחד)

| Middleware | בעלים | תיאור |
|---|---|---|
| `errorLogger` | **תמר** | ב-dev: console; ב-production: כתיבה לקובץ log |
| `requestValidator` / `rateLimiter` | **שושי** | middleware creator — factory function עם פרמטרים |

דוגמה ל-pattern (middleware creator):
```javascript
const createRateLimiter = (maxRequests, windowMs) => (req, res, next) => { ... }
```

---

## חלוקת עבודה — תמר זיסמן vs שושי ספראי

### עקרון: "Primary + Secondary + Cross-Cutting"

כל slice כולל 4 שכבות: **DB → API → Client Service → UI**.  
הבעלים הראשית עושה ~70%, המשנית ~30% (חובה).

---

### שלב 0 — הקמה משותפת (יום 1–2, **שתיהן ביחד**) ✅

- [x] יצירת Monorepo + GitHub repo
- [x] `server`: Express scaffold, `.env`, חיבור MongoDB
- [x] `client`: `ng new` עם routing, Material, standalone
- [x] הגדרת `.env.example` בשני הצדדים
- [x] הסכמה על conventions: TypeScript, kebab-case, Joi, branch strategy
- [x] יצירת `docs/` עם templates לקדם-הגשה

---

### Slice 1 — Auth (התחברות / הרשמה / JWT) — ✅ **שבוע 1 הושלם**

| משימה | תמר (Primary) | שושי (Secondary) | סטטוס |
|---|---|---|---|
| **DB** | User model + pre hash + toJSON | Review + static `findByEmail` | ✅ |
| **API** | auth routes, register/login controllers, JWT sign | Review | ✅ |
| **Middleware** | `authMiddleware` — verify JWT | error logging (`console.error`) | ✅ |
| **Client Service** | Auth service + Signals | JWT interceptor | ✅ |
| **UI** | Register + Login + Home shell | Review Login/Guard | ✅ (תמר מימשה) |
| **Validation** | Server: Joi on register/login body | Client: Reactive Forms validators | ✅ |

**תוצר:** הרשמה, התחברות, logout, protected routes, session restore.

**PR:** [#6 — feat: Slice 1 Auth](https://github.com/ShoshiS/group-chat-app/pull/6) · **✅ merged ל-`main`** (18.6.2026 · `df622a2`)

**Tests:** server 74/74 · client 15/15 · smoke: health + register + login + getMe

---

### Slice 2 — Groups (יצירה, רשימה, ניהול) — **שבוע 2** ✅ (תמר)

| משימה | שושי (Primary) | תמר (Secondary) | סטטוס |
|---|---|---|---|
| **DB** | Group model + refs + validation | Review + indexes | ✅ Review |
| **API** | CRUD groups, leave group, admin check | Review + Thunder Client | ✅ Review · ⏳ Thunder אחרי merge שושי |
| **Middleware** | `isGroupAdmin` middleware | Review | ✅ |
| **Client Service** | GroupService + group Signal store | Review | ⏳ שושי |
| **UI** | GroupList, GroupCard, GroupForm (add/edit by id) | **NavBar** links by auth state | ✅ NavBar · ⏳ Groups UI שושי |
| **Validation** | Server: group name required, min length | Client: Reactive Forms | ⏳ שושי |

**Branch:** `feature/groups` (שושי) · `feature/nav-bar` (תמר) → PR

---

### Slice 3 — Invitations (הזמנות) — ✅ **תמר · merged**

| משימה | תמר (Primary) | שושי (Secondary) | סטטוס |
|---|---|---|---|
| **DB** | Invitation model + status enum | Review | ✅ |
| **API** | invite, list, accept, reject endpoints | Review | ✅ |
| **Client Service** | InvitationStore + Signal | Review | ✅ |
| **UI** | InvitationList + accept/reject buttons | Badge/count in NavBar | ✅ |
| **Validation** | Server: user exists, not already member | Client: confirm dialog | ✅ |

**תוצר:** הזמנה לקבוצה, צפייה בהזמנות, קבלה/דחייה.

**PR:** [#9 — feat: Slice 3 Invitations](https://github.com/ShoshiS/group-chat-app/pull/9) · **✅ merged ל-`main`** (20.6.2026 · `456c349`)

**Tests:** server 88/88 · client 20/20

---

### Slice 4 — Messages + Media + Real-time — ✅ **שושי Primary · תמר Secondary**

| משימה | שושי (Primary) | תמר (Secondary) | סטטוס |
|---|---|---|---|
| **DB** | Message model + attachments schema | Review + toJSON transform | ✅ |
| **API** | Message CRUD + Multer (image/audio/pdf) | Review | ✅ |
| **Socket.io** | Server: socket setup, room events | Client: socket service + listeners | ✅ |
| **Client Service** | MessageService + real-time Signal updates | Review | ✅ |
| **UI** | ChatRoom, MessageList, MessageForm, file preview | MessageItem (edit/delete own) | ✅ |
| **Validation** | Server: file type/size limits | Client: file picker validation | ✅ |
| **Middleware** | `createRateLimiter` (middleware creator) | Review | ✅ |

**תוצר:** צ'אט בזמן אמת, שליחת טקסט + קבצים, עריכה/מחיקה.

**PRs:** [PR #5](https://github.com/ShoshiS/group-chat-app/pull/5) (server realtime) · [PR #8](https://github.com/ShoshiS/group-chat-app/pull/8) (client chat) · [PR #10](https://github.com/ShoshiS/group-chat-app/pull/10) (fix `messageDeleted` payload)

**Tests:** client 20/20 · אימות ידני: newMessage + messageUpdated + messageDeleted בין שני clients

---

### Slice 5 — Admin Actions + Profile — ✅ **תמר Primary · שושי Secondary**

| משימה | תמר (Primary) | שושי (Secondary) | סטטוס |
|---|---|---|---|
| **API** | DELETE member from group (admin) | Review | ✅ |
| **UI** | Member management panel in group | ProfileComponent + avatar upload | ✅ |
| **Media** | Avatar upload flow (user) | Group avatar upload | ✅ user · ⏳ group |

**תוצר:** admin מסיר חבר · משתמש מעלה avatar ב-`/profile` · URL ב-Cloudinary + MongoDB.

**Tests:** server 91/91 · client 20/20 · אימות ידני: remove member + avatar upload

---

### ▶ **[שלב נוכחי]** Slice 6 — גימור משותף (שבוע אחרון)

**שתיהן — חובה:**

| נושא | תמר | שושי |
|---|---|---|
| Responsive pass | Desktop layout (sidebar) | Mobile layout (hamburger) |
| `docs/server-analysis.md` | תרשים Admin | תרשים Regular User |
| `docs/database-analysis.md` | Collections 1–2 | Collections 3–4 |
| `docs/screens-analysis.md` | Auth + Groups screens | Chat + Invitations screens |
| README | Server README | Client README |
| Thunder Client / Compass export | Export collections | Export collections |
| Git | Merge feature branches | PR reviews |
| Demo prep | Auth + Groups flow | Chat + Invitations flow |

---

## מטריצת כיסוי — וידוא שכל אחת נוגעת בכל חלק

| תחום | תמר | שושי |
|---|---|---|
| MongoDB Schema | User, Invitation | Group, Message |
| API Controllers | Auth, Invitations | Groups, Messages |
| Custom Middleware | authMiddleware, errorLogger | isGroupAdmin, rateLimiter creator |
| Angular Components | Login, Invitations, Chat | Register, Groups, Profile |
| Services + Signals | AuthService | GroupService, MessageService |
| Forms + Validation | Register, Invitation | Login, Group, Message |
| File Upload | Avatar | Message attachments |
| Socket.io | Client integration | Server setup |
| Responsive UI | Desktop | Mobile |
| Documentation | Server analysis | DB + Screens analysis |

---

## ספריות npm נוספות (לבחירה)

- **Server:** `joi`, `winston` (logging), `socket.io`, `jsonwebtoken`, `bcrypt`
- **Client:** `socket.io-client`, ספרייה נוספת לבחירה (למשל `date-fns` לתאריכים)

---

## לוח זמנים מוצע (6 שבועות)

```mermaid
gantt
    title לוח זמנים
    dateFormat YYYY-MM-DD
    section Setup
    MonorepoSetup           :s0, 2026-06-09, 3d
    section Slices
    AuthSlice               :s1, after s0, 5d
    GroupsSlice             :s2, after s1, 5d
    InvitationsSlice        :s3, after s2, 4d
    MessagesRealtime        :s4, after s3, 7d
    AdminProfile            :s5, after s4, 3d
    section Finish
    DocsTestingDeploy       :s6, after s5, 5d
```

| שבוע | מטרה | אחראית ראשית |
|---|---|---|
| 1 | Setup + Auth | תמר — **✅ הושלם + merged** · [PR #6](https://github.com/ShoshiS/group-chat-app/pull/6) |
| 2 | Groups CRUD | שושי (Primary) · תמר: NavBar + Review |
| 3 | Invitations | תמר — **✅ merged** · [PR #9](https://github.com/ShoshiS/group-chat-app/pull/9) |
| 4–5 | Messages + Socket.io + Media | שושי |
| 5 | Admin + Profile | תמר — **✅ הושלם** · PR pending |
| 6 | Docs, Responsive, Demo, Deploy (Render — בונוס) | שתיהן |

**דדליין הגשה:** י"א כסלו תשפ"ו (לפי מסמך הדרישות)

---

## מסמכי קדם-הגשה (חובה)

1. **`docs/server-analysis.md`** — תרשים פעולות לפי סוג משתמש (Mermaid flowchart)
2. **`docs/database-analysis.md`** — 4 collections, שדות, refs, validation rules
3. **`docs/screens-analysis.md`** — כל מסך + רשימת קומפוננטות + routing tree

---

## הגשה סופית — Checklist

- [ ] GitHub Monorepo עם README מלא
- [ ] `server/.env.example` + `client/.env.example`
- [ ] Server README + Client README
- [ ] MongoDB Atlas connection / Compass export
- [ ] Thunder Client collection (מומלץ)
- [ ] Demo: שתיהן מציגות כל חלק (Auth, Groups, Invitations, Chat, Admin, Real-time)
- [ ] (בונוס) Deploy ל-Render

---

## Git Workflow מומלץ

```
main
├── feature/auth          (תמר)
├── feature/groups        (שושי)
├── feature/invitations   (תמר)
├── feature/chat-realtime (שושי)
└── feature/polish        (שתיהן)
```

כל feature branch → Pull Request → Review על ידי הפרטנרית → Merge ל-main.
